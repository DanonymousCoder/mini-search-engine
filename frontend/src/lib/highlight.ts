export interface Segment {
    text: string;
    match: boolean;
}

const WORD = /[0-9A-Za-z\u0080-￿]+(?:'[0-9A-Za-z\u0080-￿]+)*/g;

const asciiLower = (s: string) => s.replace(/[A-Z]/g, (c) => String.fromCharCode(c.charCodeAt(0) +32));

export function splitHighights(text: string, terms: readonly string[]): Segment[] {
    if (!text) return [];
    if (terms.length === 0) return [{ text, match: false }];
    const wanted = new Set(terms);
    const out: Segment[] = [];
    let last = 0;
    for (const m of text.matchAll(WORD)) {
        const word = m[0];
        const start = m.index ?? 0;
        if (!wanted.has(asciiLower(word.replace(/'/g, '')))) continue;
        if (start > last ) out.push({text: text.slice(last, start), match: false});
        out.push({text: word, match: true});
        last = start + word.length;
    }

    if (last < text.length) out.push({ text: text.slice(last), match:false });
    return out;
}
