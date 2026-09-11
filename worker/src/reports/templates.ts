import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Lädt die Vorlage des Reports.
 *
 * `templates/report.html` enthält die Seite und darunter die Bausteine als
 * `<template id="...">`. Sie liegen bewusst in derselben Datei: so sieht man
 * das ganze Markup auf einen Blick, statt sieben Schnipsel zu verwalten.
 *
 * Die Dateien liegen neben diesem Modul und werden beim Bauen mit nach `dist/`
 * kopiert (npm-Skript "copy:templates") — deshalb der Pfad relativ zum Modul
 * und nicht zum Arbeitsverzeichnis.
 */
const TEMPLATE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'templates')

const BLOCK_PATTERN = /<template id="([\w-]+)">([\s\S]*?)<\/template>/g

export interface ReportTemplate {
    /** Die Seite selbst, ohne die Bausteine. */
    readonly page: string
    /** Ein Baustein, etwa `part('result')`. */
    part(name: string): string
}

let cached: ReportTemplate | undefined

/** Liest Vorlage und CSS; beide ändern sich zur Laufzeit nicht. */
export function reportTemplate(): ReportTemplate {
    cached ??= parse(readFileSync(join(TEMPLATE_DIR, 'report.html'), 'utf8'))
    return cached
}

/** Das Stylesheet, das in die erzeugte Seite eingebettet wird. */
export function reportStyles(): string {
    return readFileSync(join(TEMPLATE_DIR, 'report.css'), 'utf8')
}

function parse(source: string): ReportTemplate {
    const parts = new Map<string, string>()

    for (const [, name, body] of source.matchAll(BLOCK_PATTERN)) {
        if (name !== undefined && body !== undefined) parts.set(name, body.trim())
    }

    // Bausteine und den erklärenden Kommentar aus der Seite entfernen — sie
    // gehören nicht in die Ausgabe.
    const page = source
        .replace(BLOCK_PATTERN, '')
        .replace(/<!--[\s\S]*?-->\s*$/, '')
        .trimEnd()

    return {
        page,
        part(name: string): string {
            const body = parts.get(name)
            if (body === undefined) {
                throw new Error(`Vorlage: Baustein "${name}" fehlt in report.html`)
            }
            return body
        },
    }
}
