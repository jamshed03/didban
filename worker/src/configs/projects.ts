import { readdirSync, readFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { describeError } from '../helpers/index.ts'
import type { FileConfig, Project, ProjectSource } from '../types/index.ts'
import { ConfigError } from './errors.ts'
import { validateFileConfig } from './validator.ts'

export const PROJECTS_DIRNAME = 'projects'

const PROJECT_KEYS = ['name', 'source', 'notify'] as const

export function loadProjects(dir: string = PROJECTS_DIRNAME): Project[] {
    const path = resolve(dir)

    let entries: string[]
    try {
        entries = readdirSync(path).filter((name) => name.endsWith('.json'))
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
        throw new ConfigError(`Projektordner ${path} nicht lesbar: ${describeError(error)}`)
    }

    return entries.sort().map((entry) => loadProject(join(path, entry)))
}

export function loadProject(path: string): Project {
    const id = basename(path, '.json')

    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) {
        throw new ConfigError(`Projektname "${id}" ist nicht zulässig — erlaubt sind Buchstaben, Ziffern, ` + 'Bindestrich und Unterstrich (der Name wird zum Ordner in DATA_DIR).')
    }

    let raw: string
    try {
        raw = readFileSync(path, 'utf8')
    } catch (error) {
        throw new ConfigError(`Projektdatei ${path} nicht lesbar: ${describeError(error)}`)
    }

    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch (error) {
        throw new ConfigError(`${path} ist kein gültiges JSON: ${describeError(error)}`)
    }

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new ConfigError(`${path} muss ein JSON-Objekt enthalten.`)
    }

    const input = parsed as Record<string, unknown>

    return {
        id,
        name: readName(input, id, path),
        source: readSource(input.source, path),
        notify: readNotify(input.notify, path),
        overrides: readOverrides(input, path),
    }
}

function readName(input: Record<string, unknown>, id: string, path: string): string {
    if (input.name === undefined) return id

    if (typeof input.name !== 'string' || input.name.trim() === '') {
        throw new ConfigError(`${path}: "name" muss ein nicht-leerer Text sein.`)
    }
    return input.name.trim()
}

function readSource(value: unknown, path: string): ProjectSource {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new ConfigError(`${path}: "source" fehlt oder ist kein Objekt.\n` + 'Erwartet: { "type": "sitemap", "sitemapUrl": "..." } oder\n' + '          { "type": "manual", "urlsFile": "..." } oder\n' + '          { "type": "manual", "urls": ["..."] }')
    }

    const source = value as Record<string, unknown>

    if (source.type === 'sitemap') {
        const url = requireText(source.sitemapUrl, 'source.sitemapUrl', path)
        return { type: 'sitemap', sitemapUrl: url }
    }

    if (source.type === 'manual') {
        if (source.urlsFile !== undefined) {
            return { type: 'manual', urlsFile: requireText(source.urlsFile, 'source.urlsFile', path) }
        }
        if (Array.isArray(source.urls)) {
            const urls = source.urls.map((entry, index) => requireText(entry, `source.urls[${index}]`, path))
            if (urls.length === 0) {
                throw new ConfigError(`${path}: "source.urls" darf nicht leer sein.`)
            }
            return { type: 'manual', urls }
        }
        throw new ConfigError(`${path}: "source" braucht bei type "manual" "urlsFile" oder "urls".`)
    }

    throw new ConfigError(`${path}: "source.type" muss "sitemap" oder "manual" sein, war ${JSON.stringify(source.type)}.`)
}

function readNotify(value: unknown, path: string): readonly string[] {
    if (value === undefined) return []

    if (!Array.isArray(value)) {
        throw new ConfigError(`${path}: "notify" muss eine Liste von Empfängern sein.`)
    }
    return value.map((entry, index) => requireText(entry, `notify[${index}]`, path))
}

function readOverrides(input: Record<string, unknown>, path: string): FileConfig {
    if (input.dataDir !== undefined) {
        throw new ConfigError(`${path}: "dataDir" gehört in didban.config.json — jedes Projekt bekommt darin ` + 'automatisch einen eigenen Unterordner.')
    }

    const rest: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input)) {
        if (!PROJECT_KEYS.includes(key as (typeof PROJECT_KEYS)[number])) rest[key] = value
    }

    return validateFileConfig(rest, path)
}

function requireText(value: unknown, field: string, path: string): string {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new ConfigError(`${path}: "${field}" muss ein nicht-leerer Text sein.`)
    }
    return value.trim()
}
