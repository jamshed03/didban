import { parseArgs } from 'node:util'
import { describeError } from '../helpers/index.ts'
import type { CliOptions } from '../types/index.ts'
import { ConfigError } from './errors.ts'

const CLI_OPTIONS = {
    config: { type: 'string' },
    source: { type: 'string' },
    sitemap: { type: 'string' },
    urls: { type: 'string' },
    'urls-file': { type: 'string' },
} as const

const CLI_USAGE = 'Erlaubt sind: --config <pfad>, --source <sitemap|manual>, --sitemap <url>, ' + '--urls <a,b>, --urls-file <pfad>.'

export function parseCli(argv: readonly string[]): CliOptions {
    try {
        const { values } = parseArgs({
            args: [...argv],
            options: CLI_OPTIONS,
            allowPositionals: false,
        })
        return values
    } catch (error) {
        throw new ConfigError(`${describeError(error)}\n${CLI_USAGE}`)
    }
}

export function parseUnitInterval(raw: string | undefined, fallback: number, name: string): number {
    const value = raw?.trim()
    if (!value) return fallback

    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
        throw new ConfigError(`${name} muss zwischen 0 und 1 liegen, war "${value}".`)
    }
    return parsed
}

export function parsePercent(raw: string | undefined, fallback: number, name: string): number {
    const value = raw?.trim()
    if (!value) return fallback

    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        throw new ConfigError(`${name} muss zwischen 0 und 100 liegen, war "${value}".`)
    }
    return parsed
}

export function parsePositiveInt(raw: string | undefined, fallback: number, name: string): number {
    const value = raw?.trim()
    if (!value) return fallback

    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new ConfigError(`${name} muss eine nicht-negative ganze Zahl sein, war "${value}".`)
    }
    return parsed
}
