# Uebergabe — Richtung "Zeitmass" (2a) fuer rezept-grid

> **Historisches Dokument.** Es beschreibt den Auftrag vom 02.08.2026, nicht
> den heutigen Code, und wird nicht nachgefuehrt. Zwei Stellen weichen
> bewusst ab (geprueft am 02.09.2026):
>
> * **`gekoppelt-fest` gibt es nicht.** Abschnitt 2.4 sieht eine per Klick
>   festgehaltene Kopplung fuers Tablet vor. Gebaut wurde nur die
>   Kopplung per Mauszeiger; auf Fingergeraeten schaltet `stil.css` sie
>   unter `@media (hover: none)` sogar ab. Offen als T-0066.
> * **Die Pruefungszahl "74/74"** in Abschnitt "Nicht anfassen" und in den
>   Akzeptanzkriterien ist der Stand von damals. Heute sind es 251.
>
> Der Rest ist umgesetzt (T-0019 bis T-0023).

Stand: 2026-08-02. Grundlage: Entwurf `Rezept-Grid Richtungen.dc.html`, Option
2a (Grid) und 2b (Belastungsprobe). Visuelle Tokens aus
dem Kicktipp-Projekt (oeffentlich als `Xindaan/poisson-dor`),
`assets/tokens.css` + `assets/styles.css`.

Diese Datei ist als Vorlage fuer eine Claude-Code-Session gedacht: sie nennt
je Datei, was zu aendern ist, und was ausdruecklich unangetastet bleibt.

## Nicht anfassen

- `js/grid.js` — die Layout-Berechnung bleibt unveraendert.
- `docs/schema.md` — kein neues Feld noetig.
- `tools/pruefe-grid.js` — muss nach dem Umbau weiter 74/74 gruen sein.
- Der DOM-Vertrag: `data-zutat`, `data-zeile`, `data-schritt` sowie die
  Klassen `gekoppelt`, `koch-neu`, `koch-im-topf`, `koch-aktiv`,
  `koch-erledigt` bleiben wie sie sind.

## 1. `css/stil.css` — Tokens ersetzen

| alt | neu (hell) | neu (dunkel) |
|---|---|---|
| `--papier #fbfaf7` | `#fbfbfd` | `#000000` |
| — (neu) `--karte` | `#ffffff` | `#1c1c1e` |
| — (neu) `--flaeche2` | `#f1f1f4` | `#2c2c2e` |
| `--tinte #23211d` | `#1d1d1f` | `#f2f2f7` |
| — (neu) `--tinte2` | `#3c3c43` | `#d1d1d6` |
| `--gedaempft #6f6a61` | `#6e6e73` | `#98989d` |
| `--linie #ded9cf` | `#efeff2` (Zeilentrennung) | `#2c2c2e` |
| — (neu) `--achse` | `#e6e6ea` | `#38383a` |
| `--gitter #a89e8b` | `#a5a5ac` (Stufenkontur) | `#636366` |
| — (neu) `--fuehrung` | `#dedee3` | `#3a3a3c` |
| `--akzent #a8482a` | `#047857` | `#30d158` |
| `--akzent-flaeche #f7e7de` | `#e6f8ec` | `#0f2a1c` |
| `--block-ruhe #e6edea` | `#fff1dc` | `#332412` |
| `--block-ruhe-rand #8faaa3` | `#ff9500` | `#ff9f0a` |
| — (neu) `--ruhe-tinte` | `#a25e00` | `#ffb340` |

Weitere Werte:

- Schriftstack (ersetzt Serif, Sans und Monospace vollstaendig):
  `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
  "Segoe UI", system-ui, Roboto, sans-serif`
- `body { font-size: 15px; line-height: 1.5; font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased; }` — damit entfaellt `--zahlen`
  (Monospace) ersatzlos; Zahlen laufen ueber Tabellenziffern.
- Laufweite: Titel `-0.03em`, Zwischenueberschriften `-0.022em`,
  Beschriftungen in Versalien `0.06em` bei 11 px.
- Radien: `8 / 13 / 18 / 22 / 999px`. **Nur Karten und Bedienelemente werden
  gerundet, niemals eine Tabellenzelle.**
- Schatten: Ruhe `0 .5px 1.5px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.05)`,
  Kochleiste `0 2px 8px rgba(0,0,0,.05), 0 22px 50px rgba(0,0,0,.1)`.
- Abstandsleiter `4 / 8 / 12 / 16 / 20 / 26 / 34 / 56px`.

### Grid-Regeln

- `.grid { table-layout: fixed; font-size: 13.5px; }` — `fixed` ist Pflicht,
  sonst greifen die Spaltenbreiten nicht.
- `.grid-rahmen` wird zur Karte: `overflow-x: auto; background: var(--karte);
  border: 1px solid var(--achse); border-radius: 18px; padding: 18px 20px 20px;`
  plus Ruheschatten.
- Stufenzelle: `border: 1px solid var(--gitter); background: transparent;
  position: relative;` — **kein** `border-radius`, **kein** Zellabstand.
- Zutatenzeile: `border-bottom: 1px solid var(--linie)`; senkrechte Achse
  links und rechts des Zutatenblocks in `var(--achse)`.
- Fuehrungslinie je Block (neu):
  `.schritt::after { content: ""; position: absolute; right: 100%;
  bottom: -1px; height: 1px; background: var(--fuehrung); pointer-events: none; }`
  Die Breite setzt `render.js` je Spalte (siehe unten). Die erste Stufe
  bekommt keine (sie grenzt an die Zutaten), die letzte auch nicht.
- Wartezeit: `.schritt-unbeaufsichtigt { background: var(--block-ruhe);
  border-left: 3px solid var(--block-ruhe-rand); }` plus Sanduhr und Text —
  Farbe traegt nie allein.
