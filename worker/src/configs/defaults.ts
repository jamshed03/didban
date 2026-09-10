export const BUILTIN_DEFAULTS = {
    dataDir: './data',
    crawlDelayMs: 500,
    fetchTimeoutMs: 30_000,
    userAgent: 'Didban/0.1 (+Website-Monitoring)',
    maxSitemapIndexDepth: 3,
} as const

export const CONFIG_FILENAME = 'didban.config.json'
