import { offlineAnswer } from '../assistant/offlineFallback.js';

/**
 * The pre-AI symptom checker. Its five hardcoded rules were never called by
 * any screen; they now back the assistant's offline path instead of being
 * deleted, because a correct pre-written answer is genuinely useful when the
 * model is unreachable.
 *
 * Kept on its original route so nothing that already points here breaks.
 */
export const querySymptoms = async (req, res) => {
    try {
        const { text, lang } = req.body;
        const answer = offlineAnswer(text, lang);
        res.json({
            suggestions: [{ condition: answer.matched ? 'General first aid' : 'Unknown', advice: answer.text }],
            ...answer
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
