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

## Troubleshooting

**Die Übersicht ist leer oder ein neues Rezept fehlt.**
`rezepte/manifest.js` ist nicht aktuell. `node tools/build-manifest.js`
ausführen. `node tools/pruefe-grid.js` meldet diesen Fall auch.

**Rote Box "Probleme im Rezept" über der Tabelle.**
Das Rezept verletzt eine Schema-Regel — der Text nennt Zutat bzw.
Schritt. Häufigster Fall: eine Zutat ist in mehreren Schritten gelistet.
Eine Zutat belegt genau eine Zeile; mehrfach verwendete Zutaten brauchen
je einen eigenen Eintrag mit eigener `id`.

**"umfasst keinen zusammenhängenden Zeilenblock".**
Das Rezept ist nicht linear (parallele Stränge, z. B. eine Sauce
nebenher). Der Renderer kann das noch nicht — siehe T-0008 in `TASK.md`.

## Development

```bash
node tools/pruefe-grid.js      # Layout, Skalierung, Kochmodus, alle Rezepte
node tools/build-manifest.js   # rezepte/*.json -> rezepte/manifest.js
```

Steuerdateien: `TASK.md` (Backlog), `STATE.md` (Stand + nächste Schritte).

## Architektur

- `js/grid.js` — berechnet das Layout aus dem Rezept-JSON:
  Zeilenreihenfolge nach Erstverwendung, Zeilenblock je Schritt,
  `rowspan`s und Lücken. Kein DOM, dadurch headless prüfbar.
- `js/portionen.js` — Skalierung und metrische Rundung.
- `js/kochmodus.js` — Stufen-Navigation und Countdown.
- `js/render.js` — Modell in DOM, Übersicht und Einzelrezept.
- `js/app.js` — Laden und Verdrahtung.

**Warum es ein Manifest gibt:** Beim Öffnen per `file://` blockieren alle
Browser `fetch` auf lokale Dateien. Quelle der Wahrheit bleiben die
`.json`-Dateien; `rezepte/manifest.js` ist die daraus erzeugte Fassung,
die ohne Server lesbar ist. Über http wird sie für Einzelrezepte nicht
benutzt — dort kommen die JSON-Dateien direkt.
