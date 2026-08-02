# Rezepte konvertieren

Ein Rezept wird in einer Claude-Code-Session zu einer JSON-Datei nach
[`schema.md`](schema.md). Zur Laufzeit passiert das nie — die App ruft
nichts ab, das ist der Punkt.

## Ablauf

1. Rezept als Text in die Session geben, oder eine URL nennen.
2. Claude schreibt `rezepte/<id>.json`.
3. **Manifest neu erzeugen** — sonst taucht das Rezept nicht auf:
   ```bash
   node tools/build-manifest.js
   ```
4. Prüfen:
   ```bash
   node tools/pruefe-grid.js
   ```

## Urheberrecht

Zutatenlisten, Mengen und Zeiten sind Fakten und werden übernommen.
Wörtliche Anleitungstexte fremder Quellen nicht — die werden
eigenständig neu formuliert. Das kostet praktisch nichts, weil
Chu-Schritte ohnehin nur wenige Wörter lang sind.

`quelle` nennt die Seite, von der die Mengen **tatsächlich** stammen.
Wurde keine benutzt, steht dort `null`. Keine Quelle eintragen, die nicht
gelesen wurde — auch dann nicht, wenn danach gesucht wurde.

Ist eine Seite technisch nicht abrufbar (chefkoch.de war es am
02.08.2026 nicht), wird die Sperre nicht umgangen. Dann entweder Mengen
von Hand hereingeben oder ein Grundrezept eigenständig formulieren und
`quelle: null` setzen.

## Die sechs Fallstricke

Alle aus echten Konvertierungen, nicht ausgedacht.

**1. Eine Zutat belegt genau eine Zeile.**
Wird etwas zweimal gebraucht — die halbe Milch anrühren, den Rest später
— sind das **zwei Einträge** mit eigenen IDs:
```json
{ "id": "z-milch-1", "name": "Milch", "menge": 250, "einheit": "ml", "notiz": "die Hälfte" },
{ "id": "z-milch-2", "name": "Milch", "menge": 250, "einheit": "ml", "notiz": "restliche Hälfte" }
```
Steht dieselbe Zutat in zwei Schritten, meldet der Renderer das als
Fehler — sie hätte sonst keine eindeutige Zeile.

**2. Einheiten nur aus dem Vokabular.**
`g`, `kg`, `ml`, `l`, `EL`, `TL`, `Msp`, `Prise`, `Stueck`, `Zehe`,
`Blatt`, `Stiel`, `Zweig`, `Bund`, `Dose`, `Packung`, `Scheibe`,
`Handvoll`. `pruefe-grid.js` schlägt bei allem anderen an. Grund: Aus
`Zehen` statt `Zehe` wird still `1,5 Zehen` statt `1½ Zehe`, weil die
Einheit dann nicht mehr als zählbar erkannt wird.

**3. Gezähltes ohne Einheit.**
Vier Eier sind `"menge": 4, "einheit": null` — nicht `"Stueck"`, sonst
steht in der Tabelle „4 Stueck | Eier".

**4. `skalieren: false` für alles, was nicht mitwächst.**
Kochwasser, Salz fürs Kochwasser, Lorbeerblatt, eine Prise, Frittierfett.
Diese Mengen hängen am Topf, nicht an der Portionszahl. Sie bekommen im
Grid die Marke „fix".

**5. Dauer gehört zum Schritt.**
`dauer_s` in Sekunden, nie kumulativ. `null` heißt „ohne Zeit"
(abschmecken, servieren). `unbeaufsichtigt: true` bei allem, was von
allein läuft — köcheln, gehen lassen, ruhen. Daraus rechnet der Kopf die
Kennzahl „ohne Zutun", und die Stufe wird im Grid als Wartezeit
gekennzeichnet.

**6. Zutaten eines Strangs zusammenhalten.**
Parallele Stränge kann der Renderer (Maultaschen: Teig und Füllung
laufen erst beim Formen zusammen) — solange die Zutaten eines Strangs im
Grid hintereinander stehen. Dafür den ganzen Strang in **einem** Schritt
einführen, statt seine Zutaten über mehrere zu verteilen. Verschränkte
Stränge meldet der Renderer als „kein zusammenhängender Zeilenblock".

## Plausibilität prüfen

Vor dem Commit kurz gegenlesen:

- Ergeben die Mengen die angegebene Portionszahl? 300 g Linsen für vier
  Personen ja, für zwölf nicht.
- Passt `zeit_gesamt_s` zur Summe der `dauer_s` plus Vorbereitung?
- Ist `zeit_aktiv_s` mindestens so groß wie die Summe der Stufen **ohne**
  `unbeaufsichtigt`?
- Sind die Schritt-Titel Handlungen in ein bis vier Wörtern? Sie stehen
  als Überschrift in der Grid-Zelle und in der Kochleiste.

## Prompt-Vorlage

Vollständig zum Kopieren in eine Claude-Code-Session im Projektordner:

```
Konvertiere das folgende Rezept nach docs/schema.md in eine neue Datei
unter rezepte/.

<HIER DAS REZEPT ODER DIE URL>

Regeln, die dabei zaehlen:

1. Mengen, Zutaten und Zeiten uebernimmst du. Die Anleitungstexte
   formulierst du eigenstaendig neu — kurz, ein bis zwei Saetze je
   Schritt. Setze quelle auf die Seite, von der die Mengen tatsaechlich
   stammen, oder null, wenn keine benutzt wurde. Trage nie eine Quelle
   ein, die du nicht gelesen hast; ist eine Seite nicht abrufbar, sag es
   und frag mich, statt sie zu umgehen.

2. Jede Zutat darf in genau EINEM Schritt stehen — das ist ihre Zeile im
   Grid. Wird etwas zweimal gebraucht, mach zwei Eintraege mit eigenen
   IDs und einer Notiz, die den Unterschied nennt.

3. Einheiten nur aus: g, kg, ml, l, EL, TL, Msp, Prise, Stueck, Zehe,
   Blatt, Stiel, Zweig, Bund, Dose, Packung, Scheibe, Handvoll.
   Gezaehltes ohne Einheit (vier Eier) bekommt einheit: null.

4. Setze skalieren: false bei allem, was nicht mit der Portionszahl
   waechst — Kochwasser, Salz fuers Kochwasser, Lorbeer, eine Prise,
   Frittierfett.

5. dauer_s in Sekunden je Schritt, nie kumulativ, null wenn die Stufe
   keine Zeit hat. Setze unbeaufsichtigt: true bei allem, was von allein
   laeuft (koecheln, gehen lassen, ruhen, marinieren).

6. Fuehre einen zusammengehoerigen Strang in EINEM Schritt ein, statt
   seine Zutaten ueber mehrere zu verteilen. Sonst verschraenken sich die
   Straenge und der Renderer kann das Grid nicht bauen.

7. Der Schritt-Titel ist ein Kurzlabel von ein bis vier Woertern
   ("aufgiessen", "Tomatenmark roesten"), die Anweisung der ganze Satz.

Danach fuehre bitte aus:
  node tools/build-manifest.js
  node tools/pruefe-grid.js
und melde mir das Ergebnis. Pruefe ausserdem selbst, ob die Mengen zur
Portionszahl passen und ob zeit_aktiv_s mindestens die Summe der Stufen
ohne unbeaufsichtigt ist.
```
