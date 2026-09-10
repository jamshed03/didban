/** Didban — Typen der Snapshot-Ablage. */

export interface Snapshot {
    readonly url: string
    readonly capturedAt: string
    readonly runId: string
    readonly text: string
    readonly screenshotPath: string
    readonly httpStatus?: number
}

export interface SnapshotInput {
    readonly url: string
    readonly text: string
    readonly screenshot: Uint8Array
    readonly httpStatus?: number
    readonly capturedAt?: string
}

export interface SnapshotStore {
    readLatest(url: string): Promise<Snapshot | undefined>
    readScreenshot(snapshot: Snapshot): Promise<Uint8Array | undefined>
    save(runId: string, input: SnapshotInput): Promise<Snapshot>
    saveDiffImage(runId: string, url: string, image: Uint8Array): Promise<string>
}
