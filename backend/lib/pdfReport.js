import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontDir = (pkg, file) => path.join(__dirname, '..', 'node_modules', '@fontsource', pkg, 'files', file);

/**
 * Scripts the record might be written in.
 *
 * pdfkit's built-in Helvetica has no Devanagari or Gurmukhi glyphs, and it
 * fails silently — the text simply does not appear. A patient whose doctor
 * wrote the diagnosis in Hindi was handed a medical record with the diagnosis
 * missing and no indication anything was lost.
 */
const FONTS = {
    latin: {
        regular: fontDir('noto-sans', 'noto-sans-latin-400-normal.woff'),
        bold: fontDir('noto-sans', 'noto-sans-latin-700-normal.woff')
    },
    devanagari: {
        regular: fontDir('noto-sans-devanagari', 'noto-sans-devanagari-devanagari-400-normal.woff'),
        bold: fontDir('noto-sans-devanagari', 'noto-sans-devanagari-devanagari-700-normal.woff')
    },
    /**
     * Serif, not sans, for Gurmukhi: Noto Sans Gurmukhi ships a null mark
     * anchor that makes fontkit throw while shaping, which would take the
     * whole download down rather than spoil one line. The serif cut shapes
     * cleanly and reads well at this size.
     */
    gurmukhi: {
        regular: fontDir('noto-serif-gurmukhi', 'noto-serif-gurmukhi-gurmukhi-400-normal.woff'),
        bold: fontDir('noto-serif-gurmukhi', 'noto-serif-gurmukhi-gurmukhi-700-normal.woff')
    }
};

const INK = '#0E1A1B';
const BODY = '#31474A';
const MUTED = '#66797B';
const LINE = '#DAE5E3';
const BRAND = '#0B5F63';
const PAGE = { margin: 48, width: 595.28, height: 841.89 };

/**
 * The danda (U+0964) and double danda (U+0965) sit in the Devanagari block
 * but are shared punctuation — Punjabi uses them too. Testing the whole
 * block therefore matched Gurmukhi sentences, picked the Devanagari face for
 * them, and dropped every Gurmukhi glyph: the exact silent-loss bug this
 * module exists to prevent. Match Devanagari letters only.
 */
const hasDevanagari = (text) => /[\u0900-\u0963\u0966-\u097F]/.test(text || '');
const hasGurmukhi = (text) => /[\u0A00-\u0A7F]/.test(text || '');

/** Registers whichever scripts this document actually needs. */
function registerFonts(doc, sample) {
    const wanted = ['latin'];
    if (hasDevanagari(sample)) wanted.push('devanagari');
    if (hasGurmukhi(sample)) wanted.push('gurmukhi');

    const registered = [];
    for (const script of wanted) {
        const files = Object.entries(FONTS[script]);
        // Only claim a script once both weights are actually on disk —
        // doc.font() throws on an unregistered name, which would take down
        // the whole download rather than degrade one line.
        if (!files.every(([, file]) => fs.existsSync(file))) {
            console.warn(`PDF: ${script} font missing, falling back to Latin`);
            continue;
        }
        for (const [weight, file] of files) doc.registerFont(`${script}-${weight}`, file);
        registered.push(script);
    }
    return registered;
}

/**
 * Picks a font that can actually draw this string. Mixed-script lines are
 * common — "Paracetamol 500mg दिन में दो बार" — and the Indic faces carry
 * Latin too, so choosing by the non-Latin script keeps the whole line intact.
 */
function fontFor(text, weight, available) {
    if (hasGurmukhi(text) && available.includes('gurmukhi')) return `gurmukhi-${weight}`;
    if (hasDevanagari(text) && available.includes('devanagari')) return `devanagari-${weight}`;
    return `latin-${weight}`;
}

/**
 * Groups consecutive characters that share a font. Whitespace and shared
 * punctuation attach to the run in progress rather than starting a new one,
 * which keeps a sentence from being chopped at every space.
 */
