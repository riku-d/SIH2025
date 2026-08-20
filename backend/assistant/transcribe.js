import { generateOnce, GeminiError } from './gemini.js';

/**
 * Speech to text.
 *
 * Deliberately one function with a swappable body: browser SpeechRecognition
 * is absent on iOS Safari and unreliable for pa-IN, and Bhashini needs an
 * account we may not have on demo day. Sending the recording to the model we
 * already call works everywhere MediaRecorder does, and handles the way rural
 * users actually speak — dialect, and Hinglish mid-sentence.
 *
 * To move to Bhashini, replace the body of transcribeAudio and keep the
 * { text, lang } contract.
 */

const LANGUAGE_NAMES = { en: 'English', hi: 'Hindi', pa: 'Punjabi' };

const INSTRUCTION = `You transcribe short voice notes from patients in rural India.

Return ONLY a JSON object, no code fence, in this exact shape:
{"text": "<what they said, word for word>", "lang": "<en|hi|pa>"}

Rules:
- Transcribe verbatim in the script of the language spoken: Devanagari for Hindi, Gurmukhi for Punjabi, Latin for English.
- People mix English words into Hindi and Punjabi. Keep those words, and set lang to the sentence's main language.
- If the audio is silent or unintelligible, return {"text": "", "lang": "en"}.
- Never answer the question, explain, or add anything the speaker did not say.`;

/** Models wrap JSON in fences often enough that it is not worth failing over. */
function parseLoose(raw) {
    const cleaned = String(raw).replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return null;
        try { return JSON.parse(match[0]); } catch { return null; }
    }
}

export async function transcribeAudio({ mimeType, data, hintLang, signal }) {
    if (!data) throw new GeminiError('bad_request', 'No audio supplied');

    const hint = LANGUAGE_NAMES[hintLang]
        ? `\n\nThe app is currently set to ${LANGUAGE_NAMES[hintLang]}, but trust the audio over that.`
        : '';

    const raw = await generateOnce({
        systemInstruction: INSTRUCTION + hint,
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data } }] }],
        maxOutputTokens: 800,
        temperature: 0,
        signal
    });

    const parsed = parseLoose(raw);
    if (!parsed) return { text: String(raw).trim().slice(0, 2000), lang: hintLang || 'en' };

    return {
        text: String(parsed.text || '').trim().slice(0, 2000),
        lang: LANGUAGE_NAMES[parsed.lang] ? parsed.lang : (hintLang || 'en')
    };
}
