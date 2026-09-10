import type { PageCapture, PageResult, Snapshot, SnapshotStore, VisualDiff } from '../types/index.ts'
import { diffScreenshots } from './visual-diff.ts'
import { diffText } from './text-diff.ts'

export interface CompareInput {
    readonly runId: string
    readonly capture: PageCapture
    readonly previous: Snapshot | undefined
    readonly store: SnapshotStore
    readonly pixelThreshold: number
    readonly minPixelDiffPercent: number
}

export async function comparePage(input: CompareInput, screenshotPath?: string): Promise<PageResult> {
    const { capture, previous } = input
    const checkedAt = new Date().toISOString()

    if (!capture.ok) {
        return {
            url: capture.url,
            status: 'BROKEN',
            error: capture.error,
            ...(capture.httpStatus !== undefined ? { httpStatus: capture.httpStatus } : {}),
            checkedAt,
            durationMs: capture.durationMs,
        }
    }

    const base = {
        url: capture.url,
        httpStatus: capture.httpStatus,
        ...(screenshotPath !== undefined ? { screenshotPath } : {}),
        checkedAt,
        durationMs: capture.durationMs,
    }

    if (previous === undefined) {
        return { ...base, status: 'NEW' }
    }

    const textDiff = diffText(previous.text, capture.text)
    const visualDiff = await compareScreenshots(input, previous)

    if (textDiff === undefined && visualDiff === undefined) {
        return { ...base, status: 'UNCHANGED', previousScreenshotPath: previous.screenshotPath }
    }

    return {
        ...base,
        status: 'CHANGED',
        previousScreenshotPath: previous.screenshotPath,
        ...(textDiff !== undefined ? { textDiff } : {}),
        ...(visualDiff !== undefined ? { visualDiff } : {}),
    }
}

async function compareScreenshots(input: CompareInput, previous: Snapshot): Promise<VisualDiff | undefined> {
    if (!input.capture.ok) return undefined

    const previousImage = await input.store.readScreenshot(previous)
    if (previousImage === undefined) return undefined

    const result = diffScreenshots(previousImage, input.capture.screenshot, input.pixelThreshold)
    if (result === undefined) return undefined

    const { diffPercent, sizeMismatch } = result.metrics
    if (!sizeMismatch && diffPercent < input.minPixelDiffPercent) return undefined

    const diffImagePath = await input.store.saveDiffImage(input.runId, input.capture.url, result.image)

    return { ...result.metrics, diffImagePath }
}
