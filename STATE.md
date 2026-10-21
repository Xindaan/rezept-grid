# STATE.md — rezept-grid

Stand: 2026-10-21. Langtext bis 08.10.: `docs/state_archiv_2026-10-21.md` (wortgleich).

## Ziel

Statische Rezept-App in Chu-Tabellen-Notation fuer Familie+Freunde; neue
Rezepte werden in Claude-Code-Sessions (Abo, keine API) zu JSON
konvertiert.

Vorschlag, vom Maintainer unbestaetigt — Erfolgskriterium (beobachtbar): Jedes
Rezept im Bestand rendert auf Telefon und Tablet ohne Meldung, die Kacheln
im Kopf gehen auf, und `node tools/pruefe-grid.js` ist gruen.

## Status

- **Funktional fertig**, auch per Doppelklick ohne Server. Fuenf Rezepte
  (`eierkuchen`, `pfannkuchen`, `spaetzle`, `maultaschen`,
  `omelett-mit-pilzen`), Portions-Skalierung, Kochmodus mit Uhr je Stufe,
  Zutaten abhaken, Einkaufsliste, Merker (24 h), Druck-Stylesheet. Repo
  oeffentlich, Pages laeuft (T-0009).
- **Eine Rechnung fuer jede Zeit** (T-0059, T-0070): Kopf, Zeitachse und
  Uebersichtskarte lesen denselben Einpersonen-Plan; `zeit_aktiv_s` und
  `zeit_gesamt_s` sind die Autoren-Angabe, die das Pruefskript dagegenhaelt.
- **Pruefung:** `node tools/pruefe-grid.js` — 321/321 gruen (Stand
  2026-10-08, letzter Lauf laut TASK.md T-0074; nicht neu gelaufen).
  Prueft Schema, Layout, Zeitplan, Manifest und per `tools/dom-attrappe.js`
  die DOM-Schicht. Nach jeder Rezeptaenderung: `node tools/build-manifest.js`.
- **Review Oktober 2026** (T-0088): 150 Befunde, Bericht
  `docs/review-2026-10.md`, Aufgaben T-0071 bis T-0087. Rechenkerne tragen;
  die Schwaechen liegen an der Oberflaeche (Mutationstest 47 % gefangen).
  T-0071 bis T-0074 sind umgesetzt, T-0075 bis T-0087 offen.
- Vorschau: `python3 -m http.server 8412`, Konfiguration in
  `.claude/launch.json`.

## Live-Risiken / Stolpersteine

- Kochleiste und Stufenliste sind kaum durch Tests gedeckt; die
  DOM-Attrappe weicht in sieben Punkten vom Browser ab (T-0080).
- Ein kaputtes Rezept (falscher Typ, Tippfehler im Feld) legt die ganze
  Uebersicht lahm; der Schema-Waechter sieht es nicht (T-0077).
- Auslieferung ohne Versionskennung: nach einem Deploy koennen neue und
  alte Dateien gemischt geladen werden (T-0086).
- Wake Lock und Ton sind nur per Attrappe belegt, endgueltig nur auf
  Hardware pruefbar (T-0076).
- Autorenweg: nicht jedes Rezept ist nach der Anleitung darstellbar,
  Zeilenreihenfolge zaehlt noch (T-0078, T-0079).

## Bei Dir

- T-0084: Kuechenurteile zu Maultaschen, Spaetzle-Teig und Pfannkuchen
  entscheiden (Entscheidung beim Maintainer).
- Sichtpruefung der Zeitachse im Browser nach T-0074 steht aus.
- Erfolgskriterium oben bestaetigen oder aendern.

## Next actions

1. T-0075 Einkaufsliste (gemerkte Portionen, Haken je Liste, URL streng).
2. T-0079 Zeilenreihenfolge berechnen (entschieden), danach T-0078 neu
   zuschneiden.
3. T-0076 Kochmodus: Fokus, Tastatur, Wachhalter, Ton.

## Termine

keine

## Letzte Done

- T-0074 Zeitmass-Aussagen: Kuerzung auf einer Skala, zu zweit aus
  Zweipersonen-Plan, Planende an der richtigen Spalte (2026-10-08)
- T-0072 Eine Uhr je Stufe, Alarm bis zur Quittung, Kochstand uebersteht
  ein Neuladen (2026-10-08)
- T-0071 Kochmodus folgt der aktiven Stufe, im Browser in drei Groessen
  gemessen (2026-10-08)
- T-0073 Pruefsuite laesst gueltige Rezepte durch (2026-10-07)
- T-0088 Review Oktober 2026: 150 Befunde, T-0071 bis T-0087 angelegt
  (2026-10-02)

<!-- snapshot-ende -->
