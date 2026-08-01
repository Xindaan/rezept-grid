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
- Zwei Rezepte: `linsen-eintopf` und `eierkuchen`. Erreichbar ueber
  `index.html?rezept=<id>`; eine Uebersicht fehlt noch (T-0006), ohne sie
  ist das zweite Rezept nur per Hand-URL zu oeffnen.
- Pruefung: `node tools/pruefe-grid.js` (73/73 gruen) — laeuft ueber alle
  Rezepte, nicht nur ueber eins.
- Vorschau zum Testen: `python3 -m http.server 8412` im Projektordner,
  Konfiguration liegt in `.claude/launch.json`.

## Next actions

- T-0006 Rezept-Uebersicht — jetzt faellig, sonst ist `eierkuchen` nur
  ueber eine von Hand getippte URL erreichbar
- T-0012 `file://`-Doppelklick-Test in echtem Browser — offen, braucht
  Andre; einziger unbestaetigter Architektur-Eckpfeiler
- T-0013 Veraltetes Manifest verhindern (jetzt relevanter: zwei Rezepte)

## Letzte Done

- T-0014 Zweites Rezept: Eierkuchen (2026-08-01)
- T-0004 Kochmodus (2026-08-01)
- T-0003 Portions-Skalierung (2026-08-01)
- T-0001 Schema + Beispielrezept (2026-08-01)
- T-0002 Grid-Renderer fuer lineare Rezepte (2026-08-01)
