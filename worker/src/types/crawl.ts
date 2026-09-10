/** Didban — Typen des Seitenabrufs. */

export type PageCapture = CaptureSuccess | CaptureFailure

export interface CaptureSuccess {
    readonly ok: true
    readonly url: string
    readonly text: string
    readonly screenshot: Uint8Array
    readonly httpStatus: number
    readonly durationMs: number
}

export interface CaptureFailure {
    readonly ok: false
    readonly url: string
    readonly error: string
    readonly httpStatus?: number
    readonly durationMs: number
}

export interface CrawlOptions {
    readonly pageTimeoutMs: number
    readonly viewportWidth: number
    readonly viewportHeight: number
    readonly userAgent: string
}
