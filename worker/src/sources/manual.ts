import { readFile } from 'node:fs/promises'
import { normalizeUrls, reportSkipped } from '../helpers/index.ts'
import type { UrlSource, UrlSourceType } from '../types/index.ts'

export class ManualSource implements UrlSource {
    readonly type: UrlSourceType = 'manual'

    private constructor(readonly origin: string, private readonly load: () => Promise<string[]>) {}

    static fromFile(path: string): ManualSource {
        return new ManualSource(path, async () => {
            const content = await readFile(path, 'utf8')
            return content.split(/\r?\n/)
        })
    }

    static fromList(values: string, origin: string): ManualSource {
        return new ManualSource(origin, async () => values.split(/[\n,;]/))
    }

    async collect(): Promise<string[]> {
        const { urls, skipped } = normalizeUrls(await this.load())
        reportSkipped(skipped)

        if (urls.length === 0) {
            throw new Error(`URL-Liste aus ${this.origin} enthält keine gültige URL`)
        }
        return urls
    }
}
