import { createHash } from 'node:crypto'
import { join } from 'node:path'

/**
 * Ablage unter DATA_DIR:
 *
 *   snapshots/<key>.json          letzter Stand einer URL (Text + Zeiger)
 *   runs/<runId>/<key>.png        Screenshot dieses Laufs
 *   runs/<runId>/<key>.diff.png   Pixel-Diff dieses Laufs (Schritt 3)
 *   runs/<runId>/report.json      Report dieses Laufs (Schritt 3)
 */

export const SNAPSHOT_SCHEMA_VERSION = 1
const SNAPSHOT_DIR = 'snapshots'
const RUN_DIR = 'runs'
const MAX_READABLE_LENGTH = 60

/**
 * Dateisystem-sicherer Schlüssel für eine URL.
 */
export function urlKey(url: string): string {
    const hash = createHash('sha256').update(url).digest('hex').slice(0, 8)

    const readable = url
        .replace(/^https?:\/\//, '')
        .replace(/[^a-zA-Z0-9.-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, MAX_READABLE_LENGTH)

    return readable === '' ? hash : `${readable}-${hash}`
}

export function snapshotPath(dataDir: string, url: string): string {
    return join(dataDir, SNAPSHOT_DIR, `${urlKey(url)}.json`)
}

export function runPath(dataDir: string, runId: string): string {
    return join(dataDir, RUN_DIR, runId)
}

export function screenshotRelPath(runId: string, url: string): string {
    return join(RUN_DIR, runId, `${urlKey(url)}.png`)
}

export function diffImageRelPath(runId: string, url: string): string {
    return join(RUN_DIR, runId, `${urlKey(url)}.diff.png`)
}

export function createRunId(now: Date = new Date()): string {
    return now.toISOString().replace(/[:.]/g, '-')
}
