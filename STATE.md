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
- Kochmodus laeuft (`js/kochmodus.js`): Stufen-Navigation per Knopf,
  Pfeiltasten und Escape, Countdown mit Start/Pause, Grid dimmt alles weg
  ausser der aktuellen Stufe. Hervorgehoben werden die **neu**
  dazukommenden Zutaten, nicht der kumulative Block.
- Zwei Rezepte: `linsen-eintopf` und `eierkuchen`. `index.html` zeigt die
  Uebersicht, `?rezept=<id>` das Einzelrezept.
- README vorhanden (Quickstart, Rezept hinzufuegen, Troubleshooting).
- Grid-Design ueberarbeitet (T-0016): echtes Tabellenraster mit
  durchgehenden Haarlinien statt schwebender Karten. **Ohne Vorlage
  gebaut** — das Original-Artifact ist aus der Session nicht einsehbar
  (Login), siehe T-0017.
- Pruefung: `node tools/pruefe-grid.js` (74/74 gruen) — laeuft ueber alle
  Rezepte und vergleicht zusaetzlich das Manifest gegen die JSON-Dateien.
- Vorschau zum Testen: `python3 -m http.server 8412` im Projektordner,
  Konfiguration liegt in `.claude/launch.json`.

## Next actions

- T-0017 Grid gegen das Original abgleichen — braucht Screenshot oder
  Artifact-Code von Andre
- T-0012 `file://`-Doppelklick-Test in echtem Browser — offen, braucht
  Andre; einziger unbestaetigter Architektur-Eckpfeiler
- T-0007 `docs/konvertierung.md` (Anleitung + Prompt-Vorlage), jetzt mit
  Erfahrung aus zwei Konvertierungen schreibbar
- T-0009 Verteilung an Familie+Freunde — sinnvoll, sobald T-0012 geklaert ist

## Letzte Done

- T-0006 Rezept-Uebersicht + T-0013 Manifest-Waechter + T-0015 README (2026-08-01)
- T-0014 Zweites Rezept: Eierkuchen (2026-08-01)
- T-0004 Kochmodus (2026-08-01)
- T-0003 Portions-Skalierung (2026-08-01)
- T-0001 Schema + Beispielrezept (2026-08-01)
- T-0002 Grid-Renderer fuer lineare Rezepte (2026-08-01)
