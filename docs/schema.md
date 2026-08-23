# Rezept-JSON-Schema

Version 1 (2026-08-01). Jedes Rezept ist genau eine JSON-Datei unter
`rezepte/`, Dateiname = `id` + `.json`, ASCII, kebab-case
(`eierkuchen.json`, `maultaschen.json`). UTF-8 ohne BOM; Umlaute in
nutzersichtbaren Strings sind erwuenscht (siehe CLAUDE.md, Sprach-Override).

Nicht unter `rezepte/` gehoeren Testdaten — alles dort landet ueber das
Manifest in der Uebersicht. Vorlagen fuer Pruefungen liegen in
`tools/testdaten/`.

## Grundprinzip

**Das Grid steht nicht in der Datei.** Die Datei beschreibt nur, welche
Zutat in welchem Schritt zum ersten Mal auftaucht und welcher Schritt auf
welchem aufbaut. Zeilenreihenfolge, `rowspan`s und Luecken berechnet der
Renderer daraus (Algorithmus siehe unten). Handkodierte Layout-Angaben
gibt es im Schema absichtlich nicht.

## Top-Level

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `schema` | number | ja | Schema-Version, aktuell `1` |
| `id` | string | ja | kebab-case ASCII, = Dateiname ohne `.json` |
| `titel` | string | ja | Anzeigename |
| `untertitel` | string | nein | eine Zeile Einordnung |
| `portionen` | number | ja | **Basis-Portionszahl**, auf die sich alle `menge`-Werte beziehen |
| `portionen_einheit` | string | nein | Default `"Portionen"`; z. B. `"Glaeser"`, `"Stueck"` |
| `zeit_aktiv_s` | number\|null | ja | Arbeitszeit in Sekunden |
| `zeit_gesamt_s` | number\|null | ja | Gesamtzeit inkl. Warten, in Sekunden |
| `gefaess` | string | nein | z. B. `"Grosser Topf, min. 4 L"` |
| `tags` | string[] | nein | frei, klein geschrieben |
| `quelle` | object\|null | ja | siehe unten; `null` = Eigenkreation |
| `zutaten` | object[] | ja | siehe unten, mind. 1 |
| `schritte` | object[] | ja | siehe unten, mind. 1, **in Kochreihenfolge** |
| `hinweise` | string[] | nein | Tipps, Varianten, Aufbewahrung |

### `quelle`

```json
{ "titel": "Name des Rezepts/Buchs", "autor": "...", "url": "https://...",
  "hinweis": "Schritte eigenstaendig formuliert" }
```

Alle Felder optional, aber wenn eine fremde Vorlage benutzt wurde, ist
`quelle` nicht `null`. Woertliche Anleitungstexte werden nicht uebernommen
(CLAUDE.md, Abschnitt Urheberrecht).

## `zutaten[]`

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `id` | string | ja | kebab-case ASCII, eindeutig im Rezept, Praefix `z-` |
| `name` | string | ja | Anzeigename, z. B. `"Berglinsen"` |
| `menge` | number\|null | ja | Zahl fuer `portionen` Portionen; `null` = mengenlos ("nach Geschmack", "zum Servieren") |
| `menge_bis` | number\|null | nein | Obergrenze bei Spannen (`1`–`2 EL`); nur zusammen mit `menge` |
| `einheit` | string\|null | ja | `"g"`, `"ml"`, `"EL"`, `"TL"`, `"Zehe"`, `"Blatt"`, `"Bund"`, `"Prise"`, …; `null` in zwei Faellen: mengenlose Zutat (`menge` ist `null`) **oder** reine Stueckzahl (`4` + `"Eier"` — keine Einheit noetig) |
| `notiz` | string\|null | nein | Zustand/Vorbereitung: `"fein gewuerfelt"`, `"zum Servieren"` |
| `skalieren` | boolean | nein | Default `true`. `false` = Menge bleibt bei Portionswechsel fix (Lorbeer, Salzwasser) |

**Skalierung und Rundung** (implementiert in `js/portionen.js`): Beim
Portionswechsel wird `menge` (und `menge_bis`) mit
`gewaehlte_portionen / portionen` multipliziert und dann je nach Einheit
gerundet:

- **Gewicht/Volumen** (`g`, `ml`, alles nicht unten Genannte): ab 10
  ganzzahlig, darunter eine Nachkommastelle. `133,33 ml` -> `133 ml`,
  `9,44 g` -> `9,4 g`.
