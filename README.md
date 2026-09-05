# rezept-grid

Rezepte in der Tabellen-Notation von "Cooking for Engineers": Zutaten als
Zeilen links, Arbeitsschritte als verbundene Zellen rechts. Das Grid
zeigt auf einen Blick, was wann mit was kombiniert wird — und wie lange
es dauert.

Statische Dateien, kein Framework, kein Build, keine Laufzeit-API.

## Quickstart

`index.html` im Browser öffnen. Das ist die App.

Zum Entwickeln besser über einen lokalen Server, weil Browser `fetch` auf
lokale Dateien blockieren (siehe [Architektur](#architektur)):

```bash
python3 -m http.server 8412
```

Dann http://localhost:8412 aufrufen.

## Nutzung

- **Übersicht**: `index.html` listet alle Rezepte.
- **Einzelrezept**: `index.html?rezept=<id>`, z. B. `?rezept=eierkuchen`.
- **Portionen**: Knöpfe im Kopf rechnen alle Mengen um. Gewichte dezimal,
  gezählte Zutaten als Küchenbrüche (`1½ TL`). Einzelne Zutaten sind von
  der Skalierung ausgenommen (Lorbeer, eine Prise Salz) und werden
  gedämpft dargestellt.
- **Einkaufsliste**: In der Übersicht Rezepte ankreuzen, dann
  „Einkaufsliste öffnen". Zutaten werden über die gewählten Rezepte
  addiert (gleicher Name **und** gleiche Einheit), je Rezept lässt sich
  die Portionszahl einstellen, Posten lassen sich abhaken. Die Auswahl
  steht in der URL — die Liste ist damit teilbar und übersteht ein
  Neuladen.
- **Kochmodus**: blendet alles aus, was gerade nicht dran ist, und zeigt
  je Stufe die **neu** dazukommenden Zutaten, die Anweisung und einen
  Countdown. Navigation per Knopf, Pfeiltasten oder Escape zum Beenden.

## Ein Rezept hinzufügen

1. JSON-Datei nach [`docs/schema.md`](docs/schema.md) unter `rezepte/`
   anlegen. Dateiname = `id` + `.json`, ASCII, kebab-case.
2. Manifest neu erzeugen — **sonst taucht das Rezept nicht auf**:

```bash
node tools/build-manifest.js
```

3. Prüfen:

```bash
node tools/pruefe-grid.js
```

Konvertierungen aus fremden Quellen: Mengen und Zutaten übernehmen,
Anleitungstexte eigenständig neu formulieren, Quelle im Feld `quelle`
nennen. Details in `CLAUDE.md`.

## Veröffentlichen (GitHub Pages)

Die App ist rein statisch, es gibt keinen Build. Was im Repo liegt, ist
was ausgeliefert wird.

**Einmalig einrichten:** Settings → Pages → Source „Deploy from a
branch", Branch `main`, Ordner **`/ (root)`** — *nicht* `/docs`, dort
liegen die Entwicklerdokumente, nicht die App. Die Seite steht dann unter
`https://<benutzer>.github.io/rezept-grid/`.

Die leere Datei `.nojekyll` im Wurzelverzeichnis schaltet die
Jekyll-Verarbeitung ab. Nötig ist sie hier nicht — kein Pfad beginnt mit
einem Unterstrich —, aber sie kostet nichts und nimmt eine Fehlerquelle
raus, falls später ein solcher Ordner dazukommt.

**Ein neues Rezept geht so live:**

```bash
node tools/build-manifest.js && node tools/pruefe-grid.js && git add rezepte/ && git commit -m "Rezept: <name>" && git push
```

Danach dauert es rund eine Minute, bis Pages neu ausgeliefert hat. Läuft
die Prüfung rot, bricht die Kette ab und es wird nichts committet.

Alle Pfade in der App sind relativ, die Seite funktioniert deshalb sowohl
im Unterverzeichnis von Pages als auch per Doppelklick auf
`index.html`.

## Troubleshooting

**Die Übersicht ist leer oder ein neues Rezept fehlt.**
`rezepte/manifest.js` ist nicht aktuell. `node tools/build-manifest.js`
ausführen. `node tools/pruefe-grid.js` meldet diesen Fall auch.

**Rote Box "N Rezepte konnten nicht frisch geladen werden".**
Über http holt die Übersicht die JSON-Dateien direkt. Ging das für
einzelne nicht, zeigt sie deren Fassung aus `rezepte/manifest.js` und
sagt es — die kann alte Mengen tragen. `node tools/build-manifest.js`
nachziehen und prüfen, ob die genannte Datei noch existiert.

**Rote Box "Rezept konnte nicht geladen werden" mit einer HTTP- oder
Syntax-Meldung.**
Über einen Server (`http://`) holt die App die JSON-Datei direkt. Schlägt
das fehl — Datei weg, HTTP-Fehler, Komma zu viel im JSON — zeigt sie den
Fehler, statt hinter Deinem Rücken die ältere Fassung aus
`rezepte/manifest.js` einzusetzen (T-0047). Die Meldung nennt die
Ursache; nach dem Beheben `node tools/build-manifest.js` nachziehen.
Per Doppelklick (`file://`) ist das Manifest der reguläre Ladeweg, dort
springt es weiterhin ein.

**Rote Box "Probleme im Rezept" über der Tabelle.**
Das Rezept verletzt eine Schema-Regel — der Text nennt Zutat bzw.
Schritt. Häufigster Fall: eine Zutat ist in mehreren Schritten gelistet.
Eine Zutat belegt genau eine Zeile; mehrfach verwendete Zutaten brauchen
je einen eigenen Eintrag mit eigener `id`.

**"umfasst keinen zusammenhängenden Zeilenblock".**
Zwei Stränge des Rezepts sind ineinander verschachtelt. Parallele Stränge
an sich sind kein Problem — `maultaschen.json` hat zwei (Teig und Füllung)
und rendert sauber als zwei Klammern, die zusammenlaufen. Die Meldung kommt
erst, wenn die Zutaten der Stränge sich im Grid abwechseln. Abhilfe: die
Zutaten eines Strangs zusammenhalten, also den Strang in einem Schritt
einführen statt verteilt. Siehe T-0008 in `TASK.md`.

## Development

```bash
node tools/pruefe-grid.js      # Layout, Skalierung, Kochmodus, alle Rezepte
node tools/build-manifest.js   # rezepte/*.json -> rezepte/manifest.js
```

`pruefe-grid.js` prüft seit T-0044 auch die DOM-Schicht — Einkaufsliste,
Kennzahlenstreifen, Kochleiste, Ladeweg. Dafür gibt es
`tools/dom-attrappe.js`: so viel DOM, wie die Prüfungen anfassen, und kein
jsdom, weil das Projekt ohne Abhängigkeiten auskommt. Versteht ein
Selektor nicht, **wirft** sie — eine leere Trefferliste würde wie „kein
Problem" aussehen. Wer mehr braucht, erweitert sie dort und sieht dabei,
was er voraussetzt.

Steuerdateien: `TASK.md` (Backlog), `STATE.md` (Stand + nächste Schritte).

## Architektur

- `js/zeitmass.js` — der Ablaufplan für **eine** Person und die
  Spaltenbreiten daraus. Zwei beaufsichtigte Stufen laufen nie
  gleichzeitig; dran ist, was am frühesten anfangen kann, und unter
  gleich frühen die Stufe mit dem längsten Restpfad (T-0054).
- `js/grid.js` — berechnet das Layout aus dem Rezept-JSON:
  Zeilenreihenfolge nach Erstverwendung, Zeilenblock je Schritt,
  `rowspan`s und Lücken. Kein DOM, dadurch headless prüfbar.
- `js/portionen.js` — Skalierung und metrische Rundung, dazu das
  Einheiten-Vokabular für die ganze App.
- `js/einkauf.js` — Zutaten mehrerer Rezepte zu einer Liste
  zusammenfassen. Reine Rechnung.
- `js/kochmodus.js` — Stufen-Navigation und Countdown. Die
  Countdown-Rechnung (`countdownBauen`) hängt an der Wanduhr statt an
  gezählten Ticks und ist DOM-frei, damit sie ohne echte Wartezeit
  prüfbar ist (T-0045).
- `js/stufenliste.js` — dieselbe Rechnung hochkant für schmale Schirme.
- `js/render.js` — Modell in DOM, Übersicht und Einzelrezept. Die drei
  Kennzahlen im Kopf kommen aus demselben Plan wie die Zeitachse
  (T-0059), nicht aus den JSON-Feldern.
- `js/app.js` — Laden und Verdrahtung.

**Warum es ein Manifest gibt:** Beim Öffnen per `file://` blockieren alle
Browser `fetch` auf lokale Dateien. Quelle der Wahrheit bleiben die
`.json`-Dateien; `rezepte/manifest.js` ist die daraus erzeugte Fassung,
die ohne Server lesbar ist.

Über http liefert das Manifest nur noch die **Liste der Namen** — ein
Verzeichnis-Listing gibt es ohne Server nicht. Der Inhalt kommt frisch
aus den JSON-Dateien, und zwar auch für Übersicht und Einkaufsliste
(T-0061); vorher galt das nur für das Einzelrezept (T-0047). Schlägt ein
Laden fehl, springt die Manifest-Fassung ein und wird als solche
gemeldet — eine alte Menge, die wie eine aktuelle aussieht, ist der
schlechtere Ausgang.
