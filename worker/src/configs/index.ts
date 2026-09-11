import { loadFileConfig } from './file.ts'
import { parseCli } from './parser.ts'
import { planRun, type RunTarget } from './plan.ts'

export { BUILTIN_DEFAULTS, CONFIG_FILENAME } from './defaults.ts'
export { ConfigError } from './errors.ts'
export { loadFileConfig } from './file.ts'
export { parseCli, parsePercent, parsePositiveInt, parseUnitInterval } from './parser.ts'
export { planRun, type RunTarget } from './plan.ts'
export { loadProject, loadProjects } from './projects.ts'
export { resolveSource } from './source.ts'
export { KNOWN_KEYS, validateFileConfig } from './validator.ts'

/**
 * Vorrang der Werte, von stark nach schwach:
 * 1. CLI-Argumente
 * 2. Umgebung (.env)
 * 3. Projektdatei
 * 4. didban.config.json
 * 5. eingebaute Defaults
 */
export function loadRunTargets(argv: readonly string[] = process.argv.slice(2)): RunTarget[] {
    const cli = parseCli(argv)
    const env = process.env
    const explicitPath = cli.config ?? (env.DIDBAN_CONFIG?.trim() || undefined)

    return planRun(cli, env, loadFileConfig(explicitPath))
}
