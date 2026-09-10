/** Helper: Text so vereinheitlichen, dass Vergleiche stabil bleiben. */

export function normalizeText(raw: string): string {
    return raw
        .replace(/\r\n?/g, '\n')
        .replace(/[   ]/g, ' ')
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}
