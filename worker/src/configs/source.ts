import { ManualSource, SitemapSource } from '../sources/index.ts'
import type { CliOptions, SourceOptions, UrlSource } from '../types/index.ts'
import { ConfigError } from './errors.ts'

/**
 * Entscheidet zwischen den beiden URL-Quellen. Reihenfolge:
 * 1. explizite CLI-Argumente
 * 2. URL_SOURCE aus der Umgebung
 * 3. Ableitung daraus, welche Env-Variablen gesetzt sind
 */
export function resolveSource(cli: CliOptions, env: NodeJS.ProcessEnv, options: SourceOptions): UrlSource {
    if (cli.urls !== undefined) return ManualSource.fromList(cli.urls, 'cli --urls')
    if (cli['urls-file'] !== undefined) return ManualSource.fromFile(cli['urls-file'])
    if (cli.sitemap !== undefined) return new SitemapSource(cli.sitemap, options)

    const requested = (cli.source ?? env.URL_SOURCE)?.trim().toLowerCase()

    if (requested !== undefined && requested !== '') {
        if (requested === 'sitemap') return sitemapFromEnv(env, options)
        if (requested === 'manual') return manualFromEnv(env)
        throw new ConfigError(`Unbekannte URL-Quelle "${requested}" — erlaubt sind "sitemap" und "manual".`)
    }

    const hasManual = Boolean(env.SITE_URLS_FILE?.trim() || env.SITE_URLS?.trim())
    const hasSitemap = Boolean(env.SITE_SITEMAP_URL?.trim())

    if (hasManual && hasSitemap) {
        throw new ConfigError('Sowohl eine manuelle URL-Liste als auch SITE_SITEMAP_URL sind gesetzt.\n' + 'Bitte URL_SOURCE=sitemap oder URL_SOURCE=manual setzen (oder den Lauf mit\n' + '--sitemap / --urls / --urls-file starten).')
    }

    if (hasManual) return manualFromEnv(env)
    return sitemapFromEnv(env, options)
}

function sitemapFromEnv(env: NodeJS.ProcessEnv, options: SourceOptions): UrlSource {
    const url = env.SITE_SITEMAP_URL?.trim()
    if (!url) {
        throw new ConfigError('URL-Quelle "sitemap": SITE_SITEMAP_URL ist nicht gesetzt.\n' + 'Entweder in der .env setzen oder den Lauf mit --sitemap <url> starten.')
    }
    return new SitemapSource(url, options)
}

function manualFromEnv(env: NodeJS.ProcessEnv): UrlSource {
    const file = env.SITE_URLS_FILE?.trim()
    if (file) return ManualSource.fromFile(file)

    const list = env.SITE_URLS?.trim()
    if (list) return ManualSource.fromList(list, 'env SITE_URLS')

    throw new ConfigError('URL-Quelle "manual": weder SITE_URLS_FILE noch SITE_URLS ist gesetzt.\n' + 'Alternativ den Lauf mit --urls-file <pfad> oder --urls <a,b,c> starten.')
}
