# Didban (دیدبان)

*Persisch für „der Ausschau hält / Beobachtungsposten".*

Eigenständiges Tool, um eine Live-CMS-Website regelmäßig (manuell oder nachts
per Cron) auf inhaltliche und visuelle Änderungen zu prüfen — statt die Seite
von Hand durchzuklicken.

## Idee

1. Die zu prüfenden URLs kommen wahlweise aus der Sitemap der Zielseite
   (Sitemap-Indizes werden aufgelöst) oder aus einer manuell gepflegten
   Liste — nützlich, wenn es keine Sitemap gibt oder nur einzelne Seiten
   interessieren.
2. Jede URL wird per Playwright aufgerufen: Hauptinhalt (Text/DOM) wird
   extrahiert, zusätzlich wird ein Full-Page-Screenshot gemacht.
3. Text und Screenshot werden mit dem zuletzt gespeicherten Snapshot
   verglichen (Text-Diff + visueller Pixel-Diff).
4. Ergebnis ist ein Report pro Lauf — als JSON und als HTML: Status je URL
   (`NEW` / `CHANGED` / `UNCHANGED` / `BROKEN`), Text-Diff, %-Pixel-Diff,
   Pfade zu den Screenshots.

## Architektur-Leitplanke

Der Crawl-/Diff-Kern ist ein **framework-agnostisches TypeScript-Paket**:

- **Stabile JSON-Schnittstelle** nach außen — das ist der Vertrag, den
  später sowohl ein Frontend als auch eine mögliche API konsumieren.
- **Austauschbare Storage-Schicht** hinter einem Interface (`SnapshotStore`):
  zunächst lokale Dateien (JSON + PNG), später ggf. eine echte DB — ohne dass
  Crawl-/Diff-Logik dafür angefasst werden muss.
- Frontend und Backend sind **kein Bestandteil des Kerns** und keine
  Voraussetzung für Phase 1; sie werden erst in späteren Phasen angeflanscht.

## Phasenplan

| Phase | Inhalt | Status |
|---|---|---|
| **0** | Projekt-Setup (dieses Repo, docker-compose-Skelett, Env, README) | ✅ fertig |
| **1** | Kern-Engine: Crawl + Text-/Pixel-Diff, lokale Snapshot-Storage, JSON+HTML-Report, CLI via Docker | ✅ fertig |
| **2** | Vue-Dashboard (via Vite), liest den JSON-Report aus Phase 1 | ⬅️ optional, als Nächstes |
| **3** | Laravel-Backend mit Auth + DB-Storage (zweite `SnapshotStore`-Implementierung) | optional, nur bei Bedarf |
| **4** | Automatisierung (Cron/Scheduler statt manuellem CLI-Start) | später |

Jede Phase ist für sich lauffähig/nützlich. Phase 1 allein liefert bereits ein
funktionierendes CLI-Tool mit Report — ganz ohne Frontend oder Backend.

### Was Phase 1 konkret enthält

- Zwei URL-Quellen hinter dem Interface `UrlSource`: **Sitemap** oder
  **manuelle Liste**
- Crawler via **Playwright** (Text/DOM + Full-Page-Screenshot)
- Text-Diff via **`diff`**
- Visueller Diff via **`pixelmatch`** + **`pngjs`**
- **`SnapshotStore`**-Interface mit lokaler Datei-Implementierung (JSON + PNG)
- **JSON- und HTML-Report** je Lauf
- CLI-Aufruf über Docker Compose

## Konfiguration

- **Scope**: eine Website, nur öffentlich erreichbare Seiten (kein
  Login/Admin-Bereich).
- **URL-Quelle** (`URL_SOURCE`): entweder `sitemap` oder `manual`.

  ```bash
  # Option A — Sitemap (inkl. Sitemap-Index)
  URL_SOURCE=sitemap
  SITE_SITEMAP_URL=https://example.com/sitemap.xml

  # Option B — manuelle Liste: eine URL pro Zeile, "#" ist ein Kommentar
  URL_SOURCE=manual
  SITE_URLS_FILE=./urls.txt          # Vorlage: worker/urls.sample.txt
  # oder direkt:  SITE_URLS=https://example.com/,https://example.com/kontakt
  ```

  Für einen einzelnen Lauf gehen auch CLI-Argumente vor, ohne die `.env` zu
  ändern:

  ```bash
  docker compose run worker npm run check -- --sitemap https://example.com/sitemap.xml
  docker compose run worker npm run check -- --urls-file ./urls.txt
  docker compose run worker npm run check -- --urls https://example.com/a,https://example.com/b
  ```
- **Projekt-Konfiguration**: `worker/didban.config.json` — hier stehen die
  Vorgaben, die für alle gelten und im Repo versioniert sind:

  ```json
  {
      "dataDir": "./data",
      "crawlDelayMs": 500,
      "fetchTimeoutMs": 30000,
      "userAgent": "Didban/0.1 (+Website-Monitoring)",
      "maxSitemapIndexDepth": 3,
      "pageTimeoutMs": 30000,
      "viewportWidth": 1280,
      "viewportHeight": 800,
      "pixelThreshold": 0.1,
      "minPixelDiffPercent": 0.01
  }
  ```

  Vorrang, von stark nach schwach: CLI-Argument → `.env` → diese Datei →
  eingebauter Default. Eine andere Datei nutzen: `--config <pfad>` oder
  `DIDBAN_CONFIG=<pfad>`.
- **Rate-Limiting**: ca. 500 ms Pause zwischen den Requests
  (`crawlDelayMs`, per Env `CRAWL_DELAY_MS`).
- **Crawl-Zeitpunkt** (ab Phase 4): einmal nachts, ca. 02:00 Uhr.
- **Paketmanager**: npm.

## Setup

```bash
cp .env.sample .env
# .env nach Bedarf anpassen (v.a. SITE_SITEMAP_URL)
```

## Nutzung

Ein Prüflauf:

```bash
docker compose run --rm worker npm run check
```

Ergebnis je Lauf unter `data/`:

```
data/
  snapshots/<key>.json        letzter Stand je URL (Text + Zeiger aufs Bild)
  runs/<runId>/<key>.png      Screenshot dieses Laufs
  runs/<runId>/<key>.diff.png Pixel-Diff, Unterschiede rot markiert
  runs/<runId>/report.json    maschinenlesbar — der Vertrag für Phase 2/3
  runs/<runId>/report.html    zum Anschauen im Browser
```

Die HTML-Datei direkt öffnen, etwa mit
`open data/runs/<runId>/report.html`.

**Hinweis:** Der Crawl braucht Chromium und läuft deshalb im Container. Lokal
(`npx tsx src/index.ts`) funktioniert nur die URL-Ermittlung, sofern der
Browser nicht per `npx playwright install chromium` nachinstalliert wurde.
