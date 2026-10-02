# TASK.md — rezept-grid

## Doing

(leer)

## Next

Quelle von T-0071 bis T-0087: Review Oktober 2026, Bericht in
`docs/review-2026-10.md` (je Befund-ID: Stelle, Repro, Gate-Urteil).
"bestaetigt" heisst: ein Pruefagent auf Opus hat den Befund selbst
nachgestellt. "ohne Gate" heisst Einzelstimme — vor dem Umsetzen selbst
nachstellen.

- **T-0071** **Kochmodus folgt der aktiven Stufe.** `gehe()` setzt nur
  Klassen und scrollt nie; am Telefon blendet `stil.css:985` die Anweisung
  in der Leiste aus. Ab Stufe 2-3 liegt die aktive Stufe unter der Leiste
  oder ausserhalb des Bildes — gemessen bei 375x812, 1024x768 (Tablet quer)
  und 812x375 (Telefon quer, Leiste dort 46 % der Hoehe). Drei Dimensionen
  haben das unabhaengig gefunden. Befunde ui-mobil-1, ui-gross-4,
  zustand-7, ui-mobil-15 (bestaetigt, hoch).
  Akzeptanz: nach jedem Stufenwechsel stehen aktive Stufe und ihre neuen
  Zutaten sichtbar oberhalb der Leiste, gemessen in allen fuenf Rezepten
  in den drei Groessen; Anweisung am Telefon lesbar; reduced-motion
  beachtet; Test mit Negativprobe.

- **T-0072** **Laufende Uhr ueberlebt den Stufenwechsel, Alarm bis zur
  Quittung, Kochstand uebersteht ein Neuladen.** `gehe()` ->
  `timerSetzen()` -> `countdown.setzen()` verwirft die laufende Uhr
  (kochmodus.js:333/230) — genau bei "Teig ruhen", wo man weiterblaettert.
  T-0004 hat das Zuruecksetzen festgelegt, aber vor den parallelen
  Straengen (T-0030) und vor dem Alarm (T-0063). Der Alarm klingt einmal
  2x0,25 s, danach bleibt nur eine rote 0:00. Stufe und Uhr gehen beim
  Neuladen verloren, obwohl der Merker genau fuer "Telefon sperrt und
  laedt neu" gebaut ist. Dazu: "Beenden" ohne Rueckfrage 6 px neben
  "Weiter"; ein verspaeteter Tick startet die Uhr von vorn. Befunde
  ui-mobil-2, zustand-1 (bestaetigt, hoch), ui-mobil-7, zustand-8,
  ui-mobil-3 (bestaetigt, mittel), zustand-11, zustand-14.
  **Entschieden (2026-10-02):** eine Uhr je unbeaufsichtigter Stufe, die
  weiterlaeuft und in der Leiste mit ihrem Stufennamen steht (verworfen:
  eine einzige Uhr mit Rueckfrage beim Wechsel).
  Akzeptanz: Weiter/Zurueck waehrend einer laufenden Ruhe-Uhr laesst sie
  laufen und den Alarm kommen; der Alarm wiederholt sich sichtbar, bis er
  quittiert ist; Neuladen stellt Stufe und Restzeit aus dem
  Wanduhr-Anker wieder her.

- **T-0073** **Pruefsuite laesst gueltige Rezepte durch.** Zwei Pruefungen
  schreiben den Bestand als Regel fest. "Arbeit + ohne Zutun ergibt
  gesamt" liest blind drei Kacheln, die Kachel "ohne Zutun" fehlt aber bei
  0 (render.js:496): jedes Rezept ohne Wartezeit (Salat, Ruehrei) wird rot
  mit "... statt undefined" (pruefe-grid.js:1113). "Ausstattung: jedes
  Rezept hat genau eine" verlangt das optionale `gefaess`
  (pruefe-grid.js:1631 gegen schema.md:32). Befunde daten-2, daten-4
  (bestaetigt, mittel), architektur-7 (Endwerte einzelner Produktivrezepte
  fest verdrahtet).
  Akzeptanz: ein Testrezept ohne Wartezeit und ohne `gefaess` unter
  `tools/testdaten/` ist gruen; Negativprobe je Pruefung.

- **T-0074** **Zeitmass-Aussagen stimmen.** (a) "Achse gekuerzt"
  vergleicht den Zeitanteil (Bezug: Stufen = 100 %) mit dem Breitenanteil
  (Bezug: ganze Tabelle, davon 22 % Zutatenspalten). Damit gilt jede Stufe
  ueber 24 % als gekuerzt, auch wenn sie massstabsgetreu steht; im Bestand
  Maultaschen "Fuellen 27 % -> 20 %". Steht zweimal: zeitmass.js:154 und
  render.js:291; T-0056 hat das nicht erfasst. (b) "Zu zweit waeren es X"
  nennt den kritischen Pfad bei unbegrenzt vielen Haenden, ab drei
  parallelen Straengen falsch (render.js:509). (c) Das Planende haengt an
  der letzten Spalte statt an der spaetest endenden Stufe (render.js:204).
  (d) `spaltenbreiten([])` liefert ein anderes Format, Absturz statt
  Problembox. Befunde planer-7, planer-1 (bestaetigt, mittel), planer-13,
  planer-12, planer-14, ui-gross-9.
  Akzeptanz: Vermerk und Breite auf derselben Skala; "zu zweit" aus einem
  echten Zweipersonen-Plan; je Teil ein Test mit Negativprobe.

- **T-0075** **Einkaufsliste: gemerkte Portionen, Haken je Liste, URL
  streng.** (a) Die Liste startet immer bei der Basisportion, der Merker
  der Rezeptseite wird nicht gelesen (app.js:129, render.js:1108). (b) Die
  Haken liegen unter einem einzigen Schluessel und gelten 24 h fuer jede
  andere Liste (render.js:853/888): "Eier" steht abgehakt, obwohl fuer
  diese Liste nichts gekauft wurde. (c) `?einkauf=constructor` erzeugt eine
  Phantomzeile (`nachId = {}`); `parseInt` nimmt "4.5" als 4 und "1e3" als
  1, ohne Obergrenze; unbekannte IDs fallen still weg. (d) Bei 360 px
  laeuft die Portionszeile 8 px ueber. (e) Feste Mengen desselben Postens
  im SELBEN Rezept werden per Maximum statt Summe zusammengefasst
  (einkauf.js:76). Befunde ui-mobil-10/-11 (bestaetigt, mittel),
  ui-mobil-12, mengen-1/-2/-3/-4/-8/-11, zustand-10/-12/-13/-15.
  Akzeptanz: je Teil ein Verhaltenstest mit Negativprobe; bei 360 px kein
  waagerechter Ueberlauf (gemessen).

- **T-0076** **Kochmodus: Fokus, Tastatur, Wachhalter, Ton.** Beim Start
  bleibt der Fokus auf dem unsichtbaren Startknopf, beim Beenden faellt er
  auf `body`; die Leiste liegt 23 Tab-Stopps entfernt. Pfeiltasten ohne
  Modifier-Pruefung (Alt+Links wird gekapert). Der Wake Lock wird nach
  `visibilitychange` nicht neu angefordert und leckt, wenn Beenden vor dem
  Promise kommt; der Alarm ruft kein `resume()` am AudioContext. Befunde
  ui-gross-1, zustand-5, a11y-css-7 (bestaetigt, mittel), zustand-2
  (bestaetigt, mittel — nur per Attrappe belegt), zustand-3, zustand-4,
  zustand-6, mutation-26.
  Akzeptanz: Fokus geht beim Start in die Leiste und beim Beenden zurueck
  auf den Startknopf (echter Tastendruck, gemessen); Wake Lock nach
  Sichtbarkeitswechsel wieder angefordert (Attrappe; endgueltig nur auf
  Hardware pruefbar).

- **T-0077** **Kaputte Daten legen keine Seite lahm.** Der Schema-Waechter
  prueft weder Typen noch unbekannte Felder noch alle Pflichtfelder:
  `tags` als String, `vorstufen` als String, der Tippfehler `skaliern` und
  `quelle.url` mit `javascript:` laufen gruen durch. Ein einziges kaputtes
  Rezept legt dann die ganze Uebersicht lahm (render.js:1053). Doppelte
  Schritt-IDs werden nicht gemeldet. Ein Merker-Eintrag mit falschem Typ
  legt die Rezeptseite fuer bis zu 24 h lahm (render.js:1215). "Stueck"
  und "Stück" sind beide erlaubt; gleiche Namen ueber Rezepte prueft
  niemand. Befunde architektur-2 (bestaetigt, mittel), architektur-3,
  planer-4, planer-15, zustand-9, architektur-4, mengen-6/-7, daten-5.
  Akzeptanz: je Fehlerart eine beschaedigte Testdatei, die mit
  verstaendlicher Meldung rot wird; die Uebersicht zeigt die heilen Karten
  und meldet die kaputte.

- **T-0078** **Autorenweg: Seitenstrang, Vorheizen, Temperatur.**
  Probe-Konvertierung "Kaesespaetzle mit Roestzwiebeln": nach der
  Anleitung nicht darstellbar, weil der Planer den kurzen Strang in die
  Ruhezeit legt und Fallstrick 10 dann mit der Zeilenblock-Regel
  kollidiert; gruen nur mit einem undokumentierten Vorab-Schritt fuer Kaese
  und Butter. "Ofen vorheizen" als eigener Strang faellt aus Plan, Achse
  und Kochmodus (grid.js:96); die Meldung nennt keinen Ausweg, die
  Anleitung schweigt. `temperatur_c` fehlt in der Anleitung. schema.md:87
  nennt die Array-Reihenfolge "bedeutungslos", sie entscheidet aber ueber
  die Darstellbarkeit. Die Meldung "kann der Renderer noch nicht (T-0008)"
  widerspricht T-0008. Befunde daten-1, daten-3, planer-8 (bestaetigt,
  mittel), planer-5, daten-13, daten-8.
  Haengt an T-0079: faellt die Entscheidung dort fuer "berechnen",
  entfaellt der groesste Teil.

