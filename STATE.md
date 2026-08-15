# STATE.md — rezept-grid

Stand: 2026-08-15

## Ziel

Statische Rezept-App in Chu-Tabellen-Notation fuer Familie+Freunde; neue
Rezepte werden in Claude-Code-Sessions (Abo, keine API) zu JSON
konvertiert.

## Status

- **Funktional fertig**, auch per Doppelklick ohne Server (T-0012
  bestaetigt). Fuenf Rezepte (`eierkuchen`, `pfannkuchen`,
  `spaetzle`, `maultaschen`, `omelett-mit-pilzen`), Uebersicht,
  Portions-Skalierung, Kochmodus mit Countdown, Zutaten abhaken.
- **Design-Uebergabe aus Claude Design vollstaendig umgesetzt**
  (`docs/uebergabe-zeitmass.md`, T-0019 bis T-0023): Kicktipp-Tokens,
  Zeitmass (Spaltenbreite proportional zur Dauer), Fuehrungslinien,
  Kennzahlenstreifen, sticky Zutatenspalten.
- **Die Zeitachse ist der Ablauf fuer EINE Person** (T-0032): Stufen, die
  die Haende belegen, ueberlappen sich nie; `unbeaufsichtigt` treibt
  seither den Plan und nicht nur das Etikett. Die Spalten fallen aus
  diesem Plan (T-0030/T-0032) — eine Spalte ist ein Zeitpunkt, und
  parallele Straenge stehen nebeneinander, wenn ihre Zeilen sich nicht
  ueberschneiden.
- Pruefung: `node tools/pruefe-grid.js` — **137/137 gruen**. Laeuft ueber
  alle Rezepte, prueft Schema, Layout, Zeitplan und Manifest-Aktualitaet.
- Nach jeder Rezeptaenderung noetig: `node tools/build-manifest.js`.
- Vorschau: `python3 -m http.server 8412`, Konfiguration in
  `.claude/launch.json`.

## Next actions

- (nichts Dringendes offen; Backlog: T-0042 Klebestellen beim Kopieren)

## Letzte Done

- T-0033 Spaetzle: Wasser laeuft parallel zur Teigruhe, 48 statt 56 Min (2026-08-15)
- T-0041 Omelett mit Pilzen, erstes Rezept mit Quelle (2026-08-15)
- T-0039.2/.3 + T-0040 Design-Uebergabe, Stufenliste (2026-08-15)
- T-0038/T-0039.1 Touch-Zustaende, Tap-Ziele, Zutatenspalten (2026-08-08)
- T-0037 Ausstattung als eigener Absatz (2026-08-08)
- T-0035 Vorname aus den Steuerdateien entfernt (2026-08-03)
- T-0034 Rezepttexte entpersonalisiert, Tonregel in der Anleitung (2026-08-03)
- T-0032 Zeitplan fuer eine Person treibt Grid und Achse (2026-08-03)
- T-0028 Freie Zeit statt Summe der Wartezeiten (2026-08-02)
- T-0026 Einkaufsliste + T-0031 oeffentliche Repo-Verweise (2026-08-02)
- T-0030 Parallele Straenge im Grid nebeneinander (2026-08-02)
- T-0012 file://-Weg bestaetigt + T-0029 Zurueck-Link (2026-08-02)
- T-0005 Zutaten abhaken (2026-08-02)
- T-0027 Zeitachse auf dem kritischen Pfad (2026-08-02)
- T-0007 Konvertierungsanleitung + T-0011 Einheiten-Pruefung (2026-08-02)
- T-0020/T-0021/T-0022/T-0023 Zeitmass, Fuehrungslinien, Kopf, sticky (2026-08-02)
- T-0019 Tokens und Typografie (2026-08-02)
- T-0025 Rezeptbestand: Pfannkuchen, Spaetzle, Maultaschen (2026-08-02)
- T-0016 + T-0018 Grid-Design (2026-08-01)
- T-0006 Uebersicht + T-0013 Manifest-Waechter + T-0015 README (2026-08-01)
- T-0001 bis T-0004 Schema, Renderer, Skalierung, Kochmodus (2026-08-01)
