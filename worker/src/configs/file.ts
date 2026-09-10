import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describeError } from '../helpers/index.ts'
import type { FileConfig } from '../types/index.ts'
import { CONFIG_FILENAME } from './defaults.ts'
import { ConfigError } from './errors.ts'
import { validateFileConfig } from './validator.ts'

/**
 * Lädt didban.config.json.
 */
export function loadFileConfig(explicitPath?: string): FileConfig {
    const path = resolve(explicitPath ?? CONFIG_FILENAME)
    const required = explicitPath !== undefined

    let raw: string
    try {
        raw = readFileSync(path, 'utf8')
    } catch (error) {
        if (!required && (error as NodeJS.ErrnoException).code === 'ENOENT') return {}
        throw new ConfigError(`Konfigurationsdatei ${path} nicht lesbar: ${describeError(error)}`)
    }

    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch (error) {
        throw new ConfigError(`${path} ist kein gültiges JSON: ${describeError(error)}`)
    }

    return validateFileConfig(parsed, path)
}