- **Stueck-artige Einheiten** (`EL`, `TL`, `Msp`, `Prise`, `Stueck`,
  `Zehe`, `Blatt`, `Stiel`, `Zweig`, `Bund`, `Dose`, `Packung`,
  `Scheibe`, `Handvoll`): auf gaengige Kuechenbrueche
  (¼, ⅓, ½, ⅔, ¾). `1,5 TL` -> `1½ TL`, `2,25 TL` -> `2¼ TL`.
  Werte knapp ueber 0 fallen nicht auf 0, sondern auf ¼.
- `skalieren: false` haelt die Menge fest; sie wird gedaempft dargestellt
  und traegt einen Hinweis-Tooltip.
- Mengenlose Zutaten (`menge: null`) bleiben leer.

Wer eine neue Einheit einfuehrt, muss sie in `BRUCH_EINHEITEN`
(`js/portionen.js`) eintragen, wenn sie gezaehlt statt gewogen wird —
sonst bekommt sie Nachkommastellen.

**Die Reihenfolge im Array ist bedeutungslos** fuer die Anzeige — die
Zeilenreihenfolge ergibt sich aus der Erstverwendung. Fuer die Lesbarkeit
der Datei trotzdem grob in Kochreihenfolge halten.

## `schritte[]`

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `id` | string | ja | kebab-case ASCII, eindeutig, Praefix `s-` |
| `titel` | string | ja | **Kurzlabel fuer die Grid-Zelle**, 1–4 Woerter (`"anschwitzen"`) |
| `anweisung` | string | ja | ein bis zwei Saetze fuer Detailansicht/Kochmodus |
| `dauer_s` | number\|null | ja | Dauer **dieses** Schritts in Sekunden; `null` = ohne Zeit (Abschmecken, Servieren) |
| `zutaten` | string[] | ja | IDs der hier **neu hinzukommenden** Zutaten, in gewuenschter Zeilenreihenfolge; darf leer sein |
| `unbeaufsichtigt` | boolean | nein | Default `false`. `true` = laeuft ohne Zutun (koecheln, backen, ruhen) |
| `vorstufen` | string[] | nein | IDs vorheriger Schritte, deren Ergebnis hier eingeht. Default: der unmittelbar vorhergehende Schritt (`[]` beim ersten). Fuer lineare Rezepte optional, wird der Klarheit halber trotzdem geschrieben |
| `temperatur_c` | number\|null | nein | Ofen-/Zieltemperatur |

**Zutaten-Referenz-Regel:** Jede Zutat wird in **genau einem** Schritt
gelistet — dem, in dem sie zum ersten Mal in den Topf geht. Das ist die
Zeile, in der sie im Grid steht. Wird eine Zutat spaeter erneut gebraucht
(die zweite Haelfte der Butter), ist das eine **eigene Zutat** mit eigener
`id` (`z-butter-2`, `name: "Butter"`, `notiz: "restliche Haelfte"`) — sonst
laesst sich die Zeile nicht eindeutig platzieren.

**Dauer-Regel:** `dauer_s` gehoert zum Schritt, nicht zur Zutat, und ist
immer die Dauer *dieses einen* Schritts (nicht kumulativ). Die Grid-Zelle
zeigt `titel` + formatierte Dauer (`"koecheln, 35 Min"`), der Kochmodus
(T-0004) nimmt denselben Wert als Countdown. `null` heisst: keine Zeile,
kein Timer.

**`unbeaufsichtigt`** trennt Wartezeit von Arbeitszeit: `true` bei
Schritten, die von allein laufen (koecheln, backen, ruhen, marinieren),
`false` (Default) bei allem, wo man am Topf steht. Die Summe der
`false`-Dauern ist die Untergrenze von `zeit_aktiv_s`; nach oben ist
`zeit_gesamt_s` die Grenze. `zeit_gesamt_s` selbst liegt zwischen dem
Ende des Einpersonen-Plans und diesem Ende plus 10 %. Alle drei Grenzen
prueft `tools/pruefe-grid.js` seit T-0046.

Seit T-0032 ist das Feld kein Etikett mehr, sondern **treibt den
Zeitplan und damit das Grid**: der Renderer plant fuer EINE Person, und
zwei `false`-Stufen koennen sich deshalb nie ueberlappen. Eine
`true`-Stufe belegt die Haende nicht und startet, sobald ihre Vorstufen
fertig sind — nur in ihrem Schatten kann eine andere Stufe nebenherlaufen.
Fehlt das Flag bei einer echten Wartezeit, ruecken alle folgenden Stufen
nach hinten und das Rezept sieht laenger und stumpf-linear aus.

