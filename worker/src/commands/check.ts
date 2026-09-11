/**
 * Command `check` — prüft ein Projekt oder alle nacheinander.
 */

import { loadRunTargets, type RunTarget } from '../configs/index.ts'
import { PageCrawler } from '../crawler/index.ts'
import { comparePage } from '../diff/index.ts'
import { buildReport, writeHtmlReport, writeJsonReport } from '../reports/index.ts'
import { collectFrom } from '../sources/index.ts'
import { createRunId, FileSnapshotStore } from '../stores/index.ts'
import type { Config, PageResult, Project, ReportSummary, SnapshotStore } from '../types/index.ts'

export async function runCheck(argv?: readonly string[]): Promise<void> {
    const targets = loadRunTargets(argv)

    if (targets.length > 1) {
        const namen = targets.map((target) => target.project?.id ?? 'ad-hoc').join(', ')
        console.log(`${targets.length} Projekte: ${namen}\n`)
    }

    for (const target of targets) {
        await runTarget(target)
    }
}

async function runTarget(target: RunTarget): Promise<void> {
    const { config, project } = target
    const runId = createRunId()

    console.log(project === undefined ? `Lauf ${runId}` : `Projekt ${project.name} — Lauf ${runId}`)
    console.log(`URL-Quelle: ${config.source.type} (${config.source.origin})`)

    const startedAt = new Date().toISOString()
    const { urls, info } = await collectFrom(config.source)
    console.log(`${urls.length} URL(s) zu prüfen\n`)

    const store = new FileSnapshotStore(config.dataDir)
    const crawler = await PageCrawler.launch(config.crawl)

    let results: PageResult[]
    try {
        results = await checkAll(urls, { runId, config, store, crawler })
    } finally {
        await crawler.close()
    }

    const report = buildReport({
        runId,
        project: toReportProject(project),
        source: info,
        startedAt,
        finishedAt: new Date().toISOString(),
        results,
    })

    const jsonPath = await writeJsonReport(config.dataDir, report)
    const htmlPath = await writeHtmlReport(config.dataDir, report)

    printSummary(report.summary)
    console.log(`\nReport: ${htmlPath}`)
    console.log(`        ${jsonPath}`)

    if (project !== undefined && project.notify.length > 0) {
        console.log(`Zu benachrichtigen: ${project.notify.join(', ')} (Versand noch nicht aktiv)`)
    }
    console.log('')
}

function toReportProject(project: Project | undefined) {
    if (project === undefined) return undefined
    return { id: project.id, name: project.name, notify: project.notify }
}

interface Context {
    readonly runId: string
    readonly config: Config
    readonly store: SnapshotStore
    readonly crawler: PageCrawler
}

async function checkAll(urls: readonly string[], ctx: Context): Promise<PageResult[]> {
    const results: PageResult[] = []

    for (const [index, url] of urls.entries()) {
        if (index > 0) await sleep(ctx.config.crawlDelayMs)

        const result = await checkOne(url, ctx)
        results.push(result)
        printResult(result)
    }

    return results
}

async function checkOne(url: string, ctx: Context): Promise<PageResult> {
    const previous = await ctx.store.readLatest(url)
    const capture = await ctx.crawler.capture(url)

    if (!capture.ok) {
        return comparePage(compareInput(ctx, capture, previous))
    }

    const saved = await ctx.store.save(ctx.runId, {
        url,
        text: capture.text,
        screenshot: capture.screenshot,
        httpStatus: capture.httpStatus,
    })

    return comparePage(compareInput(ctx, capture, previous), saved.screenshotPath)
}

function compareInput(ctx: Context, capture: Awaited<ReturnType<PageCrawler['capture']>>, previous: Awaited<ReturnType<SnapshotStore['readLatest']>>) {
    return {
        runId: ctx.runId,
        capture,
        previous,
        store: ctx.store,
        pixelThreshold: ctx.config.pixelThreshold,
        minPixelDiffPercent: ctx.config.minPixelDiffPercent,
    }
}

function printResult(result: PageResult): void {
    const indent = ' '.repeat(13)
    console.log(`  ${result.status.padEnd(11)} ${result.url}`)

    if (result.status === 'BROKEN') {
        console.log(`${indent}${result.error}`)
        return
    }

    if (result.textDiff !== undefined) {
        const { addedLines, removedLines } = result.textDiff
        console.log(`${indent}Text: +${addedLines} / -${removedLines} Zeilen`)
    }

    if (result.visualDiff !== undefined) {
        const { diffPercent, diffPixels, sizeMismatch } = result.visualDiff
        const hint = sizeMismatch ? ', Seitenhöhe geändert' : ''
        console.log(`${indent}Bild: ${diffPercent} % (${diffPixels} Pixel)${hint}`)
    }
}

function printSummary(summary: ReportSummary): void {
    console.log(`\n${summary.total} geprüft: ${summary.new} neu, ${summary.changed} geändert, ` + `${summary.unchanged} unverändert, ${summary.broken} defekt`)
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
