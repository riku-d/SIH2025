import { streamChat, generateOnce, GeminiError, model } from '../assistant/gemini.js';
import { buildSystemPrompt, HELP_TYPES, GREETING } from '../assistant/prompts.js';
import { hasRedFlag, ESCALATION_SPOKEN } from '../assistant/redFlags.js';
import { createSpokenSplitter, stripMarkers } from '../assistant/spokenSplit.js';
import { extractFollowUps, hideTrailingMarker } from '../assistant/followUps.js';
import { transcribeAudio } from '../assistant/transcribe.js';
import { retrieveContext } from '../rag/retrieve.js';
import { offlinePack } from '../assistant/offlineFallback.js';

const VERBATIM_TURNS = 8;
const SUMMARISE_ABOVE = 12;
const MAX_FILES_PER_TURN = 3;
const ALLOWED_MIME = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf|audio\/(webm|ogg|mp4|mpeg|wav))$/;

/** One JSON object per SSE frame; the client parses `data:` lines only. */
function send(res, event) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function normaliseLang(lang) {
    return ['en', 'hi', 'pa'].includes(lang) ? lang : 'en';
}

/**
 * Turns our message list into Gemini `contents`. Files are re-validated
 * here rather than trusted from the client — this is the only place that
 * decides what reaches the model.
 */
function toContents(messages) {
    return messages.map(msg => {
        const parts = [];
        if (msg.text && String(msg.text).trim()) parts.push({ text: String(msg.text).slice(0, 4000) });

        for (const file of (msg.files || []).slice(0, MAX_FILES_PER_TURN)) {
            if (!file?.data || !ALLOWED_MIME.test(file.mimeType || '')) continue;
            parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
        }

        // Gemini rejects empty parts, and an empty turn carries no meaning.
        if (!parts.length) return null;
        return { role: msg.role === 'assistant' ? 'model' : 'user', parts };
    }).filter(Boolean);
}

export const chat = async (req, res) => {
    const { helpType, lang, messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: 'messages is required' });
    }

    const locale = normaliseLang(lang);
    const task = HELP_TYPES.includes(helpType) ? helpType : 'medical_assistance';
    const history = messages.slice(-40);
    const contents = toContents(history.slice(-VERBATIM_TURNS));

    if (!contents.length) {
        return res.status(400).json({ message: 'No usable message content' });
    }

    // Headers before any body write, and before the first await that could throw.
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no' // nginx would otherwise buffer the whole stream
    });
    res.flushHeaders?.();

    const controller = new AbortController();
    res.on('close', () => controller.abort());

    // Escalate on the patient's own words, before the model is called, and
    // on every turn — not only the first message of the conversation.
    const latest = [...history].reverse().find(m => m.role !== 'assistant');
    if (hasRedFlag(latest?.text)) {
        send(res, { type: 'redflag', spoken: ESCALATION_SPOKEN[locale] });
    }

    /**
     * Older turns are compressed instead of resent. Left alone, every turn
     * re-uploads the whole conversation — including any photos — so both
     * cost and time-to-first-token climb for the rest of the session, on
     * exactly the connections least able to afford it.
     */
    let earlierSummary = '';
    if (history.length > SUMMARISE_ABOVE) {
        earlierSummary = await summariseEarlier(history.slice(0, -VERBATIM_TURNS)).catch(() => '');
    }

    /**
     * Retrieval runs against the patient's latest words only — the whole
     * transcript would drag in every earlier topic and blur the query.
     *
     * patientId comes from the verified token, never from the request body:
     * a client that could name its own patientId could read another
     * patient's records.
     */
    const { text: retrieved, citations } = await retrieveContext({
        query: latest?.text || '',
        patientId: req.user?.id
    });

    if (citations.length) send(res, { type: 'citations', items: citations });

    const systemInstruction = buildSystemPrompt({
        helpType: task,
        lang: locale,
        retrieved,
        patientContext: earlierSummary ? `Earlier in this conversation:\n${earlierSummary}` : ''
    });

    const splitter = createSpokenSplitter();
    const meta = {};
    let full = '';
    let spokenSummary = '';

    try {
        for await (const chunk of streamChat({ systemInstruction, contents, signal: controller.signal, meta })) {
            const { spoken, body } = splitter.push(chunk);

            // Sent first and on its own so the client can start speaking
            // before the written answer has finished arriving.
            if (spoken) {
                spokenSummary = spoken;
                send(res, { type: 'spoken', text: spoken });
            }
            if (body) {
                // Held back rather than streamed, so a half-written [NEXT]
                // marker never flickers into the transcript.
                const beforeLen = hideTrailingMarker(full).length;
                full += body;
                const visible = hideTrailingMarker(full);
                if (visible.length > beforeLen) {
                    send(res, { type: 'delta', text: visible.slice(beforeLen) });
                }
            }
        }

        const tail = splitter.flush();
        if (tail.body) full += tail.body;

        // Last line of defence: `done` is what the client renders, so any
        // marker that slipped through every earlier check dies here.
        const { body, followUps } = extractFollowUps(stripMarkers(full));
        // `done` carries the authoritative text: the client replaces whatever
        // it accumulated, which also removes any marker it may have rendered.
        send(res, { type: 'done', text: body, spoken: spokenSummary, citations, followUps, truncated: Boolean(meta.truncated) });
    } catch (err) {
        if (controller.signal.aborted) return res.end(); // user pressed Stop
        console.error('Assistant stream failed:', err);

        const code = err instanceof GeminiError ? err.code : 'unknown';
        // A stream that already produced text keeps it; the client shows a
        // retry affordance on the partial message rather than losing it.
        send(res, { type: 'error', code, partial: full });
    } finally {
        res.end();
    }
};

