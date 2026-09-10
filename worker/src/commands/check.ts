/**
 * Command `check` — ein vollständiger Prüflauf.
 */

import { loadConfig } from '../configs/index.ts'
import { collectFrom } from '../sources/index.ts'

export async function runCheck(argv?: readonly string[]): Promise<void> {
    const config = loadConfig(argv)
    console.log(`URL-Quelle: ${config.source.type} (${config.source.origin})`)

    const { urls, info } = await collectFrom(config.source)
    console.log(`${info.urlCount} URL(s) zu prüfen:`)
    for (const url of urls) {
        console.log(`  - ${url}`)
    }

    console.log(`Crawl-Delay: ${config.crawlDelayMs} ms | Datenordner: ${config.dataDir}`)
    console.log(`HTTP: ${config.http.timeoutMs} ms Timeout | ${config.http.userAgent}`)
    console.log('Crawl-/Diff-Logik folgt — bis hierher steht nur die URL-Ermittlung.')
}
