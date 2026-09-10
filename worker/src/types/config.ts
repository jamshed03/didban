/** Didban — Typen der Lauf-Konfiguration. */

import type { CrawlOptions } from './crawl.ts'
import type { UrlSource } from './source.ts'

export interface Config {
    readonly source: UrlSource
    readonly dataDir: string
    readonly crawlDelayMs: number
    readonly http: HttpOptions
    readonly maxSitemapIndexDepth: number
    readonly crawl: CrawlOptions
    readonly pixelThreshold: number
    readonly minPixelDiffPercent: number
}

export interface FileConfig {
    readonly dataDir?: string
    readonly crawlDelayMs?: number
    readonly fetchTimeoutMs?: number
    readonly userAgent?: string
    readonly maxSitemapIndexDepth?: number
    readonly pageTimeoutMs?: number
    readonly viewportWidth?: number
    readonly viewportHeight?: number
    readonly pixelThreshold?: number
    readonly minPixelDiffPercent?: number
}

export interface HttpOptions {
    readonly timeoutMs: number
    readonly userAgent: string
}

export interface SourceOptions {
    readonly http: HttpOptions
    readonly maxSitemapIndexDepth: number
}

export interface CliOptions {
    readonly config?: string | undefined
    readonly source?: string | undefined
    readonly sitemap?: string | undefined
    readonly urls?: string | undefined
    readonly 'urls-file'?: string | undefined
}
