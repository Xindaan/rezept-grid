# TASK.md — rezept-grid

## Doing

(leer)

## Next

- **T-0012** `file://`-Smoke-Test in einem echten Browser bestaetigen:
  `index.html` doppelklicken, pruefen ob CSS greift und ob der
  Manifest-Fallback das Rezept laedt. In der Claude-Session nicht
  verifizierbar (Preview-Pane ist kein echter `file://`-Origin, der
  Chrome-Connector erzwingt ein `https://`-Praefix). Ueber http ist der
  Pfad gruen. Akzeptanz: Befund notiert; falls CSS oder Laden scheitert,
  Folge-Task.
- **T-0007** `docs/konvertierung.md`: Arbeitsanleitung + Prompt-Vorlage fuer
  Claude-Sessions. Jetzt mit Erfahrung aus zwei Konvertierungen schreibbar;
  die Fallstricke stehen schon in `docs/schema.md` und im README.

- **T-0019** Tokens und Typografie auf die Kicktipp-Linie umstellen
  (`css/stil.css`), nach `docs/uebergabe-zeitmass.md` Abschnitt 1.
  Akzeptanz: Uebersicht und Einzelrezept unveraendert bedienbar,
  Dunkelmodus belegt. **Nicht** `pruefe-grid.js` als Nachweis nehmen — die
  Pruefungen laufen headless ueber `grid.js`/`portionen.js` und fassen
  weder CSS noch `render.js` an; sie bleiben auch dann gruen, wenn die
  Oberflaeche zerlegt ist. Nachweis ist der Browser.
- **T-0020** Zeitmass: Spaltenbreite aus `dauer_s`, Zeitachse als `thead`,
  Deckel mit Kuerzungsvermerk (`js/render.js`).
  **Zwei Korrekturen an der Vorlage, beide nachgemessen:**
  (a) Die Breite darf NICHT per `td.style.width` in `schrittZelleBauen`
  gesetzt werden. `table-layout: fixed` liest Spaltenbreiten nur aus der
  ersten Zeile; ausser der ersten beginnt jede Stufenzelle in einer
  spaeteren Zeile, ihre Breite wird still ignoriert (gemessen: 240 px statt
  der gesetzten 480 px). Stattdessen ein `<colgroup>` mit einem `<col>` je
  Spalte in `tabelleBauen` erzeugen — damit greifen die Breiten exakt.
  (b) Die Mindestbreite von 4,5 rem laesst sich nicht per CSS `min-width`
  halten, das ist unter `table-layout: fixed` wirkungslos (gemessen: 16 px
  statt 72 px). Die Untergrenze muss beim Rechnen der Prozentwerte geklemmt
  und der Rest neu normiert werden.
  Akzeptanz: Linsen-Eintopf zeigt koecheln als breiteste Spalte; ein
  zehnstufiges Rezept scrollt horizontal, ohne dass eine Spalte unter
  4,5 rem faellt.
- **T-0021** Fuehrungslinie je Block (`css/stil.css` + Breite aus T-0020).
  Akzeptanz: die Unterkante jeder Stufe laeuft bis zur Zutatenspalte durch,
  ohne Beschriftungen zu ueberschreiben.
- **T-0022** Kopf und Kochleiste neu (`js/render.js`, `css/stil.css`):
  Kennzahlenstreifen, segmentierte Portionswahl, Zeitbalken in der Leiste,
  `padding-bottom: 12.5rem`. Akzeptanz: Fuss wird nicht verdeckt, alle
  Bedienziele >= 34 px.
- **T-0023** Zutatenspalten `sticky` beim horizontalen Scrollen, Linien als
  `box-shadow: inset`. Akzeptanz: in Chrome und Safari bleiben Menge und
  Zutat mit sichtbarer Trennlinie stehen.

## Backlog

- **T-0024** Gulasch als Rezept aufnehmen — **erst nach Quellenklaerung**.
  Die 20-Zutaten-Fassung aus der Belastungsprobe (2b) ist Prueflast: Mengen
  aus essen-und-trinken.de (Rezept 40504), chefkoch.de war nicht abrufbar.
  Vor einer Datei unter `rezepte/` muss `quelle` auf die tatsaechlich
  benutzte Vorlage gesetzt und die Schritte neu formuliert sein. Solange
  nicht geklaert, darf die Datei nicht unter `rezepte/` liegen: der
  Manifest-Waechter und `pruefe-grid.js` ziehen sie sonst sofort in die
  Uebersicht und damit zu Familie und Freunden.
- **T-0005** Zutaten-Abhaken per Klick (Einkauf / Mise en place).
- **T-0008** Nicht-lineare Rezepte (parallele Straenge, z. B. Sauce separat):
  Konzept Teiltabellen/verschachtelte Spalten. Erst nach T-0002 stabil.
- **T-0009** Verteilung an Familie+Freunde (GitHub Pages o. ae.) inkl.
  kurzem Urheberrechts-Check der enthaltenen Rezepte.
