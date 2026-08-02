# TASK.md — rezept-grid

## Doing

(leer)

## Next

- **T-0009** Verteilung — **Netlify ist raus** (Abo gekuendigt, soll kein
  Geld kosten; Eintrag vom 02.08. damit ueberholt). GitHub Pages ist
  kostenlos **nur fuer oeffentliche Repos**, fuer private braucht es
  GitHub Pro — also derselbe Fehler nochmal.
  Empfehlung: **oeffentlicher Ableger** nach dem Muster, das Andre schon
  fahrt (privates Repo -> `poisson-dor`, dafuer gibt es den
  `public-mirror`-Skill mit Leak-Gate). Das private Repo behaelt
  `TASK.md`, `STATE.md`, `CLAUDE.md` und `docs/` — dort steckt der
  Personenbezug —, der Ableger bekommt nur die App: `index.html`, `css/`,
  `js/`, `rezepte/`. GitHub Pages auf dem Ableger, kostenlos.
  Die Kommentare, die vorher das private Kicktipp-Repo nannten, sind
  bereinigt (T-0031) — offen ist nur noch Andres Go.
  Ungeklaert als Alternative: Cloudflare Pages (kostenlos, unbegrenzte
  Bandbreite, 500 Builds/Monat) — ob dort ein PRIVATES GitHub-Repo im
  Gratis-Tarif verbunden werden darf, liess sich nicht belegen. Waere der
  einzige Weg mit nur einem Repo.

## Backlog

- **T-0028** "ohne Zutun" bei ueberlappenden Wartezeiten. Die Kennzahl in
  `render.js` addiert die Dauern aller Stufen mit `unbeaufsichtigt: true`.
  Laufen zwei davon gleichzeitig (paralleler Strang, in dem auch etwas
  ruht), zaehlt sie doppelt. Derzeit latent — bei allen vier Rezepten
  ueberlappt keine Wartezeit, nachgeprueft. Richtig waere die Zeit, in der
  **keine** beaufsichtigte Stufe laeuft, nicht die Summe der
  unbeaufsichtigten. Erst bauen, wenn ein Rezept den Fall erzeugt.

## Done

- **T-0026** (2026-08-02) Einkaufsliste. Auswahl per Kaestchen in der
  Uebersicht, Liste unter `?einkauf=<id>[:portionen],...` — die Auswahl
  steht damit in der URL, ist teilbar und uebersteht ein Neuladen.
  Rechnung in `js/einkauf.js` (eigenes Modul, headless pruefbar), vier
  Regeln, alle aus dem Umstand, dass Mengen sich nicht beliebig addieren:
  gleicher Name UND gleiche Einheit werden summiert; gleicher Name mit
  verschiedener Einheit bleibt getrennt ("200 g Zwiebeln" und "1 Zwiebel"
  ist keine Rechnung, die ich raten sollte); `skalieren: false` wird nicht
  summiert, sondern das Maximum genommen (zwei Rezepte mit je einer Prise
  brauchen keine zwei); mengenlose Zutaten stehen einmal ohne Menge da.
  Jeder Posten nennt seine Rezepte — sonst steht man im Laden vor
  "600 g Mehl" und weiss nicht mehr wofuer.
  **Befund aus der ersten Rechnung:** "Ei" und "Eier" standen getrennt,
  weil ich sie in den Rezepten unterschiedlich benannt hatte. Im Laden
  kauft man neun. In `maultaschen.json` vereinheitlicht und als achter
  Fallstrick in `docs/konvertierung.md` festgehalten.
  **Nachjustiert:** Das Kaestchen unter der Karte hat die Kartenraster
  zerlegt, weil `height: 100%` die Karte ueber den Platz des Kaestchens
  ziehen liess. Listenelement ist jetzt eine Flex-Spalte.
- **T-0031** (2026-08-02) Kommentare verweisen auf das **oeffentliche**
  Kicktipp-Repo (`Xindaan/poisson-dor`) statt auf das private. Andres
  Hinweis — die Sorge war gegenstandslos, das Repo ist ohnehin offen.
  Damit ist der letzte offene Punkt aus T-0009 erledigt, der nicht sein
  Go braucht.
