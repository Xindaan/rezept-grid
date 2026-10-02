# STATE.md — rezept-grid

Stand: 2026-10-02

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
- **Der Kopf rechnet nicht mehr neben dem Grid her** (T-0059): "Arbeit",
  "ohne Zutun" und "gesamt" kommen aus demselben Einpersonen-Plan wie die
  Zeitachse. Die drei Kacheln gehen dadurch zwangslaeufig auf statt
  zufaellig; `zeit_aktiv_s` und `zeit_gesamt_s` sind seither die ANGABE
  des Autors, die das Pruefskript dagegenhaelt.
- **Die Seite merkt sich etwas** (T-0064): Portionszahl, Haken und die
  Auswahl der Uebersicht ueberleben ein Neuladen, aber nur 24 Stunden
  (`js/merker.js`). Dazu Alarm und Bildschirmsperre im Kochmodus
  (T-0063) und ein Druck-Stylesheet (T-0065).
- **Tabelle und Liste sind zwei gleichwertige Wege, nicht ein Notbehelf**
  (T-0066): auf dem Tablet setzt der Tipp auf eine Stufe die Kopplung zu
  ihren Zutaten fest — dieselbe Geste, die zum Wortlaut springt, ohne
  eine zweite zu erfinden. Auf dem Telefon hat jede Zutatenzeile ihre
  vollen 44 pt. Silbentrennung `hyphens: auto` fuer beide.
- **Jede Gesamtzeit auf dem Bildschirm kommt aus einer Rechnung**
  (T-0070): Kennzahlen im Kopf, Ende der Zeitachse und Zeitangabe auf der
  Uebersichtskarte lesen alle `planende(modell)`. Vorher waren es drei
  Kopien, zwei davon mit einer anderen Quelle.
- Pruefung: `node tools/pruefe-grid.js` — **294/294 gruen**. Laeuft ueber
  alle Rezepte (samt der Vorlage in `tools/testdaten/`) und prueft Schema,
  Layout, Zeitplan, Manifest — und seit T-0044 auch die DOM-Schicht:
  Einkaufsliste, Kennzahlenstreifen, Kochleiste und Ladeweg laufen gegen
  `tools/dom-attrappe.js` (kein jsdom, keine Abhaengigkeiten).
  **Seit T-0055 wirft die Attrappe bei unbekannten Eigenschaften**, statt
  still `undefined` zu liefern — genau daran war `breitenAnwenden` in
  jeder Pruefung stumm ausgestiegen.
- Nach jeder Rezeptaenderung noetig: `node tools/build-manifest.js`.
- Vorschau: `python3 -m http.server 8412`, Konfiguration in
  `.claude/launch.json`.

- **Review Oktober 2026** (T-0088): 150 Befunde, Bericht in
  `docs/review-2026-10.md`, Aufgaben T-0071 bis T-0087. Rechenkerne
  tragen; die Schwaechen liegen an der Oberflaeche, die die Pruefsuite
  kaum sieht (Mutationstest: 47 % gefangen, Kochleiste und Stufenliste
  fast ungeprueft).

## Next actions

- T-0071 + T-0072: Kochmodus folgt der Stufe, laufende Uhr ueberlebt den
  Stufenwechsel (beide hoch). Fuer T-0072 entschieden: eine Uhr je
  Ruhestufe.
- T-0073: Pruefsuite laesst gueltige Rezepte durch — klein, blockiert
  sonst das naechste Rezept ohne Wartezeit oder ohne `gefaess`.
- T-0079 (entschieden: Zeilenreihenfolge berechnen) vor T-0078 umsetzen,
  dann T-0078 neu zuschneiden.

## Letzte Done

- T-0088 Review Oktober 2026: 150 Befunde, T-0071 bis T-0087 angelegt;
  Vorname wieder aus TASK.md entfernt (Rueckfall hinter T-0035)
  (2026-10-02)

- T-0070 Eine Rechnung fuer jede Gesamtzeit — Karte, Kopf und Achse
  lesen dieselbe Funktion; dabei einen dritten Rechenort gefunden
  (2026-09-02)
- T-0066/T-0068/T-0069 Entscheidungen umgesetzt: Kopplung auf
  Fingergeraeten gebaut, Zeitfelder bleiben, fremder Worktree entfernt.
  Dabei drei weitere Messbefunde behoben (Markenueberlauf, Silbentrennung,
  Tippziel 23 -> 44 px). 283 -> 291 (2026-09-02)
- T-0054 bis T-0067 Zweiter Code-Review vollstaendig umgesetzt: Planer,
  Kennzahlen, Einkaufsliste, Rundung, Barrierefreiheit, Ladeweg, Alarm,
  Gedaechtnis, Druck. Pruefungen 197 -> 283 (2026-09-02)
- T-0009 Verteilung: Repo oeffentlich, Pages laeuft (2026-08-23,
  nachgeprueft — der Task stand faelschlich noch offen)
- T-0053 Kennzahlen des Pfannkuchens gehen auf; Fuellen dauert 15 Min,
  zweiter Fall in der Testvorlage gleich mitgefunden (2026-08-23)
- T-0052 Zeitachse zeigt Startzeit und Planende; dabei eine Messung aus
  T-0042 widerlegt (versteckter Text WIRD kopiert) (2026-08-23)
- T-0043 bis T-0051 Externer Code-Review aufgearbeitet: zehn Befunde
  geprueft, zehn bestaetigt, neun umgesetzt (2026-08-23)
- T-0042 Klebestellen beim Kopieren behoben (2026-08-15)
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
