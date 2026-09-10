import type { CollectedUrls, UrlSource } from '../types/index.ts'

export async function collectFrom(source: UrlSource): Promise<CollectedUrls> {
    const urls = await source.collect()

    return {
        urls,
        info: {
            type: source.type,
            origin: source.origin,
            urlCount: urls.length,
        },
    }
}
