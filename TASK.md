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
- **T-0022** Kopf und Kochleiste neu (`js/render.js`, `css/stil.css`):
  Kennzahlenstreifen, segmentierte Portionswahl, Zeitbalken in der Leiste,
  `padding-bottom: 12.5rem`. Akzeptanz: Fuss wird nicht verdeckt, alle
  Bedienziele >= 34 px.
- **T-0023** Zutatenspalten `sticky` beim horizontalen Scrollen, Linien als
  `box-shadow: inset`. Akzeptanz: in Chrome und Safari bleiben Menge und
  Zutat mit sichtbarer Trennlinie stehen.

## Backlog

- **T-0005** Zutaten-Abhaken per Klick (Einkauf / Mise en place).
- **T-0008** Nicht-lineare Rezepte — **die Einschraenkung ist enger als
  bisher angenommen.** Belegt an `rezepte/maultaschen.json` (T-0025):
  parallele Straenge funktionieren bereits, wenn ihre Zutaten im Grid
  hintereinander liegen. Teig belegt Zeile 0–3, Fuellung 4–15, beide Bloecke
  zusammenhaengend, der Zusammenfuehrungsschritt umfasst 0–15 — der
  Renderer meldet nichts und stellt es korrekt als zwei Klammern dar.
  Offen ist nur der **verschraenkte** Fall: wenn zwei Straenge sich
  abwechselnd Zutaten teilen, laegen fremde Zeilen im Block und die
  Zusammenhangspruefung schlaegt an. Dafuer braeuchte es Teiltabellen oder
  verschachtelte Spalten. Vorher pruefen, ob dieser Fall in echten Rezepten
  ueberhaupt vorkommt — moeglicherweise reicht die Regel "Zutaten eines
  Strangs zusammenhalten" als Konvention in `docs/konvertierung.md`.
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

- **T-0020** (2026-08-02) Zeitmass: Spaltenbreite aus `dauer_s`,
  Zeitachse als `thead`, Deckel bei 24 %. Rechnung in `js/zeitmass.js`
  (eigenes Modul, damit sie headless pruefbar ist statt nur im Browser
  anschaubar). Die beiden gemeldeten Korrekturen sind drin: `colgroup`
  statt `td.style.width`, Untergrenze beim Rechnen statt per CSS.
  **Drei Abweichungen von der Vorlage, alle aus dem Nachrechnen:**
  (a) Gerechnet wird an der MINDESTbreite, nicht an der verfuegbaren.
  Prozentwerte, die bei 1000 px 72 px ergeben, unterschreiten sie bei
  740 px — die Untergrenze haelt nur, wenn sie am schmalsten Fall haengt.
  Nebengewinn: die Verhaeltnisse sind bei jeder Fensterbreite dieselben
  und es braucht **keinen** `ResizeObserver`. Das ist auch noetig: im
  Vorschau-Pane feuert der nachweislich nie, eine daran haengende
  Untergrenze waere dort schlicht weg.
  (b) Der Deckel greift nie unter dem Gleichanteil. Sonst reissen bei
  wenigen Stufen alle Spalten den Deckel, niemand nimmt den Ueberschuss
  auf, und die Tabelle kommt auf 72 statt 78 Prozent.
  (c) Der Vermerk "Achse gekuerzt" meint nicht die interne Deckelung —
  die greift durch die Untergrenze fast nie. Er meint die Aussage, die den
  Leser angeht: diese Stufe ist X % der Gesamtzeit, bekommt aber Y % der
  Breite. Bei Spaetzle "52 % → 22 %".
  Reserve von 25 % des Stufenbereichs, damit die Proportion nicht bei
  langen Rezepten zusammenfaellt — ohne sie waeren bei zwoelf Stufen alle
  Spalten exakt gleich breit und das Zeitmass tot.
  Zehn Prueffaelle in `pruefe-grid.js`; drei davon haben beim ersten Lauf
  echte Fehler gefunden (Deckel frisst Breite, Untergrenze faellt).