- **T-0030** (2026-08-02) Parallele Straenge stehen jetzt auch **im Bild**
  nebeneinander, nicht nur in der Zeitrechnung. Andre hat es gemeldet:
  nach T-0027 sagte die Zeitachse "0" fuer die Fuellung, die Spalte stand
  aber weiter rechts von "Teig ruhen lassen" — Bild und Beschriftung
  widersprachen sich, und die Rueckwaerts-Null sah aus wie ein Fehler.
  Ursache: `grid.js` legte **eine Spalte je Schritt** an, streng von links
  nach rechts. Jetzt teilen sich Stufen eine Spalte, wenn ihre
  Zeilenbloecke sich nicht ueberschneiden. Zwei Bedingungen: eine Stufe
  steht rechts von allen ihren Vorstufen, und in ihrer Spalte darf keine
  andere dieselben Zeilen belegen.
  Maultaschen: 5 Stufen auf 4 Spalten, "Fuellung mischen" landet in
  Spalte 0 neben "Nudelteig kneten" — im Browser nachgemessen, beide bei
  x = 222. Zeitachse laeuft wieder vorwaerts: 0 / 10 / 40 / 60 Min.
  **Lineare Rezepte bleiben unveraendert** (jede Stufe bekommt wieder ihre
  eigene Spalte), der Eingriff ist damit chirurgisch. `render.js` legt
  Tabelle, Zeitachse und Breiten jetzt nach Spalten aus statt nach
  Schritten; eine Spalte erbt als Start den fruehesten und als Dauer die
  Spanne bis zum spaetesten Ende ihrer Stufen.
- **T-0012** (2026-08-02) **Bestaetigt von Andre: der `file://`-Weg
  funktioniert.** Doppelklick auf `index.html` zeigt die Uebersicht mit
  allen vier Rezepten, gestaltet, und ein Klick auf eine Karte oeffnet das
  Rezept. Der Manifest-Fallback traegt also — der einzige Pfad, den ich
  aus der Session nie ausfuehren konnte.
- **T-0029** (2026-08-02) Zurueck-Link oeffnete per `file://` den Finder
  statt der Uebersicht. Von Andre beim Doppelklick-Test gefunden.
  Ursache: `href = "./"` ist ein **Verzeichnis**-URL. Ueber http liefert
  der Server dort die `index.html` aus, deshalb war es unsichtbar; per
  `file://` reicht macOS ein Verzeichnis an den Finder weiter. Beide
  Stellen (`js/render.js`, `js/app.js`) auf `index.html` umgestellt, das
  funktioniert auf beiden Wegen.
  Isomorphie-Check: die uebrigen erzeugten Links sind Karten-Links
  (`?rezept=<id>`, haengen an der Datei, nicht am Verzeichnis) und die
  externe Quellen-URL — beide nicht betroffen.
- **T-0005** (2026-08-02) Zutaten im Grid abhaken (Mise en place). Klick
  oder Enter auf eine Zutatenzeile streicht sie durch; der Zustand lebt
  nur in der Sitzung — beim naechsten Kochen will man den Haken von
  gestern nicht wiedersehen.
  Bedienbar gemacht wurde die **Zutatenzelle**, nicht eine eigene
  Kontrollkaestchen-Spalte: eine dritte Spalte kostet Breite, die dem
  Zeitmass fehlt, und die ganze Zeile ist das groessere Ziel fuer fettige
  Finger. Mit `role="button"`, `tabindex` und `aria-pressed`, damit es
  auch ohne Maus geht.
  Durchgestrichen **und** gedaempft — Farbe allein traegt die Aussage
  nicht. Geprueft: ueberlebt den Portionswechsel, kollidiert weder mit
  der Hover-Kopplung noch mit dem Kochmodus, und Escape raeumt nur die
  Kochklassen ab.
- **T-0007-Nachtrag** (2026-08-02) `docs/konvertierung.md` um den siebten
  Fallstrick ergaenzt: `vorstufen` steuert die Form des Grids **und** die
  Zeitrechnung. Ein falsch gesetztes Feld sieht nicht nur schief aus, es
  produziert eine falsche Zahl — bei den Maultaschen 90 statt 75 Minuten.
  Auch in der Prompt-Vorlage nachgezogen.
