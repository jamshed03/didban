import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { runPath } from '../stores/paths.ts'
import type { Report } from '../types/index.ts'

export const JSON_REPORT_FILENAME = 'report.json'

export async function writeJsonReport(dataDir: string, report: Report): Promise<string> {
    const path = join(runPath(dataDir, report.runId), JSON_REPORT_FILENAME)

    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

    return path
}
