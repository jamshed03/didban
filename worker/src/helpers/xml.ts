/** Trifft ein Element mit optionalem Namespace-Präfix. */
const LOC_PATTERN = /<(?:[A-Za-z0-9._-]+:)?loc\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9._-]+:)?loc\s*>/gi
const ROOT_PATTERN = /<(?:[A-Za-z0-9._-]+:)?(urlset|sitemapindex)[\s>]/i

/** Zieht die <loc>-Werte aus einer Sitemap. */
export function extractLocs(xml: string): string[] {
    const values: string[] = []

    for (const match of xml.matchAll(LOC_PATTERN)) {
        const inner = match[1]
        if (inner === undefined) continue
        values.push(decodeXmlText(inner))
    }
    return values
}

export function sitemapRoot(xml: string): 'urlset' | 'sitemapindex' | undefined {
    const root = ROOT_PATTERN.exec(xml)?.[1]?.toLowerCase()
    return root === 'urlset' || root === 'sitemapindex' ? root : undefined
}

/** Löst CDATA-Blöcke und die üblichen XML-Entities auf. */
export function decodeXmlText(raw: string): string {
    const withoutCdata = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')

    return withoutCdata
        .trim()
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
        .replace(/&amp;/g, '&')
}
