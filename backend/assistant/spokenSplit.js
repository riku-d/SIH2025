/**
 * Splits the spoken summary off the front of a streaming reply.
 *
 * The summary comes first precisely so text-to-speech can start talking
 * while the detailed answer is still arriving — reading a 400-word markdown
 * answer aloud is unusable, and waiting for it to finish before speaking
 * wastes the only part of the wait the user can do something with.
 *
 * Models comply with the markers unevenly: some omit the closing tag, some
 * skip the markers entirely. Every path below still produces a usable body,
 * and a stray marker never reaches the transcript.
 */
const OPEN = '[SPOKEN]';
const CLOSE = '[/SPOKEN]';
const LOOKAHEAD = 600;

/** Belt and braces — no marker token ever reaches the reader. */
export function stripMarkers(text) {
    return String(text || '')
        .replace(/\[\/?SPOKEN\]/gi, '')
        .replace(/^\s+/, '');
}

export function createSpokenSplitter() {
    let head = '';
    let done = false;

    /**
     * The model opened the summary but never closed it. The first paragraph
     * is the summary it meant to write, so take that and keep the rest.
     */
    const salvage = () => {
        const withoutOpen = head.replace(/^\s*\[SPOKEN\]\s*/i, '');
        const breakAt = withoutOpen.search(/\n\s*\n/);
        if (breakAt === -1) return { spoken: '', body: stripMarkers(head) };
        return {
            spoken: stripMarkers(withoutOpen.slice(0, breakAt)).trim(),
            body: stripMarkers(withoutOpen.slice(breakAt))
        };
    };

    return {
        push(chunk) {
            if (done) return { body: chunk };
            head += chunk;

            const closeAt = head.indexOf(CLOSE);
            if (closeAt !== -1) {
                const openAt = head.indexOf(OPEN);
                const from = openAt === -1 ? 0 : openAt + OPEN.length;
                const spoken = stripMarkers(head.slice(from, closeAt)).trim();
                const body = stripMarkers(head.slice(closeAt + CLOSE.length));
                done = true;
                head = '';
                return { spoken, body };
            }

            const opened = /^\s*\[SPOKEN\]/i.test(head);

            // An opened-but-unclosed summary: salvage once a paragraph break
            // shows where the summary ended.
            if (opened && /\n\s*\n/.test(head.replace(/^\s*\[SPOKEN\]\s*/i, ''))) {
                const result = salvage();
                done = true;
                head = '';
                return result;
            }

            // Might still become a marker — hold the text back rather than
            // render half of one.
            if (head.length < LOOKAHEAD && (opened || couldBecomeMarker(head))) return {};

            done = true;
            const body = stripMarkers(head);
            head = '';
            return { body };
        },

        flush() {
            if (done || !head) return {};
            const opened = /^\s*\[SPOKEN\]/i.test(head);
            const result = opened ? salvage() : { body: stripMarkers(head) };
            done = true;
            head = '';
            return result;
        }
    };
}

/** True while the buffer is still a prefix of the opening marker. */
function couldBecomeMarker(text) {
    const trimmed = text.replace(/^\s+/, '');
    return OPEN.startsWith(trimmed.slice(0, OPEN.length));
}