- Kochleiste: Hoehe waechst auf 9,5 rem →
  **`body.kochmodus { padding-bottom: 12.5rem; }`** (heute 11 rem).
- Neue Klassennamen, alle ASCII: `stufen-achse`, `stufen-marke`,
  `kennzahl`, `kennzahl-wert`, `portionen-segment`, `marke-fix`,
  `gekoppelt-fest`, `koch-zeitbalken`.

## 2. `js/render.js` — vier Eingriffe

1. **`schrittZelleBauen`** — Spaltenbreite und Fuehrungslinie setzen:
   `td.style.width = anteil + "%"` und
   `td.style.setProperty("--fuehrung-breite", vorlauf + "%")`, wobei
   `anteil` aus `dauer_s` kommt und `vorlauf` die Summe der vorhergehenden
   Stufenspalten in Prozent der eigenen Spalte ist.
   Breitenregel: Mindestbreite 4,5 rem, Deckel 24 % je Spalte, Rest
   proportional zu `dauer_s`. Wird gedeckelt, bekommt die Zelle den
   sichtbaren Vermerk „⁄⁄ Achse gekuerzt" und eine gestrichelte Kante.
2. **`tabelleBauen`** — eine `thead`-Zeile mit den Startzeiten je Stufe
   (0 · 6 · 11 · 12 · 15 · 50 Min), Beschriftung 11 px Versalien.
   Ausserdem `table-layout: fixed` und die Breiten der beiden
   Zutatenspalten (6 % / 16 %).
3. **`kopfBauen`** — Kennzahlenstreifen (Arbeit / ohne Zutun / gesamt) statt
   `dl.meta`, segmentierte Portionswahl statt vier Knoepfen, Tags als weiche
   Pillen, Hauptaktion als gefuellte Pille in `--akzent`.
   „ohne Zutun" ist neu und rechnet sich aus der Summe der `dauer_s` mit
   `unbeaufsichtigt: true`.
4. **`kopplungVerdrahten`** — Klick setzt `gekoppelt-fest` (Tippen daneben
   loest), damit die Kopplung auf dem Tablet funktioniert. Hover bleibt am
   Laptop erhalten.

Weiterhin ausschliesslich `textContent`, kein `innerHTML`, kein Markup in den
Rezeptdaten.

## 3. Was die Belastungsprobe (2b) ergeben hat

Rindergulasch, 20 Zutaten, 10 Stufen, eine Schmorstufe von 1:45:

- Die Treppenform haelt. Nach unten waechst die Tabelle beliebig.
- Das Zeitmass degradiert: bei 10 Stufen sitzen sieben Spalten auf der
  Mindestbreite, echt proportional bleiben nur die drei langen. Das Grid
  bleibt wahr („eine Stufe ist der ganze Nachmittag"), ist aber eine
  Rangfolge statt einer Skala.
- Die Tabelle wird 90 rem breit und **muss horizontal gescrollt werden**.
  Dafuer muessen die beiden Zutatenspalten `position: sticky; left: 0`
  bekommen — und ihre Linien als `box-shadow: inset` gezeichnet werden, weil
  Chrome bei `border-collapse: collapse` die Rahmen sticky-Zellen nicht
  mitnimmt.

## 4. Offene Entscheidungen

1. Bleibt der Deckel bei 24 %, oder gibt die gedeckelte Spalte ihre Breite an
   die kurzen Stufen ab? Empfehlung: Deckel lassen — beim Kochen ist „das
   dauert am laengsten" die wichtigere Aussage.
2. Dunkelmodus: die Kicktipp-Tokens haben keinen. Die Spalte oben ist ein
   Vorschlag auf Basis der Apple-Systemfarben, kein uebernommener Wert.
3. Das Gulasch in 2b ist **Prueflast, kein Rezept**: Mengen aus einer
   recherchierten Vorlage (essen-und-trinken.de, Rezept 40504), Schritte
   selbst formuliert, chefkoch.de war nicht abrufbar. Vor einer Datei unter
   `rezepte/` muss die Vorlage bestaetigt und `quelle` gesetzt werden.

## 5. Vorschlag fuer TASK.md

- **T-0019** Tokens und Typografie auf die Kicktipp-Linie umstellen
  (`css/stil.css`). Akzeptanz: Uebersicht und Einzelrezept unveraendert
  bedienbar, `pruefe-grid.js` 74/74 gruen, Dunkelmodus belegt.
- **T-0020** Zeitmass: Spaltenbreite aus `dauer_s`, Zeitachse als `thead`,
  Deckel mit Kuerzungsvermerk (`js/render.js`). Akzeptanz: Linsen-Eintopf
  zeigt koecheln als breiteste Spalte; ein zehnstufiges Rezept scrollt
  horizontal, ohne dass eine Spalte unter 4,5 rem faellt.
- **T-0021** Fuehrungslinie je Block (`css/stil.css` + Breite aus T-0020).
  Akzeptanz: die Unterkante jeder Stufe laeuft bis zur Zutatenspalte durch,
  ohne Beschriftungen zu ueberschreiben.
- **T-0022** Kopf und Kochleiste neu (`js/render.js`, `css/stil.css`):
  Kennzahlenstreifen, segmentierte Portionswahl, Zeitbalken in der Leiste,
  `padding-bottom: 12.5rem`. Akzeptanz: Fuss wird nicht verdeckt, alle
  Bedienziele ≥ 34 px.
- **T-0023** Zutatenspalten `sticky` beim horizontalen Scrollen, Linien als
  `box-shadow: inset`. Akzeptanz: in Chrome und Safari bleiben Menge und
  Zutat mit sichtbarer Trennlinie stehen.
