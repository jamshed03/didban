import { chromium, type Browser, type BrowserContext } from 'playwright'
import { describeError, normalizeText } from '../helpers/index.ts'
import type { CrawlOptions, PageCapture } from '../types/index.ts'
import { extractMainText } from './extract.ts'

export class PageCrawler {
    private constructor(private readonly browser: Browser, private readonly context: BrowserContext, private readonly options: CrawlOptions) {}

    static async launch(options: CrawlOptions): Promise<PageCrawler> {
        const browser = await chromium.launch()
        const context = await browser.newContext({
            viewport: { width: options.viewportWidth, height: options.viewportHeight },
            userAgent: options.userAgent,
            deviceScaleFactor: 1,
            locale: 'de-DE',
            timezoneId: 'Europe/Berlin',
            reducedMotion: 'reduce',
        })
        context.setDefaultTimeout(options.pageTimeoutMs)

        return new PageCrawler(browser, context, options)
    }

    async capture(url: string): Promise<PageCapture> {
        const startedAt = Date.now()
        const page = await this.context.newPage()

        try {
            const response = await page.goto(url, {
                waitUntil: 'load',
                timeout: this.options.pageTimeoutMs,
            })

            if (response === null) {
                return this.failure(url, startedAt, 'Keine Antwort erhalten.')
            }

            const httpStatus = response.status()
            if (!response.ok()) {
                return this.failure(url, startedAt, `HTTP ${httpStatus}`, httpStatus)
            }

            await this.settle(page)

            const rawText = await page.evaluate(extractMainText)
            const screenshot = await page.screenshot({
                fullPage: true,
                type: 'png',
                // Ohne das erwischt jeder Lauf eine andere Animationsphase und
                // meldet Unterschiede, die niemand geändert hat.
                animations: 'disabled',
                caret: 'hide',
            })

            return {
                ok: true,
                url,
                text: normalizeText(rawText),
                screenshot,
                httpStatus,
                durationMs: Date.now() - startedAt,
            }
        } catch (error) {
            return this.failure(url, startedAt, describeError(error))
        } finally {
            await page.close()
        }
    }

    async close(): Promise<void> {
        await this.context.close()
        await this.browser.close()
    }

    private async settle(page: Awaited<ReturnType<BrowserContext['newPage']>>): Promise<void> {
        try {
            await page.waitForLoadState('networkidle', { timeout: 5_000 })
        } catch {}
    }

    private failure(url: string, startedAt: number, error: string, httpStatus?: number): PageCapture {
        return {
            ok: false,
            url,
            error,
            ...(httpStatus !== undefined ? { httpStatus } : {}),
            durationMs: Date.now() - startedAt,
        }
    }
}