## Grid-Berechnung (Renderer)

1. **Zeilenreihenfolge:** Schritte in Array-Reihenfolge durchgehen, pro
   Schritt dessen `zutaten` in Array-Reihenfolge anhaengen. Ergebnis ist
   die Zeilenliste von oben nach unten.
2. **Zeilenblock je Schritt:** `block(s)` = Vereinigung der Zeilen seiner
   neuen Zutaten und der Bloecke aller `vorstufen`. Bei linearen Rezepten
   ist das immer ein zusammenhaengender Bereich `[von, bis]`.
3. **Spalten:** eine Spalte je Schritt, in Array-Reihenfolge. Die Zelle
   des Schritts sitzt in seiner Spalte, beginnt bei `block.von` und hat
   `rowspan = block.bis - block.von + 1`.
4. **Luecken:** In Spalte *k* bleiben Zeilen ausserhalb von `block(s_k)`
   leer — das sind die Zutaten, die erst spaeter dazukommen. Sie werden
   als leere Zellen ohne Rahmen gerendert.

## Edge Cases (muessen funktionieren)

- **Schritt ohne neue Zutaten** (`zutaten: []`): Block = Block der
  Vorstufe. Die Zelle hat denselben `rowspan` wie die vorherige Spalte —
  eine reine Zeit-/Aktionsstufe (`"koecheln, 35 Min"`).
- **Zutat ohne Menge** (`menge: null`): Zeile zeigt nur `name` und
  `notiz` (`"Petersilie — zum Servieren"`), Mengenspalte bleibt leer.
  Skalierung (T-0003) ueberspringt solche Zutaten.
- **Letzte Stufe ohne Timer** (`dauer_s: null`): Zelle zeigt nur `titel`,
  keine Zeitangabe; Kochmodus bietet dort keinen Countdown an.

## Validierungsregeln (T-0011)

- `id` eindeutig ueber Zutaten bzw. Schritte; Dateiname == `id`.
- Jede Zutat wird von genau einem Schritt referenziert — keine
  unbenutzte, keine doppelt referenzierte.
- Jede `vorstufen`-ID existiert und steht **vor** dem Schritt im Array.
- `menge: null` erzwingt `einheit: null`. Umgekehrt gilt das **nicht**:
  `einheit: null` mit gesetzter `menge` ist die reine Stueckzahl
  ("4 Eier") und wird wie eine gezaehlte Einheit gerundet.
- `menge_bis` nur mit `menge`, und `menge_bis > menge`.
- Blockberechnung ergibt zusammenhaengende Bereiche (sonst ist das
  Rezept nicht linear -> T-0008).

## Bewusst noch nicht im Schema

- **Portions-Skalierung (T-0003)** ist umgesetzt und brauchte kein neues
  Feld: `portionen` als Basis und `skalieren` je Zutat reichen, die
  Rundungslogik liegt im Renderer (siehe oben).
- **Kochmodus (T-0004)** ist umgesetzt und brauchte kein neues Feld:
  `dauer_s` treibt den Countdown, `anweisung` steht in der Bedienleiste,
  `unbeaufsichtigt` erzeugt die Markierung "läuft von allein".
  Hervorgehoben werden die Zutaten, die bei der Stufe **neu** dazukommen
  (`eigeneZeilen` im Grid-Modell) — nicht der ganze Zeilenblock, der
  waechst kumulativ und umfasst bei der letzten Stufe das ganze Rezept.
  Fuer die Konvertierung heisst das: `titel` sollte die Handlung
  benennen ("aufgießen"), weil er in der Leiste als Ueberschrift steht.
- **Nicht-lineare Rezepte (T-0008)** sind der Grund fuer `vorstufen`:
  ein zweiter Strang ist ein Schritt mit `vorstufen: []` mitten im Array,
  ein Zusammenfuehren ein Schritt mit zwei Eintraegen in `vorstufen`.
  Umgesetzt seit T-0030 (Spalten) und T-0032 (Zeitplan): der Renderer
  stellt parallele Straenge nebeneinander und legt sie in die Zeit, in
  der sie fuer eine Person tatsaechlich machbar sind.
