/** Helper: URL-Listen vereinheitlichen. */

export interface SkippedUrl {
    readonly value: string
    readonly reason: string
}

export interface NormalizedUrls {
    readonly urls: string[]
    readonly skipped: SkippedUrl[]
}

export function normalizeUrls(raw: readonly string[]): NormalizedUrls {
    const urls: string[] = []
    const skipped: SkippedUrl[] = []
    const seen = new Set<string>()

    for (const entry of raw) {
        const value = entry.trim()
        if (value === '' || value.startsWith('#')) continue

        let parsed: URL
        try {
            parsed = new URL(value)
        } catch {
            skipped.push({ value, reason: 'keine gültige URL' })
            continue
        }

        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            skipped.push({ value, reason: `Protokoll ${parsed.protocol} wird nicht geprüft` })
            continue
        }

        parsed.hash = ''
        const normalized = parsed.toString()

        if (seen.has(normalized)) continue
        seen.add(normalized)
        urls.push(normalized)
    }

    return { urls, skipped }
}

export function reportSkipped(skipped: readonly SkippedUrl[]): void {
    for (const entry of skipped) {
        console.warn(`  übersprungen: ${entry.value} (${entry.reason})`)
    }
}
