export const BUILTIN_DEFAULTS = {
    dataDir: './data',
    crawlDelayMs: 500,
    fetchTimeoutMs: 30_000,
    userAgent: 'Didban/0.1 (+Website-Monitoring)',
    maxSitemapIndexDepth: 3,
    pageTimeoutMs: 30_000,
    viewportWidth: 1280,
    viewportHeight: 800,
    pixelThreshold: 0.1,
    minPixelDiffPercent: 0.01,
} as const

export const CONFIG_FILENAME = 'didban.config.json'
