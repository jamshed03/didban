import type { FileConfig } from '../types/index.ts'
import { ConfigError } from './errors.ts'

export const KNOWN_KEYS = ['dataDir', 'crawlDelayMs', 'fetchTimeoutMs', 'userAgent', 'maxSitemapIndexDepth'] as const

type KnownKey = (typeof KNOWN_KEYS)[number]

export function validateFileConfig(parsed: unknown, path: string): FileConfig {
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new ConfigError(`${path} muss ein JSON-Objekt enthalten.`)
    }

    const input = parsed as Record<string, unknown>
    const config: {
        dataDir?: string
        crawlDelayMs?: number
        fetchTimeoutMs?: number
        userAgent?: string
        maxSitemapIndexDepth?: number
    } = {}

    rejectUnknownKeys(input, path)

    if (input.dataDir !== undefined) {
        config.dataDir = requireNonEmptyString(input.dataDir, 'dataDir', path)
    }

    if (input.crawlDelayMs !== undefined) {
        config.crawlDelayMs = requireNonNegativeInt(input.crawlDelayMs, 'crawlDelayMs', path)
    }

    if (input.fetchTimeoutMs !== undefined) {
        const timeout = requireNonNegativeInt(input.fetchTimeoutMs, 'fetchTimeoutMs', path)
        if (timeout === 0) {
            throw new ConfigError(`${path}: "fetchTimeoutMs" muss groesser als 0 sein.`)
        }
        config.fetchTimeoutMs = timeout
    }

    if (input.userAgent !== undefined) {
        config.userAgent = requireNonEmptyString(input.userAgent, 'userAgent', path)
    }

    if (input.maxSitemapIndexDepth !== undefined) {
        const depth = requireNonNegativeInt(input.maxSitemapIndexDepth, 'maxSitemapIndexDepth', path)
        if (depth === 0) {
            throw new ConfigError(`${path}: "maxSitemapIndexDepth" muss mindestens 1 sein.`)
        }
        config.maxSitemapIndexDepth = depth
    }

    return config
}

function rejectUnknownKeys(input: Record<string, unknown>, path: string): void {
    for (const key of Object.keys(input)) {
        if (key === '$schema' || key.startsWith('//')) continue

        if (!KNOWN_KEYS.includes(key as KnownKey)) {
            throw new ConfigError(`${path}: unbekanntes Feld "${key}". Erlaubt sind: ${KNOWN_KEYS.join(', ')}.`)
        }
    }
}

function requireNonEmptyString(value: unknown, field: string, path: string): string {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new ConfigError(`${path}: "${field}" muss ein nicht-leerer Text sein.`)
    }
    return value.trim()
}

function requireNonNegativeInt(value: unknown, field: string, path: string): number {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new ConfigError(`${path}: "${field}" muss eine ganze Zahl sein.`)
    }
    if (value < 0) {
        throw new ConfigError(`${path}: "${field}" darf nicht negativ sein.`)
    }
    return value
}