- **T-0010** Druck-Stylesheet (eine Seite, ohne Controls).
- **T-0011** Schema-Checkscript fuer alle Dateien unter `rezepte/` (Node,
  ohne Dependencies). Weitgehend erledigt: `tools/pruefe-grid.js` laeuft
  jetzt ueber **alle** `rezepte/*.json` und prueft IDs, Dateinamen,
  `menge`/`einheit`-Paarung, `menge_bis > menge`, Vorstufen-Reihenfolge,
  fehlerfreies Layout und saubere Mengen bei jeder Portionszahl.
  `tools/build-manifest.js` prueft JSON-Gueltigkeit und `id` == Dateiname.
  Offen: Einheiten-Vokabular gegen eine feste Liste pruefen, damit Tippfehler
  ("Zehen" statt "Zehe") auffallen statt still in die Dezimalrundung zu
  laufen.

## Done

- **T-0018** (2026-08-01) Zweiter Designdurchgang, diesmal ohne die Vorgabe
  "wie das Original" — Andre hat ausdruecklich freie Hand gegeben. Richtung:
  Kuechen-Spezifikation (technische Zeichnung auf warmem Papier). Genau ein
  Akzent (`--akzent`, gebranntes Rot) fuer zweierlei: was gerade
  zusammengehoert, und die eine Haupthandlung (Kochmodus). Beschriftungen im
  Kopf als Versalien mit Sperrung, Werte gross; Tags von Pillen auf durch
  Mittelpunkte getrennte Versalien.
  Neu und mehr als Kosmetik: **Kopplung beim Ueberfahren** — faehrt man ueber
  eine Stufe, leuchten ihre Zutaten mit, und umgekehrt. Das Grid behauptet,
  dass diese Zutaten zu dieser Stufe gehoeren; die Hervorhebung macht die
  Behauptung nachpruefbar, ohne die Treppenform mit dem Auge verfolgen zu
  muessen. Im Kochmodus abgeschaltet (dort fuehrt die Stufennavigation), auf
  Geraeten ohne Mauszeiger per `@media (hover: none)` neutralisiert.
  T-0017 (Abgleich mit dem Original) ist damit hinfaellig.
- **T-0016** (2026-08-01) Grid-Design ueberarbeitet, nachdem Andre die
  fehlenden horizontalen Linien bemaengelt hat. Drei Ursachen, alle in
  `css/stil.css`: `border-spacing: 3px` liess nichts sich beruehren, sodass
  gar kein Raster entstand; die Haarlinie lag nur auf `.zutat`, nicht auf
  `.menge`, lief also nur unter der halben Zeile; `border-radius` machte aus
  den Schrittzellen Karten statt Tabellenfelder. Jetzt `border-collapse:
  collapse`, durchgehende Haarlinien ueber beide Zutatenspalten, geschlossener
  Zutatenblock mit senkrechter Achse, Schrittzellen ohne Rundung mit
  sichtbarer Kante. Zwei Linienstaerken eingefuehrt (`--linie` fuer
  Zeilentrennung, `--gitter` fuer Struktur), Fuellung zurueckgenommen — in
  der Chu-Notation tragen die Linien die Information, nicht die Flaeche.
  Mengen und Zeiten in Monospace mit Tabellenziffern (`--zahlen`).
  `min-width` der Schrittzellen auf 6,25rem, damit ein Rezept mit sechs
  Stufen auf einen Laptop-Bildschirm passt statt zu scrollen.
  Nicht erreicht: das Original-Artifact als Vorlage — sein Inhalt liegt
  hinter einem Login (siehe T-0017).
- **T-0006** (2026-08-01) Rezept-Uebersicht: `index.html` ohne Parameter
  listet alle Rezepte als Karten (Titel, Untertitel, Gesamtzeit, Portionen,
  Schrittzahl, Tags), `?rezept=<id>` zeigt das Einzelrezept mit
  Zurueck-Link. Unbekannte ID erzeugt eine Fehlermeldung mit Rueckweg statt
  einer leeren Seite. Quelle der Liste ist `rezepte/manifest.js` — ohne
  Server gibt es kein Verzeichnis-Listing, also auch ueber http.
- **T-0013** (2026-08-01) Veraltetes Manifest verhindern: `pruefe-grid.js`
  vergleicht `rezepte/manifest.js` gegen die JSON-Dateien und meldet
  fehlende, abweichende und verwaiste Eintraege. Durch T-0006 wurde das
  akut — ein vergessener `build-manifest.js`-Lauf liesse ein neues Rezept
  in der Uebersicht schlicht fehlen. Der Waechter wurde gegengeprueft:
  kuenstlich veraltetes Manifest -> Pruefung wird rot.
- **T-0015** (2026-08-01) README angelegt: Quickstart, Nutzung, Rezept
  hinzufuegen, Troubleshooting (die drei Fehlerbilder, die die App
  tatsaechlich anzeigt), Development, Architektur.
