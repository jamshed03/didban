# --------------------------------
# Didban Worker — Crawl-/Diff-Kern
# --------------------------------
FROM mcr.microsoft.com/playwright:v1.63.0-noble

ENV NODE_ENV=development \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "check"]
