export type UrlSourceType = 'sitemap' | 'manual'

export interface UrlSourceInfo {
    readonly type: UrlSourceType
    readonly origin: string
    readonly urlCount: number
}

/** Was eine Quelle nach dem Einsammeln liefert. */
export interface CollectedUrls {
    /** Die gefundenen URLs, normalisiert und dedupliziert. */
    readonly urls: string[]
    /** Beschreibung der Quelle für den Report. */
    readonly info: UrlSourceInfo
}

export interface UrlSource {
    readonly type: UrlSourceType
    readonly origin: string
    collect(): Promise<string[]>
}
