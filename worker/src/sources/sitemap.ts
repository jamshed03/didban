import { extractLocs, fetchText, normalizeUrls, reportSkipped, sitemapRoot } from '../helpers/index.ts'
import type { SourceOptions, UrlSource, UrlSourceType } from '../types/index.ts'

interface CrawlState {
    readonly visited: Set<string>
    depthLimitReached: boolean
}

export class SitemapSource implements UrlSource {
    readonly type: UrlSourceType = 'sitemap'

    constructor(private readonly sitemapUrl: string, private readonly options: SourceOptions) {}

    get origin(): string {
        return this.sitemapUrl
    }

    async collect(): Promise<string[]> {
        const state: CrawlState = { visited: new Set(), depthLimitReached: false }
        const locs = await this.collectLocs(this.sitemapUrl, 0, state)
        const { urls, skipped } = normalizeUrls(locs)
        reportSkipped(skipped)

        if (urls.length === 0) {
            throw new Error(this.explainEmptyResult(state))
        }
        return urls
    }

    private explainEmptyResult(state: CrawlState): string {
        if (state.depthLimitReached) {
            return `Sitemap ${this.sitemapUrl} lieferte keine URL: alle verlinkten Sitemaps ` + `liegen tiefer als ${this.options.maxSitemapIndexDepth} Ebenen.\n` + 'maxSitemapIndexDepth in didban.config.json erhöhen.'
        }
        return `Sitemap ${this.sitemapUrl} enthält keine gültige URL.\n` + 'Zeigt SITE_SITEMAP_URL wirklich auf die sitemap.xml und nicht auf die Startseite?'
    }

    /**
     * Lädt eine Sitemap und liefert deren <loc>-Werte.
     */
    private async collectLocs(url: string, depth: number, state: CrawlState): Promise<string[]> {
        if (state.visited.has(url)) return []
        state.visited.add(url)

        const xml = await fetchText(url, {
            ...this.options.http,
            accept: 'application/xml,text/xml,*/*',
        })

        const root = sitemapRoot(xml)
        if (root === undefined) {
            throw new Error(`${url} ist keine Sitemap — es fehlt ein <urlset>- oder <sitemapindex>-Element.`)
        }

        const locs = extractLocs(xml)
        if (root === 'urlset') return locs

        if (depth >= this.options.maxSitemapIndexDepth) {
            state.depthLimitReached = true
            console.warn(`  Sitemap-Index tiefer als ${this.options.maxSitemapIndexDepth} Ebenen, ` + `brechen bei ${url} ab`)
            return []
        }

        console.log(`  Sitemap-Index: ${locs.length} weitere Sitemap(s)`)
        const nested: string[] = []
        for (const child of locs) {
            nested.push(...(await this.collectLocs(child, depth + 1, state)))
        }
        return nested
    }
}
