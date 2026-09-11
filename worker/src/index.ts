/**
 * Didban — Entry-Point des Workers (CLI).
 */

import { runCheck } from './commands/index.ts'
import { describeError } from './helpers/index.ts'
import { ConfigError } from './configs/index.ts'

async function main(): Promise<void> {
    console.log('Didban worker starting...')
    await runCheck()
}

main().catch((error: unknown) => {
    if (error instanceof ConfigError) {
        console.error(`\nKonfigurationsfehler: ${error.message}`)
    } else {
        console.error(`\nLauf abgebrochen: ${describeError(error)}`)
    }
    process.exitCode = 1
})
