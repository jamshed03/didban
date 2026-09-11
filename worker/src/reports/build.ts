import type { PageResult, Report, ReportSummary, UrlSourceInfo } from '../types/index.ts'

const REPORT_SCHEMA_VERSION = 1

export interface BuildReportInput {
    readonly runId: string
    readonly source: UrlSourceInfo
    readonly startedAt: string
    readonly finishedAt: string
    readonly results: readonly PageResult[]
}

export function buildReport(input: BuildReportInput): Report {
    return {
        schemaVersion: REPORT_SCHEMA_VERSION,
        runId: input.runId,
        source: input.source,
        startedAt: input.startedAt,
        finishedAt: input.finishedAt,
        summary: summarize(input.results),
        results: input.results,
    }
}

export function summarize(results: readonly PageResult[]): ReportSummary {
    let created = 0
    let changed = 0
    let unchanged = 0
    let broken = 0

    for (const result of results) {
        if (result.status === 'NEW') created++
        else if (result.status === 'CHANGED') changed++
        else if (result.status === 'UNCHANGED') unchanged++
        else broken++
    }

    return { total: results.length, new: created, changed, unchanged, broken }
}
