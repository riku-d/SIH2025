/**
 * Pulls the suggested follow-ups off the end of a finished answer.
 *
 * Parsed after the stream rather than during it: unlike the spoken summary
 * these are not needed early, and a marker at the very end never risks
 * holding back the first words of the reply.
 *
 * Tolerant by design — models close this block with [/NEXT], with a second
 * [NEXT], or not at all, and a stray tag in a medical answer looks like a
 * broken app.
 */
const OPEN = /\[NEXT\]/i;
const ANY_TAG = /\[\/?NEXT\]/gi;

export function extractFollowUps(text) {
    const source = String(text || '');
    const start = source.search(OPEN);
    // No opening tag, but a stray closing one can still be present.
    if (start === -1) return { body: source.replace(ANY_TAG, '').trimEnd(), followUps: [] };

    const after = source.slice(start).replace(OPEN, '');
    // Ends at whichever closing form the model chose, or at the end of the text.
    const endMatch = after.match(ANY_TAG);
    const raw = endMatch ? after.slice(0, after.search(ANY_TAG)) : after;

    const followUps = raw
        .split('|')
        .map(q => q.trim().replace(/^[-*\d.\s]+/, ''))
        .filter(q => q.length > 3 && q.length < 120)
        .slice(0, 3);

    // Everything from the first tag onward is metadata, plus any orphan tag
    // that ended up earlier in the answer.
    const body = source.slice(0, start).replace(ANY_TAG, '').trimEnd();
    return { body, followUps };
}

/** Strips a partial marker mid-stream so users never see "[NE" appear. */
export function hideTrailingMarker(text) {
    return String(text).replace(/\[N(E(X(T(\][\s\S]*)?)?)?)?$/i, '');
}