- **T-0079** **Zeilenreihenfolge aus der Stufenstruktur berechnen
  (T-0008 am 2026-10-02 neu entschieden).** T-0008 hat "bleibt Konvention" entschieden
  und angekuendigt, mit einem echten Anwendungsfall neu zu entscheiden;
  daten-1 (Kaesespaetzle) ist dieser Fall. Gemessen: 25-30 % der
  Zufallsrezepte ohne Verschraenkung werden heute allein wegen der
  Array-Reihenfolge als "nicht zusammenhaengend" gemeldet; ordnet man die
  Zeilen in Nachordnung des Stufenbaums, sind alle darstellbar (planer-6,
  bestaetigt, mittel). Eckpfeiler 3 ("Layout wird berechnet, nie von Hand
  kodiert") spricht dafuer. **Entschieden: berechnen** (verworfen: Konvention
  behalten und nur die Anleitung ergaenzen).
  Akzeptanz: alle verschraenkungsfreien Zufallsrezepte ohne
  Zeilenblock-Meldung; die fuenf Rezepte des Bestands unveraendert
  dargestellt; danach T-0078 neu zuschneiden.

- **T-0080** **Pruefsuite deckt die Oberflaeche ab.** Mutationstest: 279
  Mutanten, 115 gefangen (bereinigt um aequivalente 47 %). Die
  Rechenkerne sind scharf; duenn sind Kochleiste (34 von 43 ueberleben),
  Stufenliste (18 von 22), `app.start`/URL-Weiche (laeuft nie),
  Tabellenzellen und der Einkaufs-Schluessel (Einheit und Art je einzeln
  ungeprueft). Die DOM-Attrappe weicht in sieben gemessenen Punkten vom
  Browser ab (`getElementById` erfindet Knoten statt `null`, ein
  disabled-Knopf feuert `click`, kein Bubbling und kein keydown-Versand,
  `tabIndex` immer 0). Befunde mutation-1 bis -24, planer-9, planer-11.
  Vorgehen: kein Testbau auf Vorrat. Jeder Fix aus T-0071 bis T-0078
  bringt seinen Regressionstest an der zustaendigen Grenze mit; hier
  bleibt, was danach noch offen ist (Attrappe treuer, `app.start`
  pruefbar). Wert-Huerde je Test.

## Backlog

- **T-0081** **Barrierefreiheit.** Vorziehbar, weil klein: der Quelllink
  steht im Dunkelmodus in Browser-Blau auf Schwarz, 2,2:1 — das
  Stylesheet hat keine Linkfarbe (a11y-css-3, bestaetigt, mittel). Dazu
  Stufenliste ohne Ueberschriften, Portionsknoepfe ohne Gruppennamen,
  Sprung zum Wortlaut ohne Fokus, Kontrast von Tags und abgehakten Mengen,
  smooth-Scroll ohne reduced-motion, Schrift fest 15 px (folgt der
  Browser-Schriftgroesse nicht), Tabelle ohne Spaltenkoepfe,
  Einkaufsposten `role=button` statt checkbox, kein forced-colors-Zweig.
  Befunde a11y-css-1 bis -21, ui-mobil-14/-19, mengen-16, ui-gross-6/-7.

- **T-0082** **Lesbarkeit und Verstaendnis.** Keine Lesehilfe fuer die
  Notation; Jargon "Strang" und "Zusammenlauf (10 Zutaten)";
  Anweisungstext 14 px, Zeitangaben 11,8 px; Abhaken nicht erkennbar;
  Zeitachsen-Hinweis am Telefon, wo es keine Zeitachse gibt; Fehlermeldung
  in Entwicklersprache. Tablet: Zeitachse beim Querscrollen nicht sticky,
  ein Tipp auf eine Stufe scrollt die gerade gekoppelten Zutaten aus dem
  Bild; Spaltenmass in px bricht bei Textvergroesserung. Befunde
  ui-mobil-4/-5/-6/-8/-9/-13/-16/-17/-18, ui-gross-2/-3/-5/-8.

- **T-0083** **Mengenanzeige und Einkaufsliste im Detail.** Spannen
  kollabieren ("11–11 g"), Kleinstmengen runden auf "0 g", kg/l ab 10 auf
  ganze Einheiten, Einheiten ohne Plural ("8 Stiel"), Stueckware als Bruch
  auf der Einkaufsliste ("7½ Eier"), g/kg und ml/l nicht zusammengefasst,
  mengenlose Zeile neben dem Mengenposten, Wasser/Salz/Zucker als Rauschen
  (kein Merkmal "Vorrat"). Befunde mengen-5/-9/-10/-12/-13/-14/-15,
  daten-10/-11, architektur-5. Alles niedrig oder ohne Gate.

- **T-0084** **Rezeptinhalte pruefen (Kuechenurteile, nicht gerechnet).**
  Maultaschen: "bis sie oben schwimmen" als Garzeichen bei roher
  Fleischfuellung (daten-7, plausibel). "unbeaufsichtigt" uneinheitlich:
  Spaetzle-Wasser zaehlt als Arbeit, Omelett-Stocken als Pause (daten-9).
  Spaetzle-Teig mit 100 ml Wasser auf 400 g Mehl eher fest (daten-12, aus
  dem Gedaechtnis, gegenpruefen). Pfannkuchen: Selbstverweis auf die
  Sammlung und Plauderton (daten-14). Entscheidung beim Maintainer.

