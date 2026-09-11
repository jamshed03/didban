# Projekte

Jede `*.json` in diesem Ordner ist ein überwachtes Projekt. Der Dateiname ohne
Endung ist die Kennung und zugleich der Ordner unter `DATA_DIR`:

```
data/example/snapshots/…
data/example/runs/<runId>/…
```

Ein Lauf ohne Angabe prüft alle Projekte nacheinander:

```bash
docker compose run --rm worker npm run check
docker compose run --rm worker npm run check -- --project example
```

Felder einer Projektdatei:

| Feld          | Pflicht | Bedeutung                                                                                                                          |
| ------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | nein    | Anzeigename; ohne Angabe die Kennung aus dem Dateinamen                                                                            |
| `source`      | ja      | `{ "type": "sitemap", "sitemapUrl": "…" }` oder `{ "type": "manual", "urlsFile": "…" }` oder `{ "type": "manual", "urls": ["…"] }` |
| `notify`      | nein    | Empfänger der Benachrichtigung — wird gespeichert, **noch nicht verschickt** (Phase 4)                                             |
| alles Weitere | nein    | überschreibt `didban.config.json` für dieses Projekt (`crawlDelayMs`, `viewportWidth`, …) — nur `dataDir` nicht                    |

Pfade sind relativ zum Worker-Verzeichnis (`/app` im Container).