- **T-0014** (2026-08-01) Zweites Rezept konvertiert: `rezepte/eierkuchen.json`
  (7 Zutaten, 6 Schritte). Damit ist das Akzeptanzkriterium aus T-0001
  geprueft — mit einem Befund: das **Datenmodell** trug das Rezept
  unveraendert, aber eine Validierungsregel in `docs/schema.md` war zu
  streng. Sie verbot `einheit: null` bei gesetzter Menge, was "4 Eier"
  braucht; der Renderer konnte es laengst. Regel gelockert. Dabei fiel ein
  latenter Fehler auf: Mengen ohne Einheit liefen in die Dezimalrundung,
  "3 Eier" bei anderthalbfacher Menge waeren "4,5 Eier" geworden statt
  "4½". In `js/portionen.js` behoben.
  Quelle: Chefkoch-Link von Andre war fuer den Abruf gesperrt, daher das
  Grundrezept eigenstaendig formuliert und `quelle: null` gesetzt statt
  eine ungelesene Quelle einzutragen. Falls die Chefkoch-Mengen abweichen,
  nachziehen.
- **T-0004** (2026-08-01) Kochmodus in `js/kochmodus.js`: Stufen-Navigation
  (Knoepfe, Pfeiltasten, Escape), Countdown je Stufe mit Start/Pause, feste
  Bedienleiste unten, Rest des Grids gedimmt. Entscheidung beim Bauen:
  hervorgehoben werden die Zutaten, die bei der Stufe **neu** dazukommen,
  nicht ihr ganzer Zeilenblock — der waechst kumulativ und waere bei der
  letzten Stufe das komplette Rezept. Dafuer weist `grid.js` jetzt
  `eigeneZeilen` je Spalte aus, getrennt vom geerbten Block; im Grid sind
  beide Ebenen unterschiedlich stark hervorgehoben (neu / schon im Topf).
  Stufenwechsel setzt den Timer zurueck. Kreuzeffekt geprueft:
  Portionswechsel im laufenden Kochmodus rechnet um, ohne die
  Hervorhebung zu verlieren. 61/61 Pruefungen gruen.
- **T-0003** (2026-08-01) Portions-Skalierung in `js/portionen.js` +
  Umschaltknoepfen im Rezeptkopf. Zwei Rundungsregeln statt einer:
  Gewicht/Volumen ab 10 ganzzahlig und darunter eine Nachkommastelle,
  gezaehlte/geloeffelte Einheiten dagegen auf Kuechenbrueche
  (¼ ⅓ ½ ⅔ ¾) — "1,3 Zehen" ist keine ausfuehrbare Anweisung, "1⅓" schon.
  Die Einheiten-Zuordnung steht in `BRUCH_EINHEITEN`; neue Einheiten
  muessen dort eingetragen werden. `skalieren: false` bleibt fix und wird
  gedaempft dargestellt. Beim Umschalten wird nur die Mengenspalte neu
  geschrieben, das Grid bleibt strukturell stehen. Im Browser fuer
  2/4/6/8 Portionen geklickt und zurueck; 48/48 Pruefungen gruen.
- **T-0001** (2026-08-01) Rezept-JSON-Schema `docs/schema.md` + Beispielrezept
  `rezepte/linsen-eintopf.json`. Kernentscheidungen: ein Schritt listet nur
  die bei ihm **neu** hinzukommenden Zutaten (daraus faellt die
  Zeilenreihenfolge automatisch), `vorstufen` verweist auf vorhergehende
  Schritte (heute immer der Vorgaenger, spaeter der Hebel fuer T-0008),
  `dauer_s` pro Schritt in Sekunden mit `null` fuer zeitlose Stufen, plus
  `unbeaufsichtigt` zur Trennung von Warte- und Arbeitszeit (Andres
  Entscheidung, fuer T-0004). Folge fuer Konvertierungen: eine Zutat belegt
  genau eine Zeile — mehrfach verwendete Zutaten brauchen je einen eigenen
  Eintrag.
- **T-0002** (2026-08-01) Grid-Renderer fuer lineare Rezepte: `index.html`,
  `js/grid.js` (Layout-Berechnung, ohne DOM), `js/render.js` (Modell -> DOM),
  `js/app.js` (Laden), `css/stil.css`. Alle drei Edge Cases im Browser
  belegt: Schritt ohne neue Zutaten erbt die Hoehe der Vorstufe, Zutat ohne
  Menge laesst die Mengenspalte leer, letzte Stufe ohne Timer zeigt keine
  Dauer. Fehlerhafte Rezepte werden als Liste angezeigt statt zu werfen;
  nicht-zusammenhaengende Bloecke werden als "noch nicht unterstuetzt"
  (T-0008) gemeldet. 18/18 Pruefungen gruen (`node tools/pruefe-grid.js`).
