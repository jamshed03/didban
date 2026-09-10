import type { Config } from '../types/index.ts'
import { BUILTIN_DEFAULTS } from './defaults.ts'
import { loadFileConfig } from './file.ts'
import { parseCli, parsePositiveInt } from './parser.ts'
import { resolveSource } from './source.ts'

export { BUILTIN_DEFAULTS, CONFIG_FILENAME } from './defaults.ts'
export { ConfigError } from './errors.ts'
export { loadFileConfig } from './file.ts'
export { parseCli, parsePositiveInt } from './parser.ts'
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
    }
}
