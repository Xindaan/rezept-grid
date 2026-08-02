# STATE.md — rezept-grid

Stand: 2026-08-02

## Ziel

Statische Rezept-App in Chu-Tabellen-Notation fuer Familie+Freunde; neue
Rezepte werden in Claude-Code-Sessions (Abo, keine API) zu JSON
konvertiert.

## Status

- **Funktional fertig.** Vier Rezepte (`eierkuchen`, `pfannkuchen`,
  `spaetzle`, `maultaschen`), Uebersicht, Portions-Skalierung, Kochmodus
  mit Countdown, Zutaten abhaken.
- **Design-Uebergabe aus Claude Design vollstaendig umgesetzt**
  (`docs/uebergabe-zeitmass.md`, T-0019 bis T-0023): Kicktipp-Tokens,
  Zeitmass (Spaltenbreite proportional zur Dauer, Zeitachse auf dem
  kritischen Pfad), Fuehrungslinien, Kennzahlenstreifen, sticky
  Zutatenspalten.
- Pruefung: `node tools/pruefe-grid.js` — **89/89 gruen**. Laeuft ueber
  alle Rezepte, prueft Schema, Layout, Zeitmass und Manifest-Aktualitaet.
- Nach jeder Rezeptaenderung noetig: `node tools/build-manifest.js`.
- Vorschau: `python3 -m http.server 8412`, Konfiguration in
  `.claude/launch.json`.

## Next actions

- **T-0009 Verteilung** — braucht Andre. Netlify entfaellt (Abo
  gekuendigt), GitHub Pages ist kostenlos nur fuer oeffentliche Repos.
  Empfehlung: oeffentlicher Ableger via `public-mirror`-Skill, Pages
  darauf. Offen sind sein Go und die zwei Kommentare, die das private
  Kicktipp-Repo nennen.
- **T-0012 `file://`-Doppelklick-Test** — nicht blockierend. Nur relevant,
  wenn die Sammlung ohne Netz dabei sein soll.
- **T-0026 Einkaufsliste** — gewuenscht, noch nicht begonnen.

## Letzte Done

- T-0005 Zutaten abhaken (2026-08-02)
- T-0027 Zeitachse auf dem kritischen Pfad (2026-08-02)
- T-0007 Konvertierungsanleitung + T-0011 Einheiten-Pruefung (2026-08-02)
- T-0020/T-0021/T-0022/T-0023 Zeitmass, Fuehrungslinien, Kopf, sticky (2026-08-02)
- T-0019 Tokens und Typografie (2026-08-02)
- T-0025 Rezeptbestand: Pfannkuchen, Spaetzle, Maultaschen (2026-08-02)
- T-0016 + T-0018 Grid-Design (2026-08-01)
- T-0006 Uebersicht + T-0013 Manifest-Waechter + T-0015 README (2026-08-01)
- T-0001 bis T-0004 Schema, Renderer, Skalierung, Kochmodus (2026-08-01)
