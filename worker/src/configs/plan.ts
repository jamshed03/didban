import { join } from 'node:path'
import { ManualSource, SitemapSource } from '../sources/index.ts'
import type { CliOptions, Config, FileConfig, Project, UrlSource } from '../types/index.ts'
import { BUILTIN_DEFAULTS } from './defaults.ts'
import { ConfigError } from './errors.ts'
import { parsePercent, parsePositiveInt, parseUnitInterval } from './parser.ts'
import { loadProjects } from './projects.ts'
import { resolveSource } from './source.ts'

export interface RunTarget {
    readonly project: Project | undefined
    readonly config: Config
}

export function planRun(cli: CliOptions, env: NodeJS.ProcessEnv, file: FileConfig): RunTarget[] {
    const dataDir = env.DATA_DIR?.trim() || file.dataDir || BUILTIN_DEFAULTS.dataDir

    if (hasCliSource(cli)) {
        return [adHocTarget(cli, env, file, dataDir)]
    }

    const projects = selectProjects(loadProjects(), cli.project)
    if (projects.length === 0) {
        return [adHocTarget(cli, env, file, dataDir)]
    }

    return projects.map((project) => ({
        project,
        config: buildConfig(mergeFile(file, project.overrides), env, join(dataDir, project.id), (options) => sourceOf(project, options)),
    }))
}

function hasCliSource(cli: CliOptions): boolean {
    return cli.urls !== undefined || cli['urls-file'] !== undefined || cli.sitemap !== undefined
}

function adHocTarget(cli: CliOptions, env: NodeJS.ProcessEnv, file: FileConfig, dataDir: string): RunTarget {
    return {
        project: undefined,
        config: buildConfig(file, env, dataDir, (options) => resolveSource(cli, env, options)),
    }
}

function selectProjects(projects: readonly Project[], wanted: string | undefined): Project[] {
    if (wanted === undefined) return [...projects]

    const found = projects.find((project) => project.id === wanted)
    if (found === undefined) {
        const available = projects.map((project) => project.id).join(', ')
        throw new ConfigError(available === '' ? `Projekt "${wanted}" nicht gefunden — es gibt noch keine Dateien in projects/.` : `Projekt "${wanted}" nicht gefunden. Verfügbar: ${available}.`)
    }
    return [found]
}

function sourceOf(project: Project, options: Parameters<typeof resolveSource>[2]): UrlSource {
    const { source } = project

    if (source.type === 'sitemap') return new SitemapSource(source.sitemapUrl, options)
    if ('urlsFile' in source) return ManualSource.fromFile(source.urlsFile)
    return ManualSource.fromList(source.urls.join('\n'), `Projekt ${project.id}`)
}

function mergeFile(base: FileConfig, overrides: FileConfig): FileConfig {
    return { ...base, ...overrides }
}

function buildConfig(file: FileConfig, env: NodeJS.ProcessEnv, dataDir: string, makeSource: (options: { http: Config['http']; maxSitemapIndexDepth: number }) => UrlSource): Config {
    const http = {
        timeoutMs: parsePositiveInt(env.FETCH_TIMEOUT_MS, file.fetchTimeoutMs ?? BUILTIN_DEFAULTS.fetchTimeoutMs, 'FETCH_TIMEOUT_MS'),
        userAgent: env.USER_AGENT?.trim() || file.userAgent || BUILTIN_DEFAULTS.userAgent,
    }

    const maxSitemapIndexDepth = parsePositiveInt(env.MAX_SITEMAP_INDEX_DEPTH, file.maxSitemapIndexDepth ?? BUILTIN_DEFAULTS.maxSitemapIndexDepth, 'MAX_SITEMAP_INDEX_DEPTH')

    const crawl = {
        pageTimeoutMs: parsePositiveInt(env.PAGE_TIMEOUT_MS, file.pageTimeoutMs ?? BUILTIN_DEFAULTS.pageTimeoutMs, 'PAGE_TIMEOUT_MS'),
        viewportWidth: parsePositiveInt(env.VIEWPORT_WIDTH, file.viewportWidth ?? BUILTIN_DEFAULTS.viewportWidth, 'VIEWPORT_WIDTH'),
        viewportHeight: parsePositiveInt(env.VIEWPORT_HEIGHT, file.viewportHeight ?? BUILTIN_DEFAULTS.viewportHeight, 'VIEWPORT_HEIGHT'),
        userAgent: http.userAgent,
    }

    return {
        source: makeSource({ http, maxSitemapIndexDepth }),
        dataDir,
        crawlDelayMs: parsePositiveInt(env.CRAWL_DELAY_MS, file.crawlDelayMs ?? BUILTIN_DEFAULTS.crawlDelayMs, 'CRAWL_DELAY_MS'),
        http,
        maxSitemapIndexDepth,
        crawl,
        pixelThreshold: parseUnitInterval(env.PIXEL_THRESHOLD, file.pixelThreshold ?? BUILTIN_DEFAULTS.pixelThreshold, 'PIXEL_THRESHOLD'),
        minPixelDiffPercent: parsePercent(env.MIN_PIXEL_DIFF_PERCENT, file.minPixelDiffPercent ?? BUILTIN_DEFAULTS.minPixelDiffPercent, 'MIN_PIXEL_DIFF_PERCENT'),
    }
}