/** Everything the client needs to open the assistant without a round trip per language. */
export const config = (req, res) => {
    const locale = normaliseLang(req.query.lang);
    res.json({
        model: model(),
        configured: Boolean(process.env.GEMINI_API_KEY),
        greeting: GREETING[locale],
        helpTypes: HELP_TYPES,
        // Cached by the client so it can still answer common questions with
        // no connection at all.
        offline: offlinePack(locale)
    });
};


/**
 * Voice note in, text out. Kept separate from /chat so the transcript can be
 * shown and corrected before it is sent, and so the red-flag check runs
 * against real words rather than an audio blob.
 */
export const transcribe = async (req, res) => {
    const { mimeType, data, lang } = req.body || {};

    if (!data || !/^audio\//.test(mimeType || '')) {
        return res.status(400).json({ message: 'An audio recording is required' });
    }

    try {
        const result = await transcribeAudio({ mimeType, data, hintLang: normaliseLang(lang) });
        res.json({
            ...result,
            // The escalation decision belongs to the server: the client only
            // ever sees the transcript, and voice must not be a way around it.
            urgent: hasRedFlag(result.text),
            escalationSpoken: hasRedFlag(result.text) ? ESCALATION_SPOKEN[result.lang] : undefined
        });
    } catch (err) {
        console.error('Transcription failed:', err);
        const code = err instanceof GeminiError ? err.code : 'unknown';
        // 'busy' is Gemini under load and clears on its own; the client says
        // "try again in a moment" rather than "that recording failed", which
        // would send the user off to re-record for no reason.
        const status = code === 'rate_limit' ? 429 : code === 'busy' ? 503 : 502;
        res.status(status).json({ message: 'transcription_failed', code });
    }
};


/**
 * Turns the conversation into a complaint a doctor can read in ten seconds.
 *
 * The booking form previously received the raw text the patient typed. A
 * doctor opening the consultation should instead see what was described, for
 * how long, and what was already suggested — without reading the transcript.
 */
export const summarise = async (req, res) => {
    const { messages, lang } = req.body || {};
    if (!Array.isArray(messages) || !messages.length) {
        return res.status(400).json({ message: 'messages is required' });
    }

    const locale = normaliseLang(lang);
    const transcript = messages
        .filter(m => m.text)
        .map(m => `${m.role === 'assistant' ? 'Assistant' : 'Patient'}: ${m.text}`)
        .join('\n')
        .slice(0, 8000);

    try {
        const text = await generateOnce({
            systemInstruction: `Summarise this patient's own account for the doctor who will see them.

Write 3 to 5 short lines, in ${locale === 'hi' ? 'Hindi' : locale === 'pa' ? 'Punjabi' : 'English'}:
- What they are complaining of, in their own words
- How long it has been going on
- Anything relevant they mentioned (medicines, existing conditions, what they already tried)
- Any red-flag symptom they described

Facts only, taken from what the patient said. Do not diagnose, do not suggest treatment, and do not invent detail that is not in the conversation.`,
            contents: [{ role: 'user', parts: [{ text: transcript }] }],
            maxOutputTokens: 400,
            temperature: 0.1
        });

        res.json({ summary: text.trim() });
    } catch (err) {
        console.error('Summary failed:', err);
        // The booking must still work; it just falls back to the raw words.
        res.status(200).json({ summary: '' });
    }
};


/**
 * Compresses the older half of a long conversation into a few lines. Text
 * only — images from ten turns ago are not worth re-uploading, and what they
 * showed is already in the summary.
 */
async function summariseEarlier(older) {
    const transcript = older
        .filter(m => m.text)
        .map(m => `${m.role === 'assistant' ? 'Assistant' : 'Patient'}: ${m.text}`)
        .join('\n')
        .slice(0, 6000);

    if (transcript.length < 200) return '';

    return generateOnce({
        systemInstruction: 'Compress this conversation into at most five short bullet points: what the patient reported, what was suggested, and anything still unresolved. Facts only, no advice.',
        contents: [{ role: 'user', parts: [{ text: transcript }] }],
        maxOutputTokens: 300,
        temperature: 0
    });
}
