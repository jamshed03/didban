/** Didban — Typen eines überwachten Projekts. */

import type { FileConfig } from './config.ts'

export type ProjectSource = { readonly type: 'sitemap'; readonly sitemapUrl: string } | { readonly type: 'manual'; readonly urlsFile: string } | { readonly type: 'manual'; readonly urls: readonly string[] }

export interface Project {
    readonly id: string
    readonly name: string
    readonly source: ProjectSource
    readonly notify: readonly string[]
    readonly overrides: FileConfig
}
