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
- Vier Rezepte: `eierkuchen`, `pfannkuchen`, `spaetzle`, `maultaschen`.
  `index.html` zeigt die Uebersicht, `?rezept=<id>` das Einzelrezept.
  Der Linsen-Eintopf ist Testvorlage geworden
  (`tools/testdaten/linsen-eintopf.json`) und nicht mehr in der App.
- README vorhanden (Quickstart, Rezept hinzufuegen, Troubleshooting).
- Tokens auf die Kicktipp-Linie umgestellt (T-0019): ein Schriftstack,
  Tabellenziffern global, Grid-Rahmen als Karte, gruener Akzent, Marken
  fuer Wartezeit und feste Mengen. Kontraste nachgerechnet.
- Zeitmass (T-0020 + T-0027): Spaltenbreite proportional zur Dauer,
  Zeitachse im Tabellenkopf auf dem **kritischen Pfad** (parallele
  Straenge werden nicht aufaddiert), Vermerk wo die Breite die Dauer untertreibt.
  Rechnung in `js/zeitmass.js`, headless geprueft.
- Kopf mit Kennzahlenstreifen und segmentierter Portionswahl (T-0022),
  Zeitbalken in der Kochleiste, Zutatenspalten sticky (T-0023).
- **Die Design-Uebergabe ist damit vollstaendig umgesetzt.**
- Fuehrungslinien je Block (T-0021): die Unterkante jeder Stufe laeuft
  nach links bis zur Zutatenachse durch.
- Grid-Design ueberarbeitet (T-0016 + T-0018): echtes Tabellenraster mit
  durchgehenden Haarlinien statt schwebender Karten, ein warmer Akzent fuer
  Zusammengehoeriges und die Haupthandlung, Kopplung von Stufe und Zutaten
  beim Ueberfahren. Bewusst nicht dem Original nachgebaut — Andre hat freie
  Hand gegeben, und das Vorbild-Artifact ist aus der Session ohnehin nicht
  einsehbar (Inhalt liegt hinter Login).
- Pruefung: `node tools/pruefe-grid.js` (89/89 gruen) — laeuft ueber alle
  Rezepte und vergleicht zusaetzlich das Manifest gegen die JSON-Dateien.
- Vorschau zum Testen: `python3 -m http.server 8412` im Projektordner,
  Konfiguration liegt in `.claude/launch.json`.
- Design-Uebergabe aus Claude Design liegt als `docs/uebergabe-zeitmass.md`
  (Richtung "Zeitmass": Spaltenbreite proportional zur Dauer, Tokens aus
  `WM-2026-Kicktipp`). Daraus T-0019 bis T-0023. **Die drei Entscheidungen
  sind beantwortet** (Deckel bleibt, Dunkelmodus wird gebaut, Gulasch bleibt
  Prueflast) — die Umsetzung kann starten.

## Next actions

- T-0009 Verteilung: Netlify entfaellt (kostet), GitHub Pages nur
  oeffentlich — Empfehlung oeffentlicher Ableger via `public-mirror`
- T-0012 `file://`-Doppelklick-Test — **nicht mehr blockierend**, seit die
  Verteilung ueber Netlify laeuft (dort greift `fetch` per http). Nur noch
  relevant, wenn die Sammlung ohne Netz dabei sein soll.

## Letzte Done

- T-0027 Zeitachse rechnet den kritischen Pfad (2026-08-02)
- T-0007 Konvertierungsanleitung + T-0011 Einheiten-Pruefung (2026-08-02)
- T-0022 Kopf und Kochleiste + T-0023 sticky Zutatenspalten (2026-08-02)
- T-0020 Zeitmass (2026-08-02)
- T-0021 Fuehrungslinie je Block (2026-08-02)
- T-0019 Tokens und Typografie (2026-08-02)
- T-0025 Rezeptbestand: Pfannkuchen, Spaetzle, Maultaschen (2026-08-02)
- T-0016 + T-0018 Grid-Design: Tabellenraster, Akzent, Kopplung (2026-08-01)
- T-0006 Rezept-Uebersicht + T-0013 Manifest-Waechter + T-0015 README (2026-08-01)
- T-0014 Zweites Rezept: Eierkuchen (2026-08-01)
- T-0004 Kochmodus (2026-08-01)
- T-0003 Portions-Skalierung (2026-08-01)
- T-0001 Schema + Beispielrezept (2026-08-01)
- T-0002 Grid-Renderer fuer lineare Rezepte (2026-08-01)
