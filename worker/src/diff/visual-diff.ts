import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import type { VisualDiff } from '../types/index.ts'

interface PngImage {
    readonly width: number
    readonly height: number
    readonly data: Buffer
}

export interface VisualDiffResult {
    readonly metrics: Omit<VisualDiff, 'diffImagePath'>
    readonly image: Uint8Array
}

/**
 * Vergleicht zwei Screenshots pixelweise.
 */
export function diffScreenshots(previous: Uint8Array, current: Uint8Array, threshold: number): VisualDiffResult | undefined {
    const before = PNG.sync.read(Buffer.from(previous))
    const after = PNG.sync.read(Buffer.from(current))

    const sizeMismatch = before.width !== after.width || before.height !== after.height
    const width = Math.max(before.width, after.width)
    const height = Math.max(before.height, after.height)

    const left = padTo(before, width, height)
    const right = padTo(after, width, height)
    const output = new PNG({ width, height })

    const diffPixels = pixelmatch(left.data, right.data, output.data, width, height, {
        threshold,
        includeAA: false,
    })

    if (diffPixels === 0 && !sizeMismatch) return undefined

    const total = width * height
    return {
        metrics: {
            diffPixels,
            diffPercent: round2((diffPixels / total) * 100),
            sizeMismatch,
        },
        image: PNG.sync.write(output),
    }
}

function padTo(source: PngImage, width: number, height: number): PngImage {
    if (source.width === width && source.height === height) return source

    const target = new PNG({ width, height })
    target.data.fill(0xff)

    const sourceRowBytes = source.width * 4
    const targetRowBytes = width * 4

    for (let y = 0; y < source.height; y++) {
        const from = y * sourceRowBytes
        target.data.set(source.data.subarray(from, from + sourceRowBytes), y * targetRowBytes)
    }

    return target
}

function round2(value: number): number {
    return Math.round(value * 100) / 100
}