- **T-0027** (2026-08-02) Zeitachse rechnet den kritischen Pfad statt
  stumpf zu addieren. Andre hat es an den Maultaschen gesehen: die Fuellung
  entsteht, waehrend der Teig ruht — die Achse zeigte trotzdem eine
  Reihenfolge. Die Daten wussten es laengst (`s-fuellung` hat
  `vorstufen: []`), nur `startzeiten` in `js/zeitmass.js` ignorierte das.
  Jetzt beginnt eine Stufe, sobald ihre Vorstufen fertig sind, und eine
  ohne Vorstufen bei null. Fuer Maultaschen: 75 statt 90 Minuten, und
  `zeit_gesamt_s` im Rezept war mit 105 Minuten ebenfalls falsch —
  korrigiert auf 4500.
  Neu dazu: `gesamtdauer()` als kritischer Pfad, eine Marke
  "∥ nebenher moeglich" an Stufen, die neben der vorherigen herlaufen
  (sonst liest man die Tabelle als Reihenfolge, wo sie Gleichzeitigkeit
  meint), und eine Pruefung, die `zeit_gesamt_s` gegen den kritischen Pfad
  haelt. Gegengeprueft: mit dem alten Wert 6300 wird sie rot.
  Isomorphie-Check: genau eine weitere Stelle derselben Klasse gefunden,
  die Kennzahl "ohne Zutun" — latent, siehe T-0028.
- **T-0008** (2026-08-02) **Entschieden: bleibt Konvention, kein Code.**
  Parallele Straenge traegt der Renderer bereits (belegt an Maultaschen).
  Der verschraenkte Fall — zwei Straenge, die sich abwechselnd Zutaten
  teilen — wird nicht gebaut. Stattdessen gilt die Regel "Zutaten eines
  Strangs in einem Schritt einfuehren" aus `docs/konvertierung.md`, die
  bisher jedes Rezept getragen hat. Tritt der Fall doch auf, meldet der
  Renderer ihn verstaendlich; dann mit echtem Anwendungsfall neu
  entscheiden.
- **T-0010** (2026-08-02) **Gestrichen.** Andre druckt keine Rezepte — in
  der Kueche steht ein Bildschirm, dafuer gibt es den Kochmodus.
- **T-0022** (2026-08-02) Kopf und Kochleiste neu. Kennzahlenstreifen mit
  drei Kacheln statt der Beschreibungsliste; "ohne Zutun" ist neu und
  rechnet sich aus den Stufen mit `unbeaufsichtigt: true` — die Zahl
  beantwortet die Frage, ob man nebenher etwas anderes machen kann.
  Portionswahl segmentiert (eine Rille, ein gewaehltes Segment) statt vier
  Einzelknoepfen, Tags als weiche Pillen, Hauptaktion als gefuellte Pille.
  Bedienziele 34 px. In der Kochleiste ein Zeitbalken: der Fortschritt ist
  aus einem Meter Abstand ablesbar, bevor man die Ziffern entziffert; bei
  Stufen ohne Dauer wird er ausgeblendet. `padding-bottom` auf 12,5 rem —
  gemessen: Leiste 104 px hoch, Polsterung 200 px, der Fuss bleibt frei.
- **T-0023** (2026-08-02) Zutatenspalten bleiben beim waagerechten
  Scrollen stehen. Ihre Linien sind auf `box-shadow: inset` umgestellt,
  weil Chrome die Rahmen sticky-positionierter Zellen bei
  `border-collapse: collapse` verschluckt. Der linke Rand der zweiten
  Spalte kommt als `--zutat-links` aus der Breitenrechnung: gescrollt wird
  nur, wenn die Tabelle auf ihrer Mindestbreite steht, und genau dort
  stimmt der Wert exakt. Gemessen: bei 560 px Rahmen und 200 px Scroll
  bleibt die Mengenspalte bei 21 px stehen, die Stufen wandern weg.
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
