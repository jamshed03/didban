/** Helper: Platzhalter in einer Vorlage durch Werte ersetzen. */

import { escapeHtml } from './html.ts'

const RAW_PATTERN = /\{\{\{\s*([\w.]+)\s*\}\}\}/g
const ESCAPED_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g

export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
    const lookup = (name: string): string => {
        const value = values[name]
        if (value === undefined) {
            throw new Error(`Vorlage: kein Wert für Platzhalter "${name}"`)
        }
        return value
    }

    return template.replace(RAW_PATTERN, (_, name: string) => lookup(name)).replace(ESCAPED_PATTERN, (_, name: string) => escapeHtml(lookup(name)))
}