- **T-0021** (2026-08-02) Fuehrungslinie je Block. Andre hat sie im Entwurf
  vermisst — sie macht sichtbar, auf welcher Hoehe eine Stufe endet, ohne
  dass das Auge die Treppe verfolgen muss.
  **Ohne die Kopplung an T-0020 gebaut.** Die Uebergabe schlaegt ein
  `::after` mit `right: 100%` und einer aus den Spaltenbreiten gerechneten
  Laenge vor. Noetig ist das nicht: Unter jedem Block liegen in seiner
  Endzeile genau die leeren Zellen der Spalten links davon, lueckenlos bis
  zur Zutatenachse — nachgerechnet fuer alle vier Rezepte. Die Linie ist
  daher ein `border-bottom` auf diesen Zellen. Kein Messen, kein
  ResizeObserver, und sie ueberlebt jede spaetere Aenderung der
  Spaltenbreiten durch T-0020.
  Endet eine fruehere Stufe in derselben Zeile, zeichnet deren eigene
  Unterkante das Stueck — die Linie bleibt trotzdem durchgehend. Erste und
  letzte Stufe bekommen keine, wie in der Uebergabe vorgesehen.
- **T-0019** (2026-08-02) Tokens und Typografie auf die Kicktipp-Linie
  umgestellt. Ein Schriftstack fuer alles, `font-variant-numeric:
  tabular-nums` global — `--zahlen` (Monospace) ist damit ersatzlos
  entfallen. Neue Tokens: `--karte`, `--flaeche2`, `--tinte2`, `--achse`,
  `--fuehrung`, `--ruhe-tinte`; `--block` und `--block-rand` sind weg.
  Der Grid-Rahmen ist eine Karte mit 18 px Radius und Ruheschatten;
  Tabellenzellen bleiben eckig. Akzent von gebranntem Rot auf Gruen.
  **Farbe traegt nicht mehr allein:** Wartezeit hat zusaetzlich eine 3 px
  linke Kante und die Marke "⧗ laeuft von allein", feste Mengen eine Marke
  "fix" neben dem Namen. Beides in `render.js` ergaenzt.
  Alle zwoelf Farbpaarungen auf Kontrast nachgerechnet, alle >= 4,5:1 —
  auch der erfundene Dunkelmodus. Nebenbefund: `color: var(--papier)` auf
  dem Akzentknopf loest die Umkehr in beiden Modi von selbst, weil
  `--papier` im Dunkelmodus schwarz ist.
  **Nachjustiert:** Seit der Rahmen eine Karte mit Polsterung ist, fehlte
  die Breite, die vorher der Negativrand gab — die letzte Stufenspalte lag
  ausserhalb des Bildes. Die Zutatenspalte ist jetzt umbruchfaehig mit
  12 rem Untergrenze; lieber zwei Zeilen Notiz als eine unsichtbare Spalte.
- **T-0025** (2026-08-02) Rezeptbestand ausgetauscht. Linsen-Eintopf und
  Gulasch waren Prueflast, keine Rezepte, die jemand kochen will. Der
  Linsen-Eintopf ist **nicht geloescht**, sondern nach
  `tools/testdaten/linsen-eintopf.json` gewandert: sieben Detailpruefungen
  in `pruefe-grid.js` haengen an seinen konkreten Bloecken und rowspans
  (3/6/7/11/11/15), die waeren sonst als Regressionsbasis verloren. Er
  taucht dort nicht mehr im Manifest und damit nicht in der Uebersicht auf.
  Neu: `pfannkuchen` (Berliner Lesart, Hefeteig mit Konfitüre — bewusst
  neben `eierkuchen` gestellt, damit der Namensstreit dokumentiert ist),
  `spaetzle` und `maultaschen` (Gaertringer Seite der Familie).
  Alle drei eigenstaendig formuliert, `quelle: null`. 76/76 gruen.
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