- **T-0085** **Wartbarkeit und Doku-Stand.** `el()` dreimal byte-gleich;
  Zutatenzeile und Stufenmarken in Tabelle und Stufenliste getrennt
  gebaut; render.js mit fuenf Zustaendigkeiten; sechs von sechzehn
  geprueften Kommentaren veraltet (render.js:657 "Zustand lebt nur in der
  Sitzung" ist seit T-0064 falsch); README kennt Merker, Alarm und Druck
  nicht; uebergabe-zeitmass.md behauptet einen Stand vor T-0066;
  Pixelgrenzen der Zutatenspalten in JS und CSS doppelt; toter Code
  (`zutatenPx[1]`, `gedeckelt`, Vorstufen-Waechter grid.js:166).
  Skalierung auf 50-100 Rezepte: Manifest auf jeder Seite, keine Suche.
  Befunde architektur-1/-6/-8 bis -14, mutation-25, planer-10,
  a11y-css-22.

- **T-0086** **Auslieferung, Offline, Eingabewege (nur gelesen, nicht per
  Agent geprueft).** (a) Skripte und CSS ohne Versionskennung: nach einem
  Deploy auf Pages kann ein Browser neue und alte Dateien mischen. (b)
  Netz weg beim Neuladen in der Kueche: ueber http fuehrt ein reiner
  Netzwerkfehler zur Fehlerseite, obwohl die Manifest-Fassung vorliegt
  (app.js:84-94; der Fallback ist seit T-0047 bewusst auf `file:`
  beschraenkt — die Abwaegung neu stellen fuer den Fall "Netzwerkfehler"
  statt "HTTP-Fehler"). **Entschieden (2026-10-02):** bei einem reinen
  Netzwerkfehler die Manifest-Fassung zeigen, mit sichtbarem Hinweis
  "offline, Stand vom ..."; HTTP-Fehler und kaputte JSON bleiben rote Box.
  (c) `quelle.url` geht ungeprueft in ein `href`
  (render.js:608). `innerHTML` kommt im Code nicht vor. Pruefauftraege im
  Bericht, Anhang.

- **T-0087** **Planer: qualitaetskritische Stufen spaet legen (Idee).**
  Der Planer legt jede Stufe so frueh wie moeglich: Roestzwiebeln 25 Min
  vor dem Anrichten, Spaetzle-Wasser 20 Min vor dem Schaben (daten-6,
  Folge der bekannten Heuristik). Gegen das Optimum fuer eine Person liegt
  er in 0,4-1 % der Faelle daneben; zwei Muster sind benannt (planer-2,
  planer-3). Idee: Feld "so spaet wie moeglich" je Stufe.

## Done

- **T-0088** (2026-10-02) **Review Oktober 2026 abgeschlossen, Vorname
  wieder aus TASK.md entfernt.** Neun Pruefdimensionen (Planer, Mengen,
  Laufzeitzustand, Architektur, Mutationstest, UX Telefon, UX Tablet und
  Desktop, Barrierefreiheit, Rezeptdaten mit Probe-Konvertierung), Finder
  auf Sonnet, Gate auf Opus. 150 Befunde: 62 bestaetigt, 2 plausibel,
  1 bereits bekannt, 85 ohne Gate, keiner widerlegt. Bericht
  `docs/review-2026-10.md`, Aufgaben T-0071 bis T-0087.
  Nebenbefund beim Erzeugen des Berichts: T-0035 hatte den Vornamen vor
  der Veroeffentlichung aus allen versionierten Dateien entfernt; seit
  dem 05.09. stand er in fuenf Saetzen von TASK.md wieder drin (Eintraege
  T-0009, T-0053, T-0066, T-0068), gepusht. Umformuliert wie in T-0035,
  ohne Traeger. Gegenprobe: `git grep -i -w` nach dem Vornamen samt
  Genitiv-Form ueber alle versionierten Dateien ist leer, der Bericht
  ebenfalls. Die Historie
  bleibt unangetastet (siehe T-0036).

- **T-0070** (2026-09-02) **Eine Rechnung fuer jede Gesamtzeit.** Die
  Uebersichtskarte zeigte `zeit_gesamt_s` aus der Datei, der Rezeptkopf
  seit T-0059 den gerechneten Plan. Solange sich beide decken — bei allen
  fuenf Rezepten des Bestands der Fall — faellt nichts auf; nutzt ein
  Rezept den erlaubten 10-%-Puffer, stuende auf der Karte "44 Min" und im
  Kopf "40 Min". Dieselbe Fehlerklasse wie T-0053, eine Ebene hoeher.

  Beim Aufraeumen kam ein **dritter** Ort dazu, an dem dieselbe Zahl
  gerechnet wurde: `zeitachseBauen` hatte eine eigene Kopie — und ihre
  lokale Variable `planende` haette den neuen gemeinsamen Helfer sogar
  ueberdeckt. Jetzt rechnet `planende(modell)` an einer Stelle, und Kopf,
  Achse und Karte lesen sie. Dass die drei dasselbe zeigen, ist damit
  keine Zusage mehr, die jemand einhalten muss, sondern eine Eigenschaft
  des Codes.

  **Der Test erzwingt den Fall, statt auf ihn zu warten:** ein Rezept, das
  den Puffer ausnutzt (Plan 2400 s, Feld 2640 s). Nur daran laesst sich
  ueberhaupt sehen, welche Quelle die Karte liest — mit dem echten
  Bestand waere jede Fassung gruen. Dazu die Invariante ueber alle
  Rezepte: was auf der Karte steht, steht auch im Kopf. 291 -> 294.

- **T-0066** (2026-09-02) **Kopplung auf Fingergeraeten — Vorgabe des Maintainers
  statt einer meiner Varianten.** Vorgelegt hatte ich A (verzichten), B
  (langes Druecken) und C (Schalter im Kopf) mit Empfehlung A. Die
  Antwort war keine der drei, sondern das Ziel: *"iPad und iOS muss
  beides unabhaengig voneinander optimal gehen."* Damit fiel A weg, und
  die Frage war nicht mehr ob, sondern wie.

  Gebaut ist die Kopplung **ohne neue Geste**: der Tipp auf die
  Stufenzelle springt seit T-0038 zum Wortlaut und heisst jetzt
  zusaetzlich "das ist die Stufe, die mich interessiert". Eine Bewegung,
  zwei Wirkungen, beide sagen dasselbe. Damit entfaellt Bs Kollision mit
  Textauswahl und Kontextmenue auf iOS und Cs zusaetzliches Bedienelement.
  Abweichung von der Design-Uebergabe: dort loeste "Tippen daneben" — das
  waere ein Zuhoerer auf dem ganzen Dokument, der bei jedem Abhaken
  mitfeuert. Stattdessen loest der zweite Tipp auf dieselbe Stufe.
  Am Laptop bleibt das Ueberfahren wie es war, der Klick setzt zusaetzlich
  fest; genau so stand es in der Uebergabe.

  **Erst messen, dann bauen.** Beide Geraeteklassen wurden im Browser
  vermessen, und beide hatten einen eigenen Mangel:

  - **iPad (Tabelle, ab 600 px):** Kopplung beim Tippen wirkungslos —
    0 hervorgehobene Zellen, und `@media (hover: none)` schaltete die
    Hervorhebung sogar sichtbar ab. Das war der eigentliche Befund.
  - **iPad, zweiter Fund:** die Marke "läuft von allein" ist 105 px
    breit, zwei der drei Stufenspalten sind auf 767 px nur 83 und 97 px.
    Bei `table-layout: fixed` wird nichts abgeschnitten, es ueberlappt —
    die Marke sah aus, als gehoere sie zur Nachbarstufe. Unter 900 px
    duerfen die Marken jetzt umbrechen.
  - **iPad, dritter Fund:** "ausbacken" braucht 74 px in einer 70-px-Zelle
    und stand ueber der Spaltenkante. Die Seite ist `lang="de"`, der
    Browser kann trennen — er tat es nur nicht. `hyphens: auto` (mit
    `-webkit-`-Praefix, iOS ist ausdruecklich im Ziel) fuer Schritt-Titel
    und Zutatennamen. Danach: kein einziges ueberlaufendes Element mehr.
  - **iPhone (Stufenliste, unter 600 px):** Zutaten **ohne Notiz** hatten
    nur ein 23 px hohes Tippziel. Die Zeile hielt ihre 44 pt, aber
    abgehakt wird die Zutatenspanne darin, und die ist nur so hoch wie
    ihr Text. Elf von dreizehn Zeilen im Pfannkuchen waren betroffen.
    Jetzt fuellt das Ziel die Zeile: **44 px, gemessen, in allen 13.**

  **Eine Annahme von mir hat die Messung widerlegt:** ich hatte 21 px
  Polster fuer den Grund gehalten, dass ein Rezept mit sechs Spalten auf
  768 px nicht scrollfrei passt, und wollte sie wegkuerzen. Nachgemessen
  bleiben auch mit fast keinem Polster 14 px Ueberstand. Der Grund steckt
  in `zeitmass.js`: `RESERVE` haelt 25 % des Stufenbereichs frei, damit
  sich die Dauern in den Breiten abbilden koennen — sechs Spalten
  brauchen dadurch 739 px. **Auf einem Tablet ist entweder das Zeitmass
  da oder die Tabelle passt; beides geht nicht.** Diese Entscheidung ist
  alt und richtig (T-0020), und die stehenden Zutatenspalten aus T-0023
  sind die Antwort darauf. Das Polster ist trotzdem gekuerzt (32 px mehr
  Tabelle je Bildschirm), aber der Kommentar sagt jetzt, was es leistet
  und was nicht.

  Vier Pruefungen, vier getrennte Negativproben. 283 -> 291.

  **Nicht geprueft:** echte iPad- und iPhone-Hardware. Gemessen wurde mit
  Chrome-Geraeteemulation (`hover: none`, `pointer: coarse`), die die
  Medienabfragen richtig setzt, aber kein Safari ist.

- **T-0068** (2026-09-02) **`zeit_aktiv_s` und `zeit_gesamt_s` bleiben im
  Schema.** Entschieden nach Entscheidungsvorlage, Option A.
  Faktenlage, die dahinter steht: beide Felder decken sich bei 4 von 5
  Rezepten exakt mit dem gerechneten Wert — sie tragen also fast keine
  eigene Information. Ihr Wert liegt im Widerspruch, wenn einer auftritt,
  und der hat zweimal echte Fehler gefunden (T-0046, T-0053), beide Male
  war die Angabe des Menschen richtig und der Plan falsch.
  Bekanntes Gegenargument, ausdruecklich in Kauf genommen: Redundanz, die
  nur eine Pruefung zusammenhaelt, ist dasselbe Muster, das in diesem
  Projekt schon dreimal auseinandergelaufen ist (T-0049, T-0056, T-0062).
  Hier ist sie Absicht — steht so in `docs/schema.md`, damit es niemand
  in einem Jahr "aufraeumt".

- **T-0069** (2026-09-02) **Fremder Worktree entfernt.** Vor dem Loeschen
  gemessen statt angenommen: beide Branches 0 Commits vor `main`, der
  Worktree-HEAD (3718cd8) Vorfahre von `main`, Arbeitsbaum sauber, letzte
  Aktivitaet 15.08. Es ging nichts verloren. `git worktree remove` plus
  `git branch -d` (nicht `-D`, damit es verweigert haette, falls doch
  etwas Unverschmolzenes drinsteckt), dazu das leere Huellenverzeichnis.
  Gegenprobe: ein rekursives `find` nach `render.js` liefert wieder genau
  einen Treffer.

- **T-0054 bis T-0067** (2026-09-02) **Zweiten Code-Review aufgearbeitet,
  alles umgesetzt.** Quelle: eigener Review-Durchgang vom 02.09.2026
  (Fable 5.1, Vollreview der Codebase). Zehn Befunde plus drei, die erst
  beim Umsetzen und im Browser dazukamen. Pruefungen **197 -> 283**.

  Zwei Dinge ziehen sich durch: die Befunde A/C/E hatten dieselbe
  Ursache — **eine Sache, mehrere Quellen** — und die Befunde D/T-0067
  dieselbe: **eine Pruefung, die schweigt, statt zu widersprechen.**

  - **T-0054** Der Planer liess die Haende leer. `zeitmass.js` waehlte
    die naechste Stufe allein nach dem laengsten Restpfad, ohne zu
    fragen, wann sie ueberhaupt anfangen kann. Stand ein unabhaengiger
    Arbeitsschritt im Array hinter einer Stufe, die auf eine Ruhezeit
    wartet, gewann die wartende, `handFrei` sprang mit ihr ans Ende der
    Ruhezeit, und die bereite Stufe kam erst danach.
    Gemessen an [10 Min Arbeit, 60 Min Ruhe, 10 Min Arbeit, 10 Min freie
    Arbeit]: **90 statt 80 Minuten**, dazu eine falsche Warnung "zu
    zweit ginge es schneller" — und `pruefe-grid.js` verlangte danach
    die falsche groessere Zahl in `zeit_gesamt_s`. Im Bestand nicht
    sichtbar, weil dort der Restpfad-Sieger zufaellig auch der
    fruehestmoegliche ist; faellig beim naechsten Rezept mit Seitenstrang.
    Jetzt zwei Regeln: erst der frueheste Startzeitpunkt, dann der
    Restpfad. Bekannte Grenze bleibt, dass der Plan nie wartet, solange
    Arbeit da ist — im Kommentar benannt.
    **Negativprobe je Regel einzeln.** Beim ersten Anlauf blieb die
    Probe zu Regel 2 gruen: mein Testfall hatte den Restpfad-Sieger
    zufaellig an erster Stelle, damit traf ihn auch "nimm den ersten".
    Ersetzt durch einen Fall, in dem die Feldreihenfolge die falsche
    Antwort ist.

  - **T-0055** `breitenAnwenden` lief in **keiner** Pruefung. Die
    Funktion beginnt mit `var rahmen = tabelle.parentElement; if
    (!rahmen) return;` — und die Attrappe kannte `parentElement` nicht.
    Gemessen: nach `rezeptRendern` war `style.minWidth` undefined und
    alle acht col-Breiten ebenfalls. Damit waren Zeitmass, sticky-Versatz
    und Kuerzungsvermerk ungeprueft, waehrend STATE.md "DOM-Schicht
    geprueft" meldete.
    Attrappe nachgeruestet (`parentElement`, `style.setProperty`,
    `offsetWidth`, `scrollIntoView`, ein Register fuer `id`), sieben
    Pruefungen auf die Breiten dazu.
    **Und die Ursache behoben, nicht nur den Fall:** die Attrappe
    **wirft** jetzt bei jeder unbekannten Eigenschaft, statt still
    `undefined` zu liefern. `ERLAUBT_UNBEKANNT` ist die Liste der
    Annahmen, die sie ueber ihre Umgebung macht — jede mit Grund.

  - **T-0056** Der Kuerzungsvermerk gehoerte der Spalte, stand aber an
    jeder Stufe darin. Bei den Maultaschen trug "Fuellung mischen"
    (15 von 90 Min) den Satz "Achse gekuerzt, 40 % -> 22 %" — die Zahl
    der Teigruhe, die dieselbe Spalte aufspannt. Fuer die Fuellung war
    "gekuerzt" sogar das Gegenteil: sie ist breiter dargestellt, als ihre
    Dauer hergibt. Gerechnet wird jetzt je Stufe; die Regel selbst steht
    als `istGekuerzt` an genau einer Stelle.

  - **T-0057** Einkaufsliste, drei Dinge auf einmal.
    (a) Spannen addierten falsch: eine Zutat ohne Spanne trug zur
    Obergrenze nichts bei, aus "1 EL" plus "1-2 EL" wurde "2-2 EL" statt
    "2-3 EL". (b) `?einkauf=spaetzle:-4` ergab "-400 g Mehl", `:0` liess
    alle Mengen verschwinden — die URL ist teilbar und damit Eingabe von
    aussen. (c) `replaceState` stand vor dem Fortschreiben der Liste;
    wirft es (ueber file:// tut es das in manchen Browsern), blieb der
    Portionswechsel wirkungslos. Reihenfolge getauscht, Pruefung mit
    absichtlich werfendem `replaceState`.

  - **T-0058** Rundung bei `kg` und `l`. Eine Nachkommastelle ist dort
    100 g bzw. 100 ml: aus 0,75 l wurde "0,8 l", aus 1,25 kg "1,3 kg".
    Grosse Einheiten bekommen zwei Stellen — wieder dieselbe Feinheit
    wie eine Stelle bei g und ml. Im Bestand aendert sich nichts (alle
    kg/l-Mengen sind glatt), der Fehler war latent.

  - **T-0059** Der Kopf hatte drei Quellen fuer eine Sache: "Arbeit" aus
    dem JSON-Feld, "ohne Zutun" gerechnet, "gesamt" wieder aus dem JSON.
    Zwei Wege, auf denen das auseinanderlaeuft: ein Schritt, den das Grid
    nicht darstellen kann (zutatenlos ohne gueltige Vorstufe, etwa "Ofen
    vorheizen" als eigener Strang), faellt aus dem Modell, zaehlte aber
    weiter im Kopf — 25 Minuten oben, Achse endet bei 11. Und sobald ein
    Rezept den dokumentierten 10-%-Puffer nutzt, widersprachen sich
    Kachel und Achse, und zwei Pruefungen schlugen an, obwohl die Datei
    der Regel folgte.
    Jetzt kommen alle drei Kacheln aus demselben Plan wie die Zeitachse.
    Die Rechnung im Kopf geht dadurch **zwangslaeufig** auf statt
    zufaellig. Anzeige aller fuenf Rezepte unveraendert.
    Die JSON-Felder bleiben als Angabe des Autors — siehe T-0068.

  - **T-0060** Die Stufenzelle war selbst der Knopf. `role="button"` auf
    einem `<td>` nimmt der Zelle ihre Rolle im Raster, und das
    `aria-label` **ersetzte** den Namen: Dauer, Temperatur, "laeuft von
    allein" und "nebenher moeglich" standen sichtbar da, wurden aber
    nicht mehr vorgelesen — genau die Angaben, fuer die es die Marken
    gibt. Jetzt sitzt ein echter `<button>` in der Zelle, sein Name wird
    aus denselben Teilen gebaut, die dastehen. Die Zutatenzelle ist
    `role="checkbox"` mit `aria-checked` — abgehakt ist ein Zustand,
    kein Knopfdruck.
    **Im Browser nachgemessen und dabei einen eigenen Regress gefunden:**
    das Tippziel war von 180x208 auf 161x43 px geschrumpft. Eine leere
    `::after`-Flaeche legt es wieder ueber die ganze Zelle; alle vier
    Ecken treffen (nachgemessen mit `elementFromPoint`).
    Nebenbefund aus der Negativprobe: `pruefe()` stuerzte ab, wenn ein
    DOM-Knoten im Vergleich landet (Ringstruktur). Ein Test, der im
    Fehlerfall abstuerzt statt zu melden, nimmt einem die Meldung —
    abgefangen.

  - **T-0061** Uebersicht und Einkaufsliste hingen auch ueber http am
    Manifest. T-0047 hatte nur das Einzelrezept geradegezogen: wer eine
    JSON aenderte und `build-manifest` vergass, sah das Rezept mit neuen
    Mengen und die Einkaufsliste mit alten, ohne Hinweis. Ueber http
    liefert das Manifest jetzt nur noch die Liste der Namen; der Inhalt
    kommt frisch. Was sich nicht laden laesst, faellt zurueck **und wird
    gemeldet**.

  - **T-0062** Aufraeumen. `CLAUDE.md` nannte ein `check-rezepte.js`, das
    es nie gab. Die README-Modulliste fuehrte 5 von 8 Modulen.
    `docs/schema.md` beschrieb "eine Spalte je Schritt" — seit T-0030
    ist eine Spalte ein Zeitpunkt. Das Einheiten-Vokabular stand doppelt
    (portionen.js und pruefe-grid.js) und kommt jetzt aus einer Quelle.
    Die Schema-Pruefung deckt zusaetzlich `schema`, `titel`, `anweisung`,
    die id-Form, `quelle` und den Typ von `dauer_s` ab — sechs Waechter,
    jeder einzeln an einer beschaedigten Datei probiert.

  - **T-0063** Der Timer sagte niemandem Bescheid. Seit T-0045 rechnet er
    richtig, aber man muss ihn ansehen — und beim Kochen liegt das
    Telefon mit dem Display nach unten. Jetzt Vibration, zwei kurze Toene
    ueber WebAudio (Kontext wird beim Druck auf "Start" freigeschaltet,
    das ist die noetige Nutzergeste) und Wake Lock waehrend des
    Kochmodus. Jeder Weg einzeln eingepackt: faellt einer aus, laufen die
    anderen. Geprueft wird das Verhalten — Alarm genau einmal, auch wenn
    mehrere Ticks nachkommen.

  - **T-0064** Zustand ueberlebt das Neuladen, aber nicht den naechsten
    Tag. Bisher lebte alles nur als CSS-Klasse; ein Neuladen loeschte
    Haken, Portionswahl und Auswahl. Die alte Begruendung ("den Haken von
    gestern will man nicht sehen") stimmt trotzdem — der Unterschied ist
    die ZEIT. Neues Modul `js/merker.js`: Ablage mit 24-Stunden-Verfall,
    jeder Zugriff eingepackt (localStorage wirft in privaten Fenstern,
    bei vollem Speicher und teils per file://), kaputte Eintraege werden
    weggeworfen. Gemerkt werden Portionszahl und Haken je Rezept, die
    Haken der Einkaufsliste und die Auswahl der Uebersicht. Eine
    gespeicherte Portionszahl wird gegen die Auswahl geprueft, bevor sie
    gilt.

  - **T-0065** Druck-Stylesheet. Bisher druckte die Seite, was der
    Bildschirm zeigte — Bedienelemente, Schatten, im Dunkelmodus weisse
    Schrift auf schwarzem Grund. Gedruckt wird die Tabelle (nicht die
    Stufenliste), Farben werden festgelegt statt geerbt, Zeilen und
    Stufen brechen nicht ueber den Seitenrand. Die Mindestbreite steht
    als Inline-Stil an der Tabelle und braucht `!important`, sonst laeuft
    sie ueber den Rand — im Browser geprueft, dass die 16 Druckregeln
    wirklich geparst wurden, nicht nur im Quelltext stehen.

  - **T-0067** **`hidden` verbarg nicht.** Im Browser gefunden, nicht im
    Code: `.einkauf-leiste` hat `display: flex`, der Code setzt
    `leiste.hidden = true` — und die Regel des Browsers
    (`[hidden] { display: none }`) verliert gegen jede eigene Regel,
    unabhaengig von der Spezifitaet. Die Leiste "Einkaufsliste oeffnen"
    stand seit T-0026 **immer** da, 88,8 px hoch, obwohl der Kommentar
    daneben sagt "erscheint erst, wenn etwas gewaehlt ist".
    Die Pruefungen sahen `hidden === true` und waren zufrieden; sie
    kennen kein CSS. Jetzt einmal global `[hidden] { display: none
    !important; }`.
    Dabei aufgefallen: die Uebersicht schrieb bei jedem Aufruf eine leere
    Auswahl in die Ablage und haette damit ueberschrieben, was sie gerade
    wiederherstellen wollte.

  **Was NICHT geprueft ist:** Screenreader mit echter Software (die
  ARIA-Aenderungen sind nach Spezifikation gebaut, nicht vorgelesen
  getestet), das Druckbild auf Papier (nur die geparsten Regeln),
  Vibration und Wake Lock auf echter Hardware (headless nicht
  vorhanden), sowie iOS-Safari insgesamt.

- **T-0009** (2026-08-23) **Verteilung erledigt — beim Commit-Durchgang
  nachgeprueft, der Task stand faelschlich noch offen.** Entschieden am
  03.08.2026: EIN oeffentliches Repo, GitHub Pages darauf. Kein Ableger,
  kein `public-mirror`.
  Vorgeschichte: Netlify raus (Abo gekuendigt), GitHub Pages kostenlos nur
  fuer oeffentliche Repos. Die Ableger-Empfehlung vom 02.08. beruhte auf
  einer falschen Praemisse — „der Personenbezug steckt in TASK/STATE/docs".
  Nachgeprueft: Vorname und „Gaertringen" stehen in den **Rezept-Hinweisen**
  selbst und sind im UI sichtbar. Ein Ableger haette sie mitgenommen und
  nur die Arbeitsnotizen zurueckgehalten — Schutz-Theater gegen zwei
  Staende echte Pflegelast.
  **Ist-Stand, am 23.08.2026 ueber die GitHub-API gemessen statt
  angenommen:** Repo `Xindaan/rezept-grid` existiert und ist `PUBLIC`,
  `origin` ist gesetzt, `main` deckt sich mit `origin/main`, und Pages
  laeuft — Quelle `main` / `/ (root)`, Status `built`, HTTPS erzwungen,
  erreichbar unter https://xindaan.github.io/rezept-grid/.
  Damit sind beide offenen Punkte des Tasks erledigt; sie standen nur
  noch da, weil sie niemand nachgezogen hat. Auch der Vermerk „nicht von
  mir, ich pushe nichts" ist ueberholt: der Push wurde am 23.08.
  ausdruecklich beauftragt.
  Commit-Mails sind GitHub-Noreply (`112499291+Xindaan@...`), da laeuft
  keine Adresse mit.

- **T-0053** (2026-08-23) Kennzahlen des Pfannkuchens gehen wieder auf.
  Vorher: 45 Min Arbeit + 1 Std 45 Min ohne Zutun = 2 Std 30 Min, daneben
  „gesamt 2 Std 15 Min". Ursache war, dass „Arbeit" aus dem JSON-Feld
  kommt und „ohne Zutun" aus dem gerechneten Plan — und `s-fuellen`
  („fuellen und zuckern") mit `dauer_s: null` dazwischen stand.
  **Entschieden (Entscheidungsvorlage, Option B): Fuellen und Zuckern
  dauert 15 Minuten** — Angabe aus der Kuechenpraxis fuer 12 Stueck mit dem
  Spritzbeutel. Damit `dauer_s: 900` und `zeit_gesamt_s` auf 9000;
  `zeit_aktiv_s` bleibt bei 2700 und ist jetzt genau die Summe der
  beaufsichtigten Stufen. Kopf zeigt 45 Min / 1 Std 45 Min / 2 Std 30 Min.
  Rueckblickend war die alte 2700 also richtig — falsch war, dass die
  Arbeit nirgends im Plan stand.
  **Neue Pruefung, und sie fand sofort einen zweiten Fall:**
  `tools/testdaten/linsen-eintopf.json` hatte dieselbe Krankheit
  (`s-abschmecken` ohne Dauer, 1200 + 2100 = 3300 gegen 3000). Dort ist
  die Wahl umgekehrt gefallen — `zeit_aktiv_s` auf 900 statt dem
  Abschmecken eine Dauer zu geben: die Datei sagt im eigenen Untertitel
  „Ein Topf, 50 Minuten", und eine Dauer haette auch den aendern muessen.
  Bei einer Testvorlage ist die Variante mit weniger Erfindung die
  richtige. **Falls Du das anders siehst, ist es eine Zeile.**
  Zwei unabhaengige Netze halten die Klasse jetzt: die Datenpruefung
  (`zeit_aktiv_s` + freie Zeit darf `zeit_gesamt_s` nicht ueberschreiten)
  und eine Pruefung auf der ANZEIGE, die die drei Kacheln addiert. In der
  Negativprobe faengt die zweite den Fehler auch dann, wenn man die erste
  ausbaut.
  Nachzug in der Zeitachse: der Pfannkuchen hat dadurch erstmals ein
  Planende hinter der letzten Startmarke (135 gegen 150) — die in T-0052
  vorhergesagte Kopplung. Sie faellt nicht auf, weil T-0052 vorher
  erledigt war. Dabei kam eine Layout-Grenze heraus: bei
  `table-layout: fixed` ist die letzte Spalte so breit wie ihre Stufe
  dauert, hier 15 von 150 Minuten — „135" und „150 Min" stiessen
  aneinander. Geloest mit `flex-wrap` und `margin-left: auto`, das Ende
  rutscht dann auf eine zweite Zeile und bleibt rechtsbuendig. Auf voller
  Breite sind alle fuenf Rezepte einzeilig und kollisionsfrei (im Browser
  gemessen).
  197/197 gruen.

- **T-0052** (2026-08-23) Zeitachse: die letzte Marke ist wieder eine
  Startzeit, und das Planende steht daneben. Vorher trug nur sie eine
  Einheit und las sich damit als Gesamtdauer — beim Eierkuchen stand
  „35 Min", waehrend das Rezept 60 Minuten braucht (Maultaschen 60 gegen
  75, Spaetzle 46 gegen 48, Omelett 16 gegen 17).
  Gewaehlt wurde Option D aus der Entscheidungsvorlage: die letzte Zelle
  traegt links weiter ihren Start, rechts an der Spaltenkante das Ende
  des Plans. Im Browser nachgemessen: die rechte Kante der Kopfzelle
  deckt sich mit der rechten Kante der letzten Spalte (784 px), das Ende
  passt in allen fuenf Rezepten zur Kennzahl „gesamt".
  **Beim Umsetzen eine dokumentierte Messung widerlegt.** Der Zusatz fuer
  Screenreader stand zuerst als versteckter Textknoten (`.nur-vorlesen`),
  gestuetzt auf den Satz aus T-0042, so etwas lande nicht in der
  Zwischenablage. Nachgemessen stimmt das hier nicht — kopiert wurde
  "35\nPlanende60 Min", also genau die Klebestelle, gegen die T-0037 bis
  T-0042 angetreten sind. Jetzt steht der Zusatz als `aria-label` an
  jeder Marke („ab 35 Minuten, Planende 60 Minuten"); Attribute werden
  nie kopiert. Nachtrag am T-0042-Eintrag und Warnung am CSS-Selektor
  hinterlegt.
  Nebenbei: alle Marken bekommen das Label, nicht nur die letzte — sonst
  spricht eine Spaltenueberschrift anders als ihre Nachbarn, und die
  blanken Zahlen haetten vorgelesen gar keine Einheit. Numerus stimmt
  („ab 1 Minute").
  Isomorphie-Check: die uebrigen Sonderfaelle fuer erstes/letztes Element
  (`render.js:44`, `.grid tbody tr:first-child`, `:last-child` im CSS,
  `dauerFormatieren` bei vollen Stunden) sind geometrisch oder
  sprachlich — keiner aendert die BEDEUTUNG eines Elements. Kein zweiter
  Fall.
  196/196 gruen.

- **T-0043 bis T-0051** (2026-08-23) **Externer Code-Review
  aufgearbeitet.** Quelle: `~/src/ox-review/reviews/rezept-grid.md` (Ox
  Alpha via OpenRouter, 22.08.2026, hat den Code nur gelesen, nichts
  ausgefuehrt). Zehn Befunde, jede Fundstelle selbst nachgelesen und
  nachgerechnet: **zehn bestaetigt, keiner widerlegt.** Neun umgesetzt,
  T-0052 (Beschriftung der letzten Achsenmarke) bewusst offen — das ist
  Gestaltung, keine Korrektur.
  Pruefungen 137 -> **188 gruen**. Der Zuwachs ist der eigentliche
  Ertrag: er deckt eine Schicht ab, die vorher gar nicht geprueft war.

  - **T-0043** Quellenzeile zeigte zwei Gedankenstriche.
    `.quelle-hinweis::before` stand seit T-0001 im Stylesheet und blieb
    beim Umbau auf den Textknoten (Commit 6c50cb4) stehen. Ausgerechnet
    der T-0042-Eintrag darueber erklaert diese Fehlerserie fuer
    abgeschlossen — hier malten seitdem beide.
    Neu: eine Inventur ueber alle `content:`-Regeln im Stylesheet. Erlaubt
    ist genau `.zurueck-link::before` (dekorativer Pfeil); wer eine neue
    anlegt, faellt auf und muss sich entscheiden.

  - **T-0044** Einkaufsliste warf beim Portionswechsel alle Haken weg.
    Der Callback rief `einkaufRendern` neu auf, und das beginnt mit
    `ziel.textContent = ""`. Jetzt gleicht `postenSchreiben` ab statt neu
    zu bauen; Identitaet ist der Schluessel aus `einkauf.js`, der dafuer
    am Posten mitgeliefert wird.
    **Dafuer war eine DOM-Attrappe noetig** (`tools/dom-attrappe.js`) —
    die DOM-Schicht war bis dahin ungeprueft, und genau dort sass ein
    Fehler, den keine Zahlenpruefung findet, weil die Zahlen stimmten.
    Bewusst kein jsdom: das Projekt hat keine Abhaengigkeiten.
    Lehre aus der Negativprobe: mein erster Test war zu schwach. Nimmt man
    den Schluessel weg, verliert die Liste keine Haken — sie **verdoppelt
    sich** (20 -> 39 Eintraege), und die Haken-Pruefung blieb gruen. Erst
    die zusaetzliche Zeile auf die Postenzahl biss.

  - **T-0045** Kochmodus-Countdown zaehlte Ticks. Gemessen am echten Modul
    mit gedrosseltem Interval: nach 400 s Wanduhr auf einer 360-s-Stufe
    standen noch **5:54** auf der Uhr, und sie lief weiter. Jetzt haengt
    die Rechnung an `Date.now()`; das Interval treibt nur noch die
    Anzeige und darf ausfallen.
    Die Rechnung sitzt als `countdownBauen` DOM-frei und mit
    injizierbarer Uhr vor dem headless-Ausstieg von `kochmodus.js` — acht
    Pruefungen fahren sie ohne echte Wartezeit durch.

  - **T-0046** `zeit_gesamt_s` wurde bei linearen Rezepten nie nach oben
    geprueft: der Check hing an `allein < summe`, was dort nie wahr ist.
    Durchgerutscht waren Pfannkuchen (10800 gegen Plan 8100) und der
    Linsen-Eintopf (3900 gegen 3000, waehrend der eigene Untertitel „50
    Minuten" sagt). Beide korrigiert. Obergrenze jetzt ohne Sonderfall,
    asymmetrisch: unter dem Plan hart verboten, darueber 10 % Luft — die
    braucht der Eierkuchen fuer seine Rundung 3570 -> 3600.
    Isomorphie-Fund: **`zeit_aktiv_s` stand ueberhaupt nicht im
    Pruefskript**, obwohl `docs/schema.md` und `docs/konvertierung.md`
    eine Untergrenze dafuer nennen. Nachgeholt, plus Obergrenze gegen
    `zeit_gesamt_s`. Zweiter Fund: die Vorlage unter `tools/testdaten/`
    haengt jetzt mit in der Schema-Pruefung — sie ist der Anker der halben
    Suite und war selbst nie geprueft.

  - **T-0047** `rezeptLaden` fiel bei jedem Fetch-Fehler stumm aufs
    Manifest zurueck. Jetzt nur noch bei `file:`; ueber http zeigt die App
    den Fehler. Im Browser gegengeprueft: ein ueberzaehliges Komma in
    `spaetzle.json` bringt die rote Box mit Position und Zeile, statt
    kommentarlos die alte Manifest-Fassung.

  - **T-0048** Tote Regel `.untertitel + .gefaess` geloescht. Ueber alle
    Rezepte gemessen: fuenf `.gefaess`-Elemente, null Treffer. Die
    Nachfolgeregel `.rezept-anhang .gefaess` haette ohnehin gewonnen.

  - **T-0049** Vorstufen-Normalisierung von vier Dateien auf eine
    gezogen: `vorstufenIds` (ID-Form, ungefiltert — grid.js meldet
    unbekannte IDs und braucht sie deshalb), `vorstufenIndizes`
    (gefiltert, zum Rechnen) und `vorOder` (Argument-Default), alle in
    `zeitmass.js`.
    **Dabei einen eigenen Fehler produziert und gefunden:** in `grid.js`
    stand `Z.vorstufenIds(...)`, aber grid.js hat gar kein `Z`. Das lief
    gruen durch, weil `eval` den Scope des Pruefskripts teilt — im Browser
    waere es abgestuerzt. Genau der Fall, den T-0050 beschreibt.
    Zweiter Nebenbefund: eine Negativprobe an `render.js` warf keinen
    einzigen Test um — der **Kennzahlenstreifen war ungeprueft**.
    Nachgeholt (das ist die Klasse „Formel korrigiert, Bild vergessen").

  - **T-0050** `eval` durch `require` ersetzt. Beide Vorteile einzeln
    belegt: der `Z`-Fehler aus T-0049 meldet jetzt
    `ReferenceError ... at js/grid.js:65`, unter `eval` lief er durch;
    ein Syntaxfehler nennt `js/portionen.js:117` statt der eval-Stelle.

  - **T-0051** Kochleiste ist eine Live-Region. `.koch-text` bekommt
    `aria-live="polite"` + `aria-atomic`, die Uhr `role="timer"` —
    **bewusst ohne** `aria-live`, sonst spricht der Screenreader jede
    Sekunde. Das Ablaufen sagt eine eigene Statuszeile einmal an
    (`.koch-alarm`, versteckt ueber die neue Klasse `.nur-vorlesen`).
    Isomorphie-Fund: in der Uebersicht taucht die Auswahlleiste „N
    Rezepte gewaehlt" ebenso lautlos auf — der Zaehler ist jetzt
    ebenfalls Live-Region.

- **T-0042** (2026-08-15) Klebestellen beim Kopieren behoben, in der
  Stufenliste und in der Tabelle.
  **Meine Analyse im Task war in zwei Punkten falsch, beides im Browser
  gemessen statt erschlossen:**
  (a) Die Grenze Menge/Zutat war nie das Problem — beide sind
  Rasterzellen, und der Browser setzt beim Kopieren von selbst einen
  Zeilenumbruch dazwischen. Geklebt hat es **innerhalb** der Zutat.
  (b) Meine Sorge, ein Textknoten wuerde das Raster zerlegen, gilt nur
  fuer sichtbaren Text: ein Zeichen erzeugt eine dritte Rasterzelle
  (Zeilenhoehe springt von 44 auf 84 px), ein reines Leerzeichen nicht.
  Das Leerzeichen wird dafuer auch nicht mitkopiert — als Trenner
  zwischen den Zellen also nutzlos.
  Ebenfalls verworfen, weil gemessen: eine absolut positionierte,
  per `clip-path` versteckte Spanne aendert das Layout nicht, landet aber
  genauso wenig in der Zwischenablage.
  **Nachtrag 23.08.2026 (T-0052): dieser letzte Satz gilt so nicht.** In
  der Zeitachse habe ich genau diese Konstruktion gebaut und gemessen —
  `Selection.toString()` auf der Zelle lieferte "35\nPlanende60 Min", der
  versteckte Text wurde also mitgenommen. Welcher Unterschied die beiden
  Messungen trennt (Raster- statt Flex-Zelle, anderer Browser, echte
  Zwischenablage gegen Selection-API), ist offen. Praktische Regel steht
  jetzt am Selektor `.nur-vorlesen` in `css/stil.css`: **nicht** in
  Inhalten verwenden, die jemand markiert — dort gehoert der Zusatz in
  ein `aria-label`.
  **Was wirkt:** `.zutat-name`, `.marke-fix` und `.zutat-notiz` sind in
  der Liste alle inline; ein Leerzeichen als Textknoten dazwischen
  repariert die Kopie ("WasserFIXzum Kochen" -> "Wasser FIX zum Kochen")
  und laesst die Zeilenhoehe bei 44 px. In der Tabelle ist die Notiz ein
  Block und braeuchte es nicht — sie bekommt es trotzdem, damit beide
  Erzeuger dieselbe Regel befolgen.
  Gegenprobe alt gegen neu an derselben Breite: Zeilenhoehen und
  Zutatenbreiten identisch, Desktop-Spalten identisch
  (63/167/180/235/207/194). Keine Klebestelle mehr in allen fuenf
  Rezepten, in beiden Ansichten.
  Damit ist die Serie aus T-0037 (Ausstattung), der Quellenzeile und
  hier abgeschlossen — dreimal derselbe Fehler, weil CSS die Trennung
  malte und der Text sie nicht enthielt.
- **T-0033** (2026-08-15) Spaetzle: "Wasser aufsetzen" haengt nicht mehr
  an der Teigruhe. `s-wasser` bekam `vorstufen: []` — Wasser setzt man
  auf, waehrend der Teig ruht.
  **Der zweite Teil war der wichtigere und stand nicht im Task:** mit
  `vorstufen: []` allein waere die Teigruhe gar keine Voraussetzung des
  Schabens mehr gewesen, denn die Kette lief bisher
  teig -> ruhen -> wasser -> schaben und trug die Abhaengigkeit
  transitiv. `s-schaben` verweist deshalb jetzt auf **beides**,
  `["s-ruhen", "s-wasser"]` — ein echter Zusammenlauf.
  Wirkung: vier Spalten statt fuenf, Wasser und Teigruhe stehen
  nebeneinander in Spalte 1 (Zeilen 0-4 gegen 5-6, ueberschneidungsfrei).
  48 statt 56 Minuten, 20 Minuten ohne Zutun. `zeit_gesamt_s` auf 2880
  und `zeit_aktiv_s` auf 1680 nachgezogen — die Summe der beaufsichtigten
  Stufen war mit 1500 ohnehin zu niedrig angesetzt.
  Offen gelassen: `s-wasser` ist als beaufsichtigt gefuehrt, obwohl
  Wasser die meiste Zeit von allein kocht. Mit `unbeaufsichtigt: true`
  wuerde das Rezept nochmals kuerzer — das ist eine Aussage ueber das
  Kochen, keine ueber den Renderer, und deshalb nicht mitentschieden.
- **T-0036** (2026-08-15) **War bereits erledigt, der Backlog-Eintrag
  stand faelschlich noch offen.** Der Vorname wurde am 03.08. per
  filter-branch aus allen 28 Commit-Messages entfernt, vor dem ersten
  Push. Nachgeprueft an `origin/main`: null Fundstellen in der Historie.
  Ich hatte trotzdem noch gemeldet, er stehe "in 14 Commit-Messages" —
  falsch, und die Steuerdatei hat den Irrtum gestuetzt statt ihn zu
  korrigieren.
  Zwei Reste gab es doch: ausgerechnet im T-0035-Eintrag, der die
  Entfernung dokumentiert und die ersetzten Formulierungen als Beispiel
  zitierte. Damit war der Name wieder drin. Jetzt ohne Beispiele.
  Faktenlage zum oeffentlichen Auftritt: das GitHub-Profil `Xindaan`
  fuehrt **keinen** Klarnamen (`name: null`, keine Bio, keine Firma,
  keine Mail), und die Commit-Metadaten nennen `Xindaan` mit
  Noreply-Adresse.
- **T-0041** (2026-08-15, **umnummeriert von T-0040**) Rezept "Omelett
  mit Pilzen" aufgenommen
  (`rezepte/omelett-mit-pilzen.json`), Mengen und Zeiten von
  einfachkochen.de, Schritte eigenstaendig formuliert. **Erstes Rezept
  mit gesetzter `quelle`** — der Quellenblock des Renderers ist damit
  zum ersten Mal live zu sehen (Titel, Autor, Link, Hinweis).
  Zwei Straenge (Pilze braten / Eier verquirlen), zusammengefuehrt beim
  Eingiessen; "stocken lassen" unbeaufsichtigt, Schnittlauch faellt
  hinein. 17 Min gesamt, 14 Min Arbeit, 1 Stueck als Basis.
  Lehre, als Fallstrick 10 in `docs/konvertierung.md` eingetragen: Das
  Pruefskript verlangt, dass die JSON-Reihenfolge der Schritte dem
  berechneten Plan folgt. Bei zwei beaufsichtigten Straengen kommt der
  mit dem laengeren Restpfad zuerst — und der zweite Strang darf im JSON
  nicht ZWISCHEN die Stufen des ersten, sonst zerreisst dessen
  Zeilenblock. Der kuerzere Strang steht also komplett dahinter, auch
  wenn die Quelle ihn zuerst nennt (hier: Eier verquirlen erst nach den
  Pilzen). Pruefung 127/127 gruen.
  **Kollision:** T-0040 war zeitgleich in einer zweiten Session fuer die
  Stufenliste vergeben. Umnummeriert wurde dieser Eintrag, weil die
  Stufenliste die ID im Code haelt (`js/stufenliste.js`, zehn
  Pruefungen, CSS-Klassen) und dieser nur in den Steuerdateien. Die
  Commit-Message vom 15.08. nennt weiter T-0040 — im Zweifel entscheidet
  der Inhalt, nicht die Nummer.
- **T-0039.2/.3 + T-0040** (2026-08-15) Design-Uebergabe "Rezept-Grid
  Mobile Usability" eingespielt, auf Branch `design-mobil`.
  **Zwei meiner Messungen waren falsch, beide hat die Uebergabe gefunden:**
  (a) "Grid beginnt nach 1250 px" — nachgemessen 673 px. Ich hatte die
  Zahl von einem Bildschirmfoto mit doppelter Punktdichte abgelesen und
  Fotopixel als CSS-Pixel gemeldet. (b) T-0039.1 beseitigte das Kappen,
  nicht den Ueberlauf: die Untergrenze war ein Aussenmass, von 56 px
  gingen 24 px an Polster. Meine Pruefung war blind dafuer, weil `.menge`
  `nowrap` bei `overflow: visible` ist — dabei bleibt `scrollWidth`
  gleich `clientWidth`. Richtig misst man die Textbreite per Range.
  Jetzt 64/120 px mit reduziertem Polster: 46,4 px Innenbreite gegen
  42,7 px Bedarf ("150 ml"), kein Ueberlauf in allen vier Rezepten.
  Kennzahlenstreifen einzeilig (Raster statt umbrechendem Flex),
  Ueberschrift auf schmalen Schirmen 26,4 statt 46,4 px, Ausstattung und
  Merkmale unter das Grid. Grid beginnt bei 433 statt 673 px.
  **T-0040 Stufenliste:** unter 600 px ersetzt eine Liste die Tabelle.
  Zeit laeuft nach unten, die Klammer wird Einrueckung, Zutaten stehen in
  ihrer Stufe. Drei Groessen neu gerechnet und DOM-frei in
  `js/stufenliste.js`: Einrueckungstiefe, Ruhefenster (Maultaschen:
  "laeuft waehrend »Teig ruhen lassen«") und Gabeln (Zusammenlauf mit
  Tiefen und Zutatenzahl der Straenge).
  Beide Ansichten stehen gleichzeitig im DOM, stil.css waehlt — kein
  resize-Handler, kein matchMedia. Abhaken, Portionswechsel und
  Kochmodus greifen ueber `data-zeile`/`data-schritt` auf beiden.
  Nachgemessen: Portionswechsel trifft beide, Abhaken markiert TD und
  SPAN, Kochmodus laeuft ueber drei Schritte synchron durch Tabelle und
  Liste. Desktop bei 1280 px Pixel fuer Pixel unveraendert
  (63/167/180/235/207/194), Liste dort versteckt.
  **Der Preis, bewusst bezahlt:** das Zeitmass hat in der Liste keine
  Entsprechung. Breite = Dauer wird zur Zahl, Gleichzeitigkeit zum Satz.
  Es ist die einzige Aussage der Chu-Notation, die auf dem Telefon
  verloren geht.
  Anwendung von Hand: die Diffs hatten unterwegs die fuehrenden
  Leerzeichen leerer Kontextzeilen verloren, `git apply` und `patch`
  scheitern beide daran.
  136/136 gruen, davon 10 neue aus dem Paket plus 2 eigene.
- **T-0038/T-0039.1** (2026-08-08) Touch-Bedienung und die gekappten
  Zutatenspalten. Gemeldet: "Die UI sieht auf iOS nicht so gut aus, und
  Mouseover wird nicht in Fingertippen uebersetzt, da kommen keine
  Highlights."
  **Der Highlight-Befund hatte eine andere Ursache als vermutet.** Nicht
  iOS uebersetzt nicht — das Stylesheet hatte **null** `:active`-Regeln
  und kein `-webkit-tap-highlight-color`. Beim Tippen passierte nichts,
  weil nichts definiert war. Dazu 12 `:hover`-Regeln ohne
  `@media (hover: hover)`; deren Zustand bleibt auf Touch nach dem
  Tippen kleben. Beides behoben, Hover-Regeln stehen jetzt hinter der
  Faehigkeitsabfrage.
  **Der Tooltip war der einzige Weg zur Anweisung.** `td.title` hat auf
  einem Telefon keine Geste. Die Stufenzelle ist jetzt antippbar
  (`role="button"`, `tabindex`, Enter/Leertaste) und rollt zum Wortlaut
  weiter unten, der kurz hervorgehoben wird. Bewusst kein neues Fenster
  und keine Sprechblase: der Text stand schon auf der Seite, es fehlte
  nur der Weg dorthin.
  Tap-Ziele auf 44x44 pt, aber **nur unter `@media (pointer: coarse)`** —
  die Desktop-Dichte aus der Design-Uebergabe bleibt unangetastet.
  **Der Rechenfehler:** `ZUTATEN = [0.06, 0.16]` sind Anteile der
  Tabellenbreite, und die richtet sich nach der Stufenzahl, nicht nach
  dem Geraet. Auf 375 px waren das 30 px fuer eine Menge, die 48 braucht
  — "400 g" wurde zu "40(". Dieselbe Klasse wie MIN_PX bei den
  Stufenspalten: eine Groesse als Anteil definiert, die eine absolute
  Untergrenze braucht.
  **Zwei Sackgassen auf dem Weg, beide im Browser gemessen statt
  erschlossen.** (a) `width: max(6%, 56px)` am `<col>` wird verworfen —
  die Spalten landen bei 80/80 statt 56/104; reine Prozent- und reine
  Pixelwerte gelten, `min()`/`max()` nicht. (b) Die Untergrenze in
  JavaScript zu rechnen funktionierte, verschob aber das Desktop-Bild um
  1,3 Prozentpunkte und spaeter die Stufenbreiten um bis zu 8 px. Beides
  waere in der laufenden Design-Runde als fremde Aenderung aufgeschlagen.
  **Geloest ueber eine Medienabfrage unter 940 px**, die die beiden
  Zutatenspalten auf feste Pixel pinnt. Der Browser holt sich den Platz
  dann nur bei den Prozentspalten. `noetigeBreite` bekam eine zweite
  Forderung, die so formuliert ist, dass sie ab vier Stufen nie greift —
  Gegenprobe gegen die Live-Seite: Desktop Pixel fuer Pixel identisch
  (63/167/180/235/207/194).
  Gemessen auf 375x812: keine gekappte Zelle in allen vier Rezepten, kein
  Tap-Ziel unter 44 pt, sticky-Spalten ueberlappen beim Querscrollen
  nicht, schmalste Stufenspalte 81 px. 126/126 gruen.
- **T-0035** (2026-08-03) Vorname aus den Steuerdateien entfernt, vor der
  Veroeffentlichung. 26 Fundstellen in fuenf Dateien: `TASK.md` (20),
  `CLAUDE.md` (2), `STATE.md` (2), `docs/uebergabe-zeitmass.md` (1) und
  ein Kommentar in `js/zeitmass.js`.
  Umformuliert statt geschwaerzt — die Saetze tragen weiter dieselbe
  Aussage, nur ohne Traeger: der Name des Melders faellt weg, die
  Meldung bleibt. Wer etwas gemeldet oder
  entschieden hat, war fuer keinen Eintrag die Information; wichtig war
  immer, DASS es gemeldet wurde.
  Der Grep ueber alle versionierten Dateien ist leer. Ein Fallstrick
  dabei: "andruecken" enthaelt die Zeichenfolge und taucht in zwei
  Rezeptanweisungen auf — Treffer pruefen, nicht blind ersetzen.
  **Nicht erledigt und bewusst nicht angefasst:** die Historie. 14 der 27
  Commit-Messages nennen den Vornamen, 20 Fundstellen. Solange nichts
  gepusht ist, waere ein `git filter-branch`/`filter-repo` folgenlos
  moeglich; danach nicht mehr. Das ist eine Entscheidung ueber die
  Projekthistorie und keine Aufraeumarbeit — offen als T-0036.
- **T-0034** (2026-08-03) Rezepttexte entpersonalisiert. Rueckmeldung beim
  Durchsehen vor der Veroeffentlichung: "Es geht um professionelle
  Rezepte, nicht haha-lahme-Witze."
  Vier Freitexte in drei Rezepten, zwei verschiedene Abrutscher:
  **Personenbezug** — "Fuer <Vorname> zur Klarstellung" (pfannkuchen),
  "in Gaertringen gilt das nicht als Resteverwertung" (maultaschen),
  "in Gaertringen faellt es auf" (spaetzle). **App-Jargon statt Kochen** —
  der Maultaschen-Hinweis erklaerte, dass dies "der erste Fall in der
  Sammlung mit zwei parallelen Straengen" sei und wie das Grid das
  darstellt, und der Untertitel sprach von "zwei Straengen".
  In allen vier Faellen steckte ein brauchbarer Kern drin, der erhalten
  ist: geroestete Maultaschen sind ein eigenes Gericht; Pfannkuchen
  heisst regional verschieden (Berlin/Brandenburg vs. Berliner/Krapfen);
  gepresst ergibt runden Querschnitt und braucht festeren Teig.
  **Ursache und eigentlicher Fix:** `docs/konvertierung.md` sagte zum Ton
  der Freitexte gar nichts — `docs/schema.md` beschrieb `hinweise` nur
  als "Tipps, Varianten, Aufbewahrung". Ohne Regel driftet jede naechste
  Konvertierung genauso. Neu als Fallstrick 9 und als Punkt 9 in der
  Prompt-Vorlage, mit Prueffrage: "Stuende der Satz so in einem
  Kochbuch, das jemand kauft?"
  Gegengeprueft: Anweisungen und Zutatennotizen waren sauber, der
  Personen- und Jargon-Grep ueber `rezepte/` ist jetzt leer.
  Damals offen gelassen (Vorname in den Steuerdateien) — inzwischen
  erledigt, siehe T-0035.
- **T-0032** (2026-08-03) Der Zeitplan kennt jetzt zwei Haende, nicht nur
  Abhaengigkeiten. Befund am Bild: "15 min nebenher moeglich zu
  einem 10-min-Knetjob" — im Grid stand "Fuellung mischen, 15 Min" neben
  "Nudelteig kneten, 10 Min", beides ab Minute 0, beides mit den Haenden.
  Ursache: `startzeiten()` kannte nur `vorstufen`. Eine Stufe mit
  `vorstufen: []` startete bei null, egal ob dort schon jemand am Teig
  steht. Die Spaltenzuordnung aus T-0030 haengte an der
  Abhaengigkeitstiefe und erbte den Fehler eins zu eins.
  **Das ist derselbe Fehler wie T-0028, eine Ebene tiefer.** Dort habe
  ich die Kennzahl auf eine Person umgestellt und den Zeitplan stehen
  lassen, aus dem das Bild gebaut wird. Die Zahl stimmte danach, das Bild
  nicht — und angesehen wird das Bild.
  Neu: `plan()` in `js/zeitmass.js`. Zwei Regeln — eine Stufe beginnt
  fruehestens nach ihren Vorstufen, und beaufsichtigte Stufen ueberlappen
  sich nie. Unbeaufsichtigte belegen die Haende nicht und starten sofort.
  Die Reihenfolge unter den beaufsichtigten ist eine Heuristik (laengster
  Restpfad zuerst), kein Optimum; ohne sie kaeme die 45-Minuten-Fuellung
  vor den Teig und das Ruhen verschoebe sich um 45 Minuten.
  `grid.js` baut die Spalten jetzt aus diesem Plan: eine Spalte ist ein
  Zeitpunkt, nicht eine Abhaengigkeitsstufe. Maultaschen 0/10/10/40/60 —
  die Fuellung steht linksbuendig unter der Teigruhe (im Browser
  gemessen: beide beginnen bei x=527, das Kneten endet dort).
  `realeGesamtdauer` ist jetzt das Ende des Plans statt
  `max(Pfad, Arbeit)`; der Unterschied ist erzwungener Leerlauf, siehe
  Nachtrag bei T-0028. Die drei linearen Rezepte aendern sich nicht.
  Isomorphie-Check: dieselbe Annahme "beliebig viel laeuft gleichzeitig"
  steckte sonst nur noch im Kochmodus, der die Stufen in JSON-Reihenfolge
  durchgeht ohne den Plan zu kennen. Heute deckungsgleich bei allen vier
  Rezepten; eine Pruefung je Rezeptdatei haelt das fest (Startzeiten
  duerfen in JSON-Reihenfolge nicht zurueckspringen). Dazu je Rezept die
  Pruefung, dass nie zwei beaufsichtigte Stufen zugleich laufen.
  121/121 gruen.
- **T-0028** (2026-08-02) "ohne Zutun" rechnet jetzt richtig — und der Fall
  war nicht latent, sondern seit T-0030 aktiv falsch. Der Einwand:
  "Fuellung mischen geht nur, wenn der Teig ruht" — also ist die Ruhezeit
  nur so weit frei, wie sie laenger ist als die Parallelarbeit.
  Die Kennzahl summierte die unbeaufsichtigten Dauern und zeigte fuer
  Maultaschen 30 Minuten. Waehrend der 30 Minuten Ruhe mischt man aber
  15 Minuten lang die Fuellung; frei sind **15**.
  Formel ist einfacher als der Fehler: **frei = Gesamtdauer minus
  Arbeit**, wobei Arbeit die Summe der beaufsichtigten Stufen ist. Fuer
  lineare Rezepte kommt dabei wieder die Summe der unbeaufsichtigten
  heraus — Pfannkuchen bleibt bei 1 Std 45 Min.
  Der zweite Punkt ist der Umkehrfall: ist die Parallelarbeit
  **laenger** als die Ruhephase, kommt Wartezeit dazu. Eine Person kann
  nicht zwei beaufsichtigte Stufen gleichzeitig betreuen. Gegengeprueft
  mit einer 45-Minuten-Fuellung: kritischer Pfad 80 Min, Arbeit 90 Min,
  real 90 Min, frei 0 — die Kachel verschwindet und stattdessen erscheint
  ein Hinweis auf die zweite Person.
  Neu in `js/zeitmass.js`: `arbeitszeit`, `realeGesamtdauer`, `freieZeit`,
  `braucht2Haende`. Sieben Pruefungen.
  **Nachtrag T-0032:** die hier benutzte Formel `max(kritischer Pfad,
  Arbeit)` ist als Untergrenze richtig, aber nicht als Gesamtdauer — sie
  uebersieht erzwungenen Leerlauf (zwei Ruhephasen mit je einer Arbeit
  dahinter: Pfad 100, Arbeit 100, tatsaechlich 150). Ersetzt durch das
  Ende des Einpersonen-Plans. Die drei hier genannten Zahlen bleiben
  richtig, die Begruendung nicht.
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
  Kicktipp-Repo (`Xindaan/poisson-dor`) statt auf das private. Der
  Hinweis kam von aussen — die Sorge war gegenstandslos, das Repo ist
  ohnehin offen.
  Damit ist der letzte offene Punkt aus T-0009 erledigt, der nicht sein
  Go braucht.
- **T-0030** (2026-08-02) Parallele Straenge stehen jetzt auch **im Bild**
  nebeneinander, nicht nur in der Zeitrechnung. Gemeldet:
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
- **T-0012** (2026-08-02) **Bestaetigt: der `file://`-Weg
  funktioniert.** Doppelklick auf `index.html` zeigt die Uebersicht mit
  allen vier Rezepten, gestaltet, und ein Klick auf eine Karte oeffnet das
  Rezept. Der Manifest-Fallback traegt also — der einzige Pfad, den ich
  aus der Session nie ausfuehren konnte.
- **T-0029** (2026-08-02) Zurueck-Link oeffnete per `file://` den Finder
  statt der Uebersicht. Beim Doppelklick-Test gefunden.
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
  stumpf zu addieren. An den Maultaschen aufgefallen: die Fuellung
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
- **T-0010** (2026-08-02) **Gestrichen.** Es werden keine Rezepte
  gedruckt — in
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
- **T-0021** (2026-08-02) Fuehrungslinie je Block. Sie wurde im Entwurf
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
  "wie das Original" — es wurde ausdruecklich freie Hand gegeben. Richtung:
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
- **T-0016** (2026-08-01) Grid-Design ueberarbeitet, nachdem die
  fehlenden horizontalen Linien bemaengelt wurden. Drei Ursachen, alle in
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
  Quelle: der Chefkoch-Link war fuer den Abruf gesperrt, daher das
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
  `unbeaufsichtigt` zur Trennung von Warte- und Arbeitszeit (Entscheidung
  fuer T-0004). Folge fuer Konvertierungen: eine Zutat belegt
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
