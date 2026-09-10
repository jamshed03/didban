/**
 * Helper: HTTP-Zugriffe außerhalb des Browsers (Sitemaps, robots.txt, ...).
 */

import type { HttpOptions } from '../types/index.ts'
import { describeError } from './describer.ts'

export async function fetchText(url: string, options: HttpOptions & { accept?: string }): Promise<string> {
    let response: Response
    try {
        response = await fetch(url, {
            headers: {
                'user-agent': options.userAgent,
                accept: options.accept ?? '*/*',
            },
            signal: AbortSignal.timeout(options.timeoutMs),
            redirect: 'follow',
        })
    } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
            throw new Error(`${url} hat nicht innerhalb von ${options.timeoutMs} ms geantwortet.`)
        }
        throw new Error(`${url} nicht abrufbar: ${describeError(error)}`)
    }

    if (!response.ok) {
        throw new Error(`${url} nicht abrufbar: HTTP ${response.status}`)
    }
    return await response.text()
}
