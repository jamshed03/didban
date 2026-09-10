import { createTwoFilesPatch, diffLines } from 'diff'
import type { TextDiff } from '../types/index.ts'

const CONTEXT_LINES = 3

export function diffText(previous: string, current: string): TextDiff | undefined {
    if (previous === current) return undefined

    const before = withTrailingNewline(previous)
    const after = withTrailingNewline(current)

    let addedLines = 0
    let removedLines = 0

    for (const part of diffLines(before, after)) {
        if (part.added) addedLines += part.count ?? 0
        else if (part.removed) removedLines += part.count ?? 0
    }

    const patch = createTwoFilesPatch('vorher', 'nachher', previous, current, undefined, undefined, { context: CONTEXT_LINES })

    return { patch, addedLines, removedLines }
}

function withTrailingNewline(text: string): string {
    if (text === '' || text.endsWith('\n')) return text
    return `${text}\n`
}
