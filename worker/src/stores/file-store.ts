import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { describeError } from '../helpers/index.ts'
import type { Snapshot, SnapshotInput, SnapshotStore } from '../types/index.ts'
import { screenshotRelPath, snapshotPath, SNAPSHOT_SCHEMA_VERSION } from './paths.ts'

/**
 * Snapshot-Ablage in lokalen Dateien (JSON + PNG) unter DATA_DIR.
 */
export class FileSnapshotStore implements SnapshotStore {
    constructor(private readonly dataDir: string) {}

    async readLatest(url: string): Promise<Snapshot | undefined> {
        const path = snapshotPath(this.dataDir, url)

        let raw: string
        try {
            raw = await readFile(path, 'utf8')
        } catch (error) {
            if (isNotFound(error)) return undefined
            throw new Error(`Snapshot ${path} nicht lesbar: ${describeError(error)}`)
        }

        return parseSnapshot(raw, path)
    }

    async readScreenshot(snapshot: Snapshot): Promise<Uint8Array | undefined> {
        const path = join(this.dataDir, snapshot.screenshotPath)

        try {
            return await readFile(path)
        } catch (error) {
            if (isNotFound(error)) return undefined
            throw new Error(`Screenshot ${path} nicht lesbar: ${describeError(error)}`)
        }
    }

    async save(runId: string, input: SnapshotInput): Promise<Snapshot> {
        const relScreenshot = screenshotRelPath(runId, input.url)

        const snapshot: Snapshot = {
            url: input.url,
            capturedAt: input.capturedAt ?? new Date().toISOString(),
            runId,
            text: input.text,
            screenshotPath: relScreenshot,
            ...(input.httpStatus !== undefined ? { httpStatus: input.httpStatus } : {}),
        }

        await writeAtomic(join(this.dataDir, relScreenshot), input.screenshot)
        await writeAtomic(snapshotPath(this.dataDir, input.url), JSON.stringify({ schemaVersion: SNAPSHOT_SCHEMA_VERSION, ...snapshot }, null, 2))

        return snapshot
    }
}

async function writeAtomic(path: string, data: Uint8Array | string): Promise<void> {
    await mkdir(dirname(path), { recursive: true })

    const temp = `${path}.tmp`
    await writeFile(temp, data)
    await rename(temp, path)
}

function parseSnapshot(raw: string, path: string): Snapshot {
    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch (error) {
        throw new Error(`Snapshot ${path} ist kein gültiges JSON: ${describeError(error)}`)
    }

    if (parsed === null || typeof parsed !== 'object') {
        throw new Error(`Snapshot ${path} enthält kein Objekt.`)
    }

    const data = parsed as Record<string, unknown>
    if (typeof data.url !== 'string' || typeof data.text !== 'string' || typeof data.screenshotPath !== 'string' || typeof data.capturedAt !== 'string' || typeof data.runId !== 'string') {
        throw new Error(`Snapshot ${path} ist unvollständig — Datei löschen und neu aufnehmen.`)
    }

    return {
        url: data.url,
        capturedAt: data.capturedAt,
        runId: data.runId,
        text: data.text,
        screenshotPath: data.screenshotPath,
        ...(typeof data.httpStatus === 'number' ? { httpStatus: data.httpStatus } : {}),
    }
}

function isNotFound(error: unknown): boolean {
    return (error as NodeJS.ErrnoException | null)?.code === 'ENOENT'
}
