export type UrlSourceType = 'sitemap' | 'manual'

export interface UrlSourceInfo {
    readonly type: UrlSourceType
    readonly origin: string
    readonly urlCount: number
}

export interface CollectedUrls {
    readonly urls: string[]
    readonly info: UrlSourceInfo
}

export interface UrlSource {
    readonly type: UrlSourceType
    readonly origin: string
    collect(): Promise<string[]>
}
