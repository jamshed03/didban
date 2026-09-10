/**
 * Command `check` — ein vollständiger Prüflauf.
 */

import { loadConfig } from '../configs/index.ts'
import { collectFrom } from '../sources/index.ts'
import { createRunId, FileSnapshotStore } from '../stores/index.ts'

export async function runCheck(argv?: readonly string[]): Promise<void> {
    const config = loadConfig(argv)
    const runId = createRunId()
    console.log(`Lauf ${runId}`)
    console.log(`URL-Quelle: ${config.source.type} (${config.source.origin})`)

    const { urls, info } = await collectFrom(config.source)
    console.log(`${info.urlCount} URL(s) zu prüfen:`)

    const store = new FileSnapshotStore(config.dataDir)
    for (const url of urls) {
        const previous = await store.readLatest(url)
        console.log(previous ? `  - ${url}\n      letzter Stand: ${previous.capturedAt}` : `  - ${url}\n      NEU — noch kein Snapshot`)
    }

    console.log(`Crawl-Delay: ${config.crawlDelayMs} ms | Datenordner: ${config.dataDir}`)
    console.log(`HTTP: ${config.http.timeoutMs} ms Timeout | ${config.http.userAgent}`)
    console.log('Crawl und Diff folgen — bis hierher steht die URL-Ermittlung und die Ablage.')
}
