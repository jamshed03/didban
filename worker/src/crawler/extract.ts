/// <reference lib="dom" />

export function extractMainText(): string {
    const selectors = ['main', 'article', '[role="main"]', '#content', 'body']

    for (const selector of selectors) {
        const element = document.querySelector<HTMLElement>(selector)
        if (element !== null && element.innerText.trim() !== '') {
            return element.innerText
        }
    }
    return document.body?.innerText ?? ''
}
