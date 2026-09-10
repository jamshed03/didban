import type { Config } from '../types/index.ts'
import { BUILTIN_DEFAULTS } from './defaults.ts'
import { loadFileConfig } from './file.ts'
import { parseCli, parsePercent, parsePositiveInt, parseUnitInterval } from './parser.ts'
import { resolveSource } from './source.ts'

export { BUILTIN_DEFAULTS, CONFIG_FILENAME } from './defaults.ts'
export { ConfigError } from './errors.ts'
export { loadFileConfig } from './file.ts'
export { parseCli, parsePercent, parsePositiveInt, parseUnitInterval } from './parser.ts'
export { KNOWN_KEYS, validateFileConfig } from './validator.ts'
export { resolveSource } from './source.ts'

/**
 * Baut die Konfiguration zusammen.
 *
 * 1. CLI-Argumente
 * 2. Umgebung (.env)
 * 3. didban.config.json
 * 4. eingebaute Defaults
 */
export function loadConfig(argv: readonly string[] = process.argv.slice(2)): Config {
    const cli = parseCli(argv)
    const env = process.env
    const explicitPath = cli.config ?? (env.DIDBAN_CONFIG?.trim() || undefined)
    const file = loadFileConfig(explicitPath)

    const http = {
        timeoutMs: parsePositiveInt(
            env.FETCH_TIMEOUT_MS,
            file.fetchTimeoutMs ?? BUILTIN_DEFAULTS.fetchTimeoutMs,
            'FETCH_TIMEOUT_MS',
        ),
        userAgent: env.USER_AGENT?.trim() || file.userAgent || BUILTIN_DEFAULTS.userAgent,
    }

    const maxSitemapIndexDepth = parsePositiveInt(
        env.MAX_SITEMAP_INDEX_DEPTH,
        file.maxSitemapIndexDepth ?? BUILTIN_DEFAULTS.maxSitemapIndexDepth,
        'MAX_SITEMAP_INDEX_DEPTH',
    )

    const crawl = {
        pageTimeoutMs: parsePositiveInt(
            env.PAGE_TIMEOUT_MS,
            file.pageTimeoutMs ?? BUILTIN_DEFAULTS.pageTimeoutMs,
            'PAGE_TIMEOUT_MS',
        ),
        viewportWidth: parsePositiveInt(
            env.VIEWPORT_WIDTH,
            file.viewportWidth ?? BUILTIN_DEFAULTS.viewportWidth,
            'VIEWPORT_WIDTH',
        ),
        viewportHeight: parsePositiveInt(
            env.VIEWPORT_HEIGHT,
            file.viewportHeight ?? BUILTIN_DEFAULTS.viewportHeight,
            'VIEWPORT_HEIGHT',
        ),
        userAgent: http.userAgent,
    }

    return {
        source: resolveSource(cli, env, { http, maxSitemapIndexDepth }),
        dataDir: env.DATA_DIR?.trim() || file.dataDir || BUILTIN_DEFAULTS.dataDir,
        crawlDelayMs: parsePositiveInt(
            env.CRAWL_DELAY_MS,
            file.crawlDelayMs ?? BUILTIN_DEFAULTS.crawlDelayMs,
            'CRAWL_DELAY_MS',
        ),
        http,
        maxSitemapIndexDepth,
        crawl,
        pixelThreshold: parseUnitInterval(
            env.PIXEL_THRESHOLD,
            file.pixelThreshold ?? BUILTIN_DEFAULTS.pixelThreshold,
            'PIXEL_THRESHOLD',
        ),
        minPixelDiffPercent: parsePercent(
            env.MIN_PIXEL_DIFF_PERCENT,
            file.minPixelDiffPercent ?? BUILTIN_DEFAULTS.minPixelDiffPercent,
            'MIN_PIXEL_DIFF_PERCENT',
        ),
    }
}
