import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { escapeHtml, fillTemplate } from '../helpers/index.ts'
import { runPath } from '../stores/paths.ts'
import type { PageResult, Report } from '../types/index.ts'
import { reportStyles, reportTemplate } from './templates.ts'

export const HTML_REPORT_FILENAME = 'report.html'

const MAX_PATCH_LINES = 200

export async function writeHtmlReport(dataDir: string, report: Report): Promise<string> {
    const path = join(runPath(dataDir, report.runId), HTML_REPORT_FILENAME)

    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, renderReport(report), 'utf8')

    return path
}

export function renderReport(report: Report): string {
    const { summary } = report

    return fillTemplate(reportTemplate().page, {
        runId: report.runId,
        startedAt: new Date(report.startedAt).toLocaleString('de-DE'),
        sourceType: report.source.type,
        sourceOrigin: report.source.origin,
        total: String(summary.total),
        new: String(summary.new),
        changed: String(summary.changed),
        unchanged: String(summary.unchanged),
        broken: String(summary.broken),
        schemaVersion: String(report.schemaVersion),
        styles: reportStyles(),
        results: report.results.map((result) => renderResult(result)).join('\n'),
    })
}

function renderResult(result: PageResult): string {
    return fillTemplate(reportTemplate().part('result'), {
        status: result.status,
        statusClass: result.status.toLowerCase(),
        url: result.url,
        meta: renderMeta(result),
        error: renderError(result),
        patch: renderTextDiff(result),
        images: renderImages(result),
    })
}

function renderMeta(result: PageResult): string {
    const parts = [`${result.durationMs} ms`]
    if (result.httpStatus !== undefined) parts.unshift(`HTTP ${result.httpStatus}`)

    if (result.textDiff !== undefined) {
        parts.push(`Text +${result.textDiff.addedLines} / −${result.textDiff.removedLines}`)
    }
    if (result.visualDiff !== undefined) {
        const { diffPercent, diffPixels, sizeMismatch } = result.visualDiff
        parts.push(`Bild ${diffPercent} % (${diffPixels} Pixel)`)
        if (sizeMismatch) parts.push('Seitenhöhe geändert')
    }

    return parts.join(' · ')
}

function renderError(result: PageResult): string {
    if (result.error === undefined) return ''
    return fillTemplate(reportTemplate().part('error'), { error: result.error })
}

function renderTextDiff(result: PageResult): string {
    if (result.textDiff === undefined) return ''

    const lines = result.textDiff.patch.split('\n')
    const shown = lines.slice(0, MAX_PATCH_LINES)
    const rest = lines.length - shown.length

    return fillTemplate(reportTemplate().part('patch'), {
        lines: shown.map((line) => renderPatchLine(line)).join('\n'),
        truncated: rest > 0 ? fillTemplate(reportTemplate().part('truncated'), { count: String(rest) }) : '',
    })
}

function renderPatchLine(line: string): string {
    const escaped = escapeHtml(line)

    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
        return `<span class="p-head">${escaped}</span>`
    }
    if (line.startsWith('+')) return `<span class="p-add">${escaped}</span>`
    if (line.startsWith('-')) return `<span class="p-del">${escaped}</span>`
    return escaped
}

function renderImages(result: PageResult): string {
    const figures = [figure(result.previousScreenshotPath, 'vorher'), figure(result.screenshotPath, 'nachher'), figure(result.visualDiff?.diffImagePath, 'Unterschiede')].filter((entry) => entry !== '')

    if (figures.length === 0) return ''
    return fillTemplate(reportTemplate().part('images'), { figures: figures.join('\n') })
}

function figure(path: string | undefined, caption: string): string {
    if (path === undefined) return ''
    return fillTemplate(reportTemplate().part('figure'), { src: `../../${path}`, caption })
}
