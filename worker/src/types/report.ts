/**
 * Didban — Report-Objekt-Typ.
 */

import type { UrlSourceInfo } from './source.ts'

export type PageStatus = 'NEW' | 'CHANGED' | 'UNCHANGED' | 'BROKEN'

export interface TextDiff {
    readonly patch: string
    readonly addedLines: number
    readonly removedLines: number
}

export interface VisualDiff {
    readonly diffPercent: number
    readonly diffPixels: number
    readonly diffImagePath: string
    readonly sizeMismatch: boolean
}

export interface PageResult {
    readonly url: string
    readonly status: PageStatus
    readonly httpStatus?: number
    readonly screenshotPath?: string
    readonly previousScreenshotPath?: string
    readonly textDiff?: TextDiff
    readonly visualDiff?: VisualDiff
    readonly error?: string
    readonly checkedAt: string
    readonly durationMs: number
}

export interface ReportSummary {
    readonly total: number
    readonly new: number
    readonly changed: number
    readonly unchanged: number
    readonly broken: number
}

export interface ReportProject {
    readonly id: string
    readonly name: string
    readonly notify: readonly string[]
}

export interface Report {
    readonly schemaVersion: 1
    readonly runId: string
    readonly project?: ReportProject
    readonly source: UrlSourceInfo
    readonly startedAt: string
    readonly finishedAt: string
    readonly summary: ReportSummary
    readonly results: readonly PageResult[]
}
