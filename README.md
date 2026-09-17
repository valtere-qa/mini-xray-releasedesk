# Mini Xray ReleaseDesk

Professionelles Cloudflare-Fallback für Release-Testphasen, wenn Xray vorübergehend nicht erreichbar ist.

## Kernfunktionen

- Xray-kompatibler CSV-Import und CSV-Re-Export
- Status: TO DO, EXECUTING, PASSED, FAILED, BLOCKED, ABORTED
- Original-Xray-Status und lokaler Status getrennt
- Testschritte, Tester, Kommentare, Actual Result und Jira-/Defect-Ticket
- Audit-Log und Xray-Abgleich mit Konflikterkennung
- Suche, Filter und Bulk-Statusänderung
- Cloudflare D1 für geräteübergreifende Speicherung
- Kontobezogene Farbkonfiguration mit Live-Vorschau und D1-Persistenz
- Responsive Oberfläche für Desktop, Tablet und Mobile

## Installation

```bash
npm install
npx wrangler d1 create mini-xray-releasedesk-db
```

Die ausgegebene `database_id` in `wrangler.toml` eintragen. Danach:

```bash
npm run db:migrate:remote
npm run deploy
```

## Lokale Entwicklung

```bash
npm install
npm run db:migrate:local
npm run dev
```

Frontend und JSON-API werden gemeinsam als Cloudflare Worker bereitgestellt.
