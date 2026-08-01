# STATE.md — rezept-grid

Stand: 2026-08-01

## Ziel

Statische Rezept-App in Chu-Tabellen-Notation fuer Familie+Freunde;
neue Rezepte werden in Claude-Code-Sessions (Abo, keine API) zu JSON
konvertiert.

## Status

- Schema steht (`docs/schema.md`, Version 1) mit einem Beispielrezept
  (`rezepte/linsen-eintopf.json`, 15 Zutaten / 6 Schritte).
- Renderer laeuft: `js/grid.js` berechnet das Layout (Zeilenreihenfolge,
  Bloecke, rowspans), `js/render.js` baut das DOM, `js/app.js` laedt.
- Ueber http vollstaendig im Browser verifiziert — Grid, Edge Cases,
  CSS. **Der `file://`-Weg ist noch unbestaetigt** (T-0012): fetch auf
  lokale Dateien ist in allen Browsern blockiert, dafuer gibt es
  `rezepte/manifest.js` als Fallback, aber ein echter Doppelklick-Test
  war aus der Session heraus nicht moeglich.
- Portions-Umschaltung laeuft (`js/portionen.js`): Knoepfe im Kopf,
  zwei Rundungsregeln (Gewicht/Volumen dezimal, gezaehlte Einheiten als
  Kuechenbrueche), `skalieren: false` bleibt fix.
- Pruefung: `node tools/pruefe-grid.js` (48/48 gruen).
- Vorschau zum Testen: `python3 -m http.server 8412` im Projektordner,
  Konfiguration liegt in `.claude/launch.json`.

## Next actions

- T-0012 `file://`-Doppelklick-Test in echtem Browser (kurz, blockiert
  sonst nichts)
- T-0004 Kochmodus
- T-0006 Rezept-Uebersicht (braucht ein zweites Rezept, um sinnvoll zu sein)

## Letzte Done

- T-0003 Portions-Skalierung (2026-08-01)
- T-0001 Schema + Beispielrezept (2026-08-01)
- T-0002 Grid-Renderer fuer lineare Rezepte (2026-08-01)
