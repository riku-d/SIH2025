/**
 * Thin streaming client for Gemini. Deliberately not the SDK — we need one
 * call shape, and an extra dependency is one more thing to break the night
 * before a demo.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Read per call, not at import. server.js runs dotenv.config() after its
 * imports have already been evaluated, so anything captured at module scope
 * sees an empty process.env — which silently pinned this to the default and
 * ignored GEMINI_MODEL entirely.
 */
export const model = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * The free tier meters requests per day *per model* — 20 each, in separate
 * buckets. So the way to survive a demo without billing is not to use fewer
 * requests but to spread them: the written answer, which is what people
 * judge, keeps the best model to itself, while transcription and summaries
 * run on a cheaper one that reads audio just as accurately.
 */
export const utilityModel = () =>
    process.env.GEMINI_UTILITY_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Tried in order when a model returns 429. Each entry is another day's worth
 * of quota, so a demo degrades to a different model rather than to an error.
 */
const fallbacks = () => (process.env.GEMINI_FALLBACK_MODELS || '')
    .split(',')
    .map(m => m.trim())
    .filter(Boolean);

export class GeminiError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

function apiKey() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new GeminiError('not_configured', 'GEMINI_API_KEY is not set');
    return key;
}

/**
 * Medical questions describe symptoms, injuries and self-harm, which the
 * default thresholds treat as dangerous content. Blocking only the high
 * end keeps a patient describing chest pain from being refused outright.
 */
const SAFETY_SETTINGS = [
    'HARM_CATEGORY_HARASSMENT',
    'HARM_CATEGORY_HATE_SPEECH',
    'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    'HARM_CATEGORY_DANGEROUS_CONTENT'
].map(category => ({ category, threshold: 'BLOCK_ONLY_HIGH' }));

async function attempt(path, body, signal, modelName) {
    return fetch(`${ENDPOINT}/${modelName}:${path}&key=${apiKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal
    });
}

/**
 * Transient upstream failures worth moving past.
 *
 * 429 is our own quota; 503 is Gemini itself under load, which it returns as
 * "high demand … usually temporary". Both are reasons to try another model,
 * and 503 in particular is not a quota problem at all — failing fast on it
 * only turned a passing spike into a dead assistant.
 */
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Walks the model then its fallbacks, moving on for anything transient.
 * A hard failure — bad key, malformed request — is the same on every model,
 * so that still fails immediately rather than spending the whole chain.
 *
 * Nothing has been written to the client yet at this point, so switching
 * models here is invisible to the user.
 */
async function callGemini(path, body, signal, modelName = model()) {
    const chain = [modelName, ...fallbacks().filter(m => m !== modelName)];
    let lastStatus = 0;
    let lastDetail = '';

    for (const candidate of chain) {
        // Two goes at each model: an overloaded one often clears in a second,
        // and that is cheaper than burning the next model's daily quota.
        for (let attemptNo = 0; attemptNo < 2; attemptNo++) {
            if (signal?.aborted) throw new GeminiError('aborted', 'Client went away');

            const res = await attempt(path, body, signal, candidate);
            if (res.ok) {
                if (candidate !== modelName) {
                    console.warn(`Gemini: ${modelName} unavailable (${lastStatus}), answered with ${candidate}`);
                }
                return res;
            }

            const detail = await res.text().catch(() => '');
            if (res.status === 401 || res.status === 403) throw new GeminiError('unauthorized', detail);
            if (!RETRYABLE.has(res.status)) {
                throw new GeminiError('upstream', `${res.status} ${detail.slice(0, 300)}`);
            }

            lastStatus = res.status;
            lastDetail = detail;

            // Only pause when a second go at this model could actually help.
            const worthRetrying = res.status !== 429 && attemptNo === 0;
            if (worthRetrying) await sleep(700);
            else break;
        }
    }

    // Distinguish "we are out of quota" from "Gemini is busy": the first is
    // fixed by waiting a day or adding a model, the second by waiting a minute.
    throw new GeminiError(lastStatus === 429 ? 'rate_limit' : 'busy', lastDetail);
}

/**
 * Yields text chunks as they arrive. Gemini's SSE frames are one JSON
 * object per `data:` line, terminated by CRLF CRLF, and a frame can be
 * split across reads — so the buffer is drained by frame boundary rather
 * than per read. Raw CRs are stripped first: they only ever appear as
 * line endings here, since a CR inside JSON arrives escaped as \r.
 */
export async function* streamChat({ systemInstruction, contents, signal, maxOutputTokens = 2400, meta = {} }) {
    const res = await callGemini('streamGenerateContent?alt=sse', {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
            temperature: 0.6,
            maxOutputTokens,
            // Reasoning helps the medical answer, but it spends the same
            // budget as the reply — so the cap has to cover both.
            thinkingConfig: { thinkingBudget: 512 }
        }
    }, signal);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '');

        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            for (const text of readFrame(frame, meta)) yield text;
        }
    }

    // A well-formed stream ends on a boundary, but a truncated one leaves a
    // final frame in the buffer. Dropping it would silently lose the answer's
    // last words, which is worse than rendering a slightly short reply.
    if (buffer.trim()) {
        for (const text of readFrame(buffer, meta)) yield text;
    }
}

/** Parses one SSE frame into zero or one text chunks. */
function* readFrame(frame, meta = {}) {
    const line = frame.split('\n').find(l => l.startsWith('data:'));
    if (!line) return;

    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') return;

    let parsed;
    try {
        parsed = JSON.parse(payload);
    } catch {
        return; // an incomplete frame; the next read completes it
    }

    const candidate = parsed?.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text).filter(Boolean).join('') || '';
    if (text) yield text;

    const reason = candidate?.finishReason;

    // MAX_TOKENS still delivered usable text, so it does not fail the turn —
    // but the answer stops mid-sentence, and medical guidance that trails off
    // without saying when to see a doctor should not look complete.
    if (reason === 'MAX_TOKENS') meta.truncated = true;

    if (reason && reason !== 'STOP' && reason !== 'MAX_TOKENS') {
        throw new GeminiError('blocked', `finishReason ${reason}`);
    }
}

/**
 * One-shot call for short internal jobs: summaries, transcription.
 *
 * Thinking is switched off here, and that is not an optimisation — thinking
 * tokens are drawn from the same maxOutputTokens budget as the reply. A
 * doctor handover summary was spending 380 of its 400 tokens reasoning and
 * emitting one truncated bullet, silently dropping the patient's chest pain.
 * None of these jobs need reasoning: they transcribe or condense text that
 * is already in front of them.
 */
export async function generateOnce({ systemInstruction, contents, signal, maxOutputTokens = 600, temperature = 0.2 }) {
    const res = await callGemini('generateContent?', {
        ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        contents,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: { temperature, maxOutputTokens, thinkingConfig: { thinkingBudget: 0 } }
    }, signal, utilityModel());

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('') || '';
}
