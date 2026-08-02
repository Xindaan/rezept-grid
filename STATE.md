# STATE.md — rezept-grid

Stand: 2026-08-02

## Ziel

Statische Rezept-App in Chu-Tabellen-Notation fuer Familie+Freunde; neue
Rezepte werden in Claude-Code-Sessions (Abo, keine API) zu JSON
konvertiert.

## Status

- **Funktional fertig**, auch per Doppelklick ohne Server (T-0012 von
  Andre bestaetigt). Vier Rezepte (`eierkuchen`, `pfannkuchen`,
  `spaetzle`, `maultaschen`), Uebersicht, Portions-Skalierung, Kochmodus
  mit Countdown, Zutaten abhaken.
- **Design-Uebergabe aus Claude Design vollstaendig umgesetzt**
  (`docs/uebergabe-zeitmass.md`, T-0019 bis T-0023): Kicktipp-Tokens,
  Zeitmass (Spaltenbreite proportional zur Dauer, Zeitachse auf dem
  kritischen Pfad), Fuehrungslinien, Kennzahlenstreifen, sticky
  Zutatenspalten.
- Parallele Straenge stehen im Grid nebeneinander (T-0030): Stufen
  teilen sich eine Spalte, wenn ihre Zeilen sich nicht ueberschneiden.
- Pruefung: `node tools/pruefe-grid.js` — **92/92 gruen**. Laeuft ueber
  alle Rezepte, prueft Schema, Layout, Zeitmass und Manifest-Aktualitaet.
- Nach jeder Rezeptaenderung noetig: `node tools/build-manifest.js`.
- Vorschau: `python3 -m http.server 8412`, Konfiguration in
  `.claude/launch.json`.

## Next actions

- **T-0009 Verteilung** — braucht Andre. Netlify entfaellt (Abo
  gekuendigt), GitHub Pages ist kostenlos nur fuer oeffentliche Repos.
  Empfehlung: oeffentlicher Ableger via `public-mirror`-Skill, Pages
  darauf. Offen ist nur noch sein Go — die Kommentare sind bereinigt
  (T-0031).

## Letzte Done

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