function splitByScript(text, available) {
    const runs = [];
    for (const char of String(text)) {
        // Neutral characters — spaces, and the danda that ends a sentence in
        // both Hindi and Punjabi — stay with the run in progress. Sending the
        // danda to Latin drew it as an empty box at the end of every Indic
        // sentence, which is exactly how it looked before.
        const script = NEUTRAL.test(char) ? null : scriptOf(char, available);
        const current = runs[runs.length - 1];

        if (current && (script === null || script === current.script)) {
            current.text += char;
        } else if (!current && script === null) {
            // Nothing to attach to yet: a danda needs an Indic face, a space
            // does not care.
            const fallback = /[\u0964\u0965]/.test(char) && available.includes('devanagari') ? 'devanagari' : 'latin';
            runs.push({ script: fallback, text: char });
        } else {
            runs.push({ script, text: char });
        }
    }
    return runs.length ? runs : [{ script: 'latin', text: '' }];
}

const NEUTRAL = /[\s\u0964\u0965]/;

function scriptOf(char, available) {
    if (hasGurmukhi(char) && available.includes('gurmukhi')) return 'gurmukhi';
    if (hasDevanagari(char) && available.includes('devanagari')) return 'devanagari';
    return 'latin';
}

/** Dates the patient recognises. Server locale was neither theirs nor stable. */
function formatDate(value) {
    const d = new Date(value);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function createReport({ patient, records, title, single = false }) {
    const sample = [
        patient.name, patient.village,
        ...records.flatMap(r => [r.diagnosis, r.prescription])
    ].join(' ');

    const doc = new PDFDocument({
        size: 'A4',
        margin: PAGE.margin,
        // Required for the footer: page numbers cannot be written until the
        // total is known, which means revisiting pages after the fact.
        bufferPages: true,
        // Shown by the PDF viewer's title bar and by most print dialogs.
        info: {
            Title: `${title} — ${patient.name}`,
            Author: 'GramSathi',
            Subject: 'Patient health record'
        }
    });

    const available = registerFonts(doc, sample);
    const write = (text, { size = 10.5, weight = 'regular', color = BODY, x, y, ...opts } = {}) => {
        const value = String(text);
        doc.fontSize(size).fillColor(color);

        /**
         * Rendered as a chain of same-script runs.
         *
         * The Noto subsets are per-script: the Devanagari file carries no
         * Latin glyphs at all, so a real prescription like
         * "पैरासिटामोल 500mg दिन में दो बार" drew the dose as empty boxes —
         * the one part a pharmacist must be able to read. Each run gets the
         * font that can actually draw it, joined with `continued` so the
         * line still wraps as one paragraph.
         */
        const runs = splitByScript(value, available);

        runs.forEach((run, i) => {
            const isLast = i === runs.length - 1;
            const runOpts = i === 0
                ? { ...opts, continued: !isLast }
                : { continued: !isLast };

            /* pdfkit's signature is text(str, x, y, options) — x and y passed
               inside the options object are ignored outright, which is why
               every indented block was silently drawing at the left margin,
               on top of the accent bar. Only the first run is positioned;
               the rest continue the line. */
            const draw = (font) => (i === 0 && x !== undefined)
                ? doc.font(font).text(run.text, x, y, runOpts)
                : doc.font(font).text(run.text, runOpts);

            try {
                draw(`${run.script}-${weight}`);
            } catch (err) {
                // One malformed glyph run must not cost the patient the whole
                // download; fall back to Latin and keep going.
                console.warn('PDF: falling back to Latin for one run —', err.message);
                draw(`latin-${weight}`);
            }
        });
    };

    const contentWidth = PAGE.width - PAGE.margin * 2;

    letterhead(doc, write, contentWidth, title);
    patientBlock(doc, write, contentWidth, patient);

    if (!records.length) {
        doc.moveDown(1.5);
        write('No health records yet.', { color: MUTED });
    } else {
        records.forEach((record, i) => {
            // Keep a record's heading with at least its first lines rather
            // than stranding "Visit 3" alone at the foot of a page.
            if (doc.y > PAGE.height - 200) doc.addPage();
            else if (i > 0) doc.moveDown(1.2);
            recordBlock(doc, write, contentWidth, record, single ? null : i + 1);
        });
    }

    footer(doc, write, contentWidth);
    return doc;
}

function letterhead(doc, write, width, title) {
    const top = doc.y;
    doc.roundedRect(PAGE.margin, top, 30, 30, 7).fill(BRAND);
    doc.font('latin-bold').fontSize(16).fillColor('#FFFFFF')
       .text('G', PAGE.margin, top + 7, { width: 30, align: 'center' });

    doc.font('latin-bold').fontSize(15).fillColor(INK)
       .text('GramSathi', PAGE.margin + 40, top + 2);
    doc.font('latin-regular').fontSize(9).fillColor(MUTED)
       .text('Telemedicine for rural healthcare', PAGE.margin + 40, top + 19);

    doc.font('latin-bold').fontSize(12).fillColor(BRAND)
       .text(title, PAGE.margin, top + 4, { width, align: 'right' });

    doc.y = top + 42;
    doc.strokeColor(BRAND).lineWidth(1.5)
       .moveTo(PAGE.margin, doc.y).lineTo(PAGE.margin + width, doc.y).stroke();
    doc.y += 16;
}

function patientBlock(doc, write, width, patient) {
    const top = doc.y;
    doc.roundedRect(PAGE.margin, top, width, 58, 6).fillAndStroke('#F6F9F8', LINE);

    const pad = 12;
    write(patient.name, { size: 13, weight: 'bold', color: INK, x: PAGE.margin + pad, y: top + pad, width: width - pad * 2 });

    const facts = [
        patient.age ? `Age ${patient.age}` : null,
        patient.village || null,
        patient.phone || null
    ].filter(Boolean).join('   ·   ');

    write(facts || 'Patient', { size: 9.5, color: MUTED, x: PAGE.margin + pad, y: top + pad + 20, width: width - pad * 2 });
    doc.y = top + 58 + 18;
}

function recordBlock(doc, write, width, record, index) {
    const doctor = record.appointmentId?.doctorId;

    // A dated strip so someone flipping through finds the visit they want.
    const top = doc.y;
    doc.rect(PAGE.margin, top + 1, 3, 13).fill(BRAND);
    write(
        index ? `Visit ${index} · ${formatDate(record.createdAt)}` : formatDate(record.createdAt),
        { size: 11, weight: 'bold', color: INK, x: PAGE.margin + 14, y: top, width: width - 14 }
    );
    doc.y = top + 16;

    if (doctor?.name) {
        write(`Seen by ${doctor.name}${doctor.specialization ? ` · ${doctor.specialization}` : ''}`,
              { size: 9.5, color: MUTED, x: PAGE.margin + 14, width: width - 14 });
    }

    doc.y += 8;
    section(doc, write, width, 'Diagnosis', record.diagnosis);
    if (record.prescription) section(doc, write, width, 'Prescription', record.prescription);
}

function section(doc, write, width, label, value) {
    write(label.toUpperCase(), {
        size: 8, weight: 'bold', color: MUTED, characterSpacing: 0.8,
        x: PAGE.margin + 14, width: width - 14
    });
    doc.y += 2;
    write(value || '—', { size: 10.5, color: BODY, x: PAGE.margin + 14, width: width - 24, lineGap: 2 });
    doc.y += 8;
}

/**
 * Page numbers and provenance on every page. A record shown to a pharmacist
 * needs to say where it came from and whether a page is missing.
 */
function footer(doc, write, width) {
    const range = doc.bufferedPageRange();
    const generated = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const y = PAGE.height - PAGE.margin + 6;

        doc.strokeColor(LINE).lineWidth(0.5)
           .moveTo(PAGE.margin, y - 10).lineTo(PAGE.margin + width, y - 10).stroke();

        /* pdfkit refuses to draw text inside the bottom margin and would
           start a fresh page instead — which is why the footer was silently
           missing. Drop the margin for the two lines, then restore it. */
        const bottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        doc.font('latin-regular').fontSize(8).fillColor(MUTED)
           .text(`Generated by GramSathi on ${generated}`, PAGE.margin, y, { width: width / 2, lineBreak: false });

        doc.font('latin-regular').fontSize(8).fillColor(MUTED)
           .text(`Page ${i - range.start + 1} of ${range.count}`, PAGE.margin + width / 2, y,
                 { width: width / 2, align: 'right', lineBreak: false });

        doc.page.margins.bottom = bottom;
    }
}
