# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

**Didban** (دیدبان, persisch für „der Ausschau hält / Beobachtungsposten") prüft
regelmäßig — manuell oder nachts per Cron — die URLs einer Live-CMS-Website. Pro
URL werden Hauptinhalt (Text/DOM) und ein Full-Page-Screenshot erfasst und gegen
den zuletzt gespeicherten Snapshot verglichen (Text-Diff + visueller Pixel-Diff).
Geänderte Seiten erscheinen in einem Report, statt die Seite von Hand
durchzuklicken.

## Aktueller Stand

**Phase 0 ist abgeschlossen**, Phase 1 hat noch nicht begonnen. Real vorhanden
sind nur `README.md`, `.env.sample`, `.gitignore`, `docker-compose.yml`,
`data/.gitkeep` und diese Datei. Es gibt **keinen Quellcode, kein
`package.json`, keine Tests und keine Build-/Lint-Befehle** — sie entstehen mit
Phase 1. Keinen Befehl als verfügbar behaupten, ohne ihn geprüft zu haben.

## Architektur-Leitplanke

Der Crawl-/Diff-Kern ist ein **framework-agnostisches TypeScript-Paket** unter
`worker/`:

-   **Stabile JSON-Schnittstelle nach außen** — der Report ist der Vertrag, den
    später sowohl ein Frontend als auch eine mögliche API konsumieren.
    Feldänderungen sind breaking changes für beide.
-   **Austauschbare Storage-Schicht** hinter dem Interface `SnapshotStore`:
    zunächst lokale Dateien (JSON + PNG), später ggf. eine echte DB — ohne dass
    Crawl-/Diff-Logik dafür angefasst wird.
-   Der Kern darf **keine Abhängigkeit** auf Vue, Vite, Laravel oder einen
    HTTP-Server haben und muss als reines CLI lauffähig bleiben.
-   **Frontend und Backend sind keine Voraussetzung für Phase 1.**

## Phasenplan

| Phase | Inhalt                                                                 | Status                   |
| ----- | ---------------------------------------------------------------------- | ------------------------ |
| **0** | Projekt-Setup: Repo, docker-compose-Skelett, Env, README               | ✅ fertig                |
| **1** | Node/TS-Kern (siehe unten)                                             | ✅ fertig                |
| **2** | Vite + Vue Dashboard, liest den JSON-Report aus Phase 1                | ⬅️ optional, als Nächstes |
| **3** | Laravel-Backend mit Auth + DB (zweite `SnapshotStore`-Implementierung) | optional, nur bei Bedarf |
| **4** | Automatisierung: Cron/Scheduler statt manuellem CLI-Start              | später                   |

### Phase 1 im Detail

-   **Zwei URL-Quellen** hinter dem Interface `UrlSource`: Sitemap (inkl.
    Sitemap-Index) oder manuell gepflegte Liste (Datei, Env oder CLI)
-   Crawler via **Playwright** (Text/DOM-Extraktion + Full-Page-Screenshot)
-   Text-Diff via **`diff`**
-   Visueller Diff via **`pixelmatch`** + **`pngjs`**
-   **`SnapshotStore`**-Interface mit lokaler Datei-Implementierung (JSON + PNG
    unter `DATA_DIR`)
-   **JSON- und HTML-Report** je Lauf; Status je URL: `NEW` / `CHANGED` /
    `UNCHANGED` / `BROKEN`, dazu Text-Diff, %-Pixel-Diff und Screenshot-Pfade
-   CLI-Aufruf: `docker compose run worker npm run check`

### Aktueller Stand (Phase 1 abgeschlossen)

Ein Lauf (`docker compose run --rm worker npm run check`) ermittelt die URLs,
ruft jede Seite mit Playwright ab, vergleicht gegen den letzten Snapshot und
schreibt Report als JSON und HTML nach `data/runs/<runId>/`.

Beim Weiterarbeiten beachten:

-   Der Crawl braucht Chromium und läuft nur im Container. Lokal funktioniert
    ohne `npx playwright install chromium` nur die URL-Ermittlung.
-   Screenshots werden mit `animations: 'disabled'` aufgenommen. Ohne das melden
    animierte Seiten bei jedem Lauf Unterschiede, die niemand geändert hat.
-   Der Pixelvergleich füllt unterschiedlich hohe Bilder weiß auf die gemeinsame
    Größe auf; eine geänderte Seitenhöhe gilt immer als Änderung.
-   Alles, was aus der geprüften Seite stammt (Text, URLs, Fehlermeldungen), muss
    im HTML-Report durch `escapeHtml()` — es sind fremde Eingaben.

## Konventionen

-   **npm** als Paketmanager (nicht yarn/pnpm).
-   **Scope ist eine Website.** Die URL-Quelle ist wählbar (`URL_SOURCE`):
    `sitemap` (`SITE_SITEMAP_URL`) oder `manual` (`SITE_URLS_FILE` /
    `SITE_URLS`). CLI-Argumente `--sitemap`, `--urls`, `--urls-file` haben
    Vorrang vor der Umgebung. Sind beide Quellen per Env gesetzt, ohne dass
    `URL_SOURCE` entscheidet, bricht der Lauf mit einem Konfigurationsfehler ab.
-   Nur **öffentlich erreichbare Seiten** — kein Login-/Admin-Bereich.
-   **Konfiguration** kommt aus vier Ebenen, von stark nach schwach:
    CLI-Argumente → Umgebung (`.env`) → `worker/didban.config.json` →
    eingebaute Defaults in `configs/defaults.ts`. Neue Felder der Datei müssen
    in `types/config.ts` **und** in der Validierung in `configs/file.ts`
    ergänzt werden, sonst werden sie als Tippfehler abgelehnt.
-   **Crawl-Delay 500 ms** zwischen Requests (`CRAWL_DELAY_MS`, `crawlDelayMs`). Das ist
    Rate-Limiting gegenüber einer fremden Live-Site und wird nicht zur
    Beschleunigung gesenkt oder entfernt.
-   **Nachtlauf ca. 02:00 Uhr** — erst ab Phase 4 relevant.
-   Alles läuft über **Docker Compose**; der Verzeichnisname eines Service ist sein
    Build-Context (`./worker`, `./frontend`, `./backend`). In
    `docker-compose.yml` sind die Blöcke auskommentiert vorbereitet: beim Umsetzen
    einer Phase den zugehörigen Block einkommentieren, statt die Datei umzubauen.
-   Projektsprache für Doku, Kommentare und Commits ist **Deutsch**.
-   `data/` ist gitignored (nur `.gitkeep` ist eingecheckt) — Snapshots und
    Reports gehören nie ins Repo.

## Arbeitsweise

**Phase für Phase arbeiten, nicht alles gleichzeitig.** Nach jeder Phase muss
das Tool eigenständig lauffähig und nützlich sein: Phase 1 allein liefert
bereits ein funktionierendes CLI-Tool mit JSON- und HTML-Report — ganz ohne
Frontend oder Backend. Arbeit, die eine spätere Phase vorwegnimmt, nicht
nebenbei mitmachen.

## Setup

```bash
cp .env.sample .env
```
