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

## Die elf Fallstricke

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

**7. `vorstufen` und `unbeaufsichtigt` planen gemeinsam den Ablauf.**
`vorstufen` sagt, was **worauf warten muss**; `unbeaufsichtigt` sagt, was
**die Hände belegt**. Aus beidem zusammen rechnet der Renderer einen Plan
für *eine* Person — und daraus erst entstehen Spalten und Zeitachse.

Zwei Regeln stecken darin: eine Stufe beginnt frühestens, wenn ihre
Vorstufen fertig sind, und zwei beaufsichtigte Stufen laufen nie
gleichzeitig. Man hat zwei Hände.

Daraus folgt: Ein falsch gesetztes Feld sieht nicht nur schief aus, es
produziert eine **falsche Zahl und ein falsches Bild**. Bei den
Maultaschen stand „Füllung mischen, 15 Min" eine Zeit lang neben
„Nudelteig kneten, 10 Min" — beides mit den Händen, beides ab Minute 0.
Richtig ist, dass die Füllung in die 30 Minuten Teigruhe fällt.

Drei Faustregeln:

- Eine Stufe, die *irgendwann während* einer anderen erledigt werden
  kann, bekommt `vorstufen: []` (oder verweist auf ihre eigene Vorstufe
  im selben Strang) — **nicht** auf die Stufe daneben. Wo sie zeitlich
  landet, entscheidet der Plan, nicht die Reihenfolge im Array.
- `unbeaufsichtigt: true` gehört an **jede** echte Wartezeit. Fehlt es,
  hält die Stufe die Hände besetzt, und alles Parallele rutscht dahinter.
- `zeit_gesamt_s` ist das Ende dieses Plans, nicht die Summe der Dauern
  und auch nicht der reine kritische Pfad. `pruefe-grid.js` meldet es,
  wenn beides auseinanderfällt: **unter** dem Plan ist ein harter Fehler
  (unmöglich), **über** dem Plan sind 10 % Puffer erlaubt und alles
  darüber ein Fehler. Die 10 % sind für ehrliche Rundungen da (Eierkuchen
  rundet 3570 auf 3600), nicht für Schätzungen — wer 3 Stunden schreibt,
  wo der Plan bei 2:15 endet, bekommt seit T-0046 ein FAIL.

**8. Gleiches Produkt, gleicher Name — über Rezepte hinweg.**
Die Einkaufsliste fasst Posten über `name` + `einheit` zusammen. Heißt
dieselbe Sache in einem Rezept „Ei" und im anderen „Eier", stehen sie
doppelt auf der Liste und man kauft zu wenig. Also durchgängig denselben
Namen verwenden, auch wenn es im Einzelfall grammatisch etwas steif
klingt („1 | Eier"). Unterschiedliche Produkte dürfen dagegen ruhig
verschieden heißen — „Spätzlemehl" und „Weizenmehl" sind nicht dasselbe
und sollen getrennt bleiben.

**9. `hinweise` und `untertitel` sind Kochwissen, keine Anekdoten.**
Beides ist nutzersichtbar und der Ton des ganzen Rezepts. Hinein gehört,
was jemand am Herd braucht: Varianten, Aufbewahrung, was schiefgeht und
warum, regionale Namensunterschiede, wenn sie zur Verwechslung führen.

Nicht hinein gehören:

- **Anspielungen auf Personen oder Orte** („für X zur Klarstellung", „in
  Y fällt das auf"). Das Rezept wird geteilt und veröffentlicht; ein
  Insider-Witz ist dann nur noch ein Rätsel — und trägt Personenbezug in
  ein öffentliches Repo.
- **Aussagen über die App statt über das Essen** („das erste Rezept in
  der Sammlung mit zwei Strängen", „im Grid sind das zwei Klammern").
  Wie der Renderer arbeitet, steht in `docs/`, nicht im Rezept.

Prüffrage: Stünde der Satz so in einem Kochbuch, das jemand kauft? Wenn
nein, streichen. (Nachträglich korrigiert am 03.08.2026 — vier Texte in
drei Rezepten waren in beide Richtungen abgerutscht.)

**10. Die Schritt-Reihenfolge im JSON folgt dem Plan, nicht der Quelle.**
`pruefe-grid.js` meldet es, wenn eine Stufe im Array hinter einer steht,
die der Planer erst später beginnt. Bei zwei beaufsichtigten Strängen
nimmt der Planer den mit dem längeren Restpfad zuerst — und der zweite
Strang darf im Array **nicht zwischen** die Stufen des ersten, sonst
zerreißt dessen Zeilenblock. Also den kürzeren Strang komplett dahinter
schreiben, auch wenn die Quelle ihn zuerst nennt. Beim Omelett heißt
das: Pilze schneiden, braten, würzen — und erst dann „Eier verquirlen",
obwohl einfachkochen.de mit den Eiern anfängt. Kochen kann man trotzdem
in beliebiger Reihenfolge; das Grid zeigt den Weg für eine Person.

**11. `dauer_s: null` heißt „kostet keine Zeit", nicht „weiß ich nicht".**
Ein Schritt ohne Dauer geht mit **null** Minuten in den Plan ein — und
damit auch in die Kachel „ohne Zutun", die als Gesamtzeit minus
Arbeitszeit gerechnet wird. Steht die Arbeit dann trotzdem in
`zeit_aktiv_s`, ergeben die drei Kacheln im Kopf zusammen mehr als das
Ganze. Genau so beim Pfannkuchen passiert (T-0053): „füllen und zuckern"
hatte keine Dauer, `zeit_aktiv_s` rechnete die 15 Minuten aber mit — im
Kopf standen 45 + 105 gegen 135.

`null` ist richtig für Schritte, die wirklich keine Zeit brauchen
(„servieren", „mit Petersilie bestreuen"). Kostet ein Schritt Arbeit,
bekommt er eine Dauer, und `zeit_gesamt_s` wächst mit. `pruefe-grid.js`
meldet den Widerspruch seit T-0053 — auf den Rohdaten **und** noch einmal
auf den gerenderten Kacheln.

## Plausibilität prüfen

Vor dem Commit kurz gegenlesen:

- Ergeben die Mengen die angegebene Portionszahl? 300 g Linsen für vier
  Personen ja, für zwölf nicht.
- Passt `zeit_gesamt_s` zum **Ablauf für eine Person** plus Vorbereitung?
  Bei parallelen Strängen ist das weniger als die Summe der Dauern. Das
  Prüfskript hält den Wert nach unten hart gegen den Plan und nach oben
  gegen Plan + 10 %.
- Ist `zeit_aktiv_s` mindestens so groß wie die Summe der Stufen **ohne**
  `unbeaufsichtigt` — und nicht größer als `zeit_gesamt_s`? Beides prüft
  das Skript seit T-0046 selbst; vorher stand die Regel nur hier.
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

7. vorstufen und unbeaufsichtigt planen zusammen den Ablauf, und daraus
   entstehen Grid und Zeitachse. vorstufen sagt, was worauf warten muss;
   unbeaufsichtigt sagt, was die Haende belegt. Geplant wird fuer EINE
   Person: zwei beaufsichtigte Stufen laufen nie gleichzeitig, eine
   unbeaufsichtigte belegt niemanden. Kann eine Stufe irgendwann waehrend
   einer anderen erledigt werden (Fuellung mischen, waehrend der Teig
   ruht), bekommt sie vorstufen: [] und verweist NICHT auf die Stufe
   daneben — wo sie zeitlich landet, rechnet der Renderer aus. Setze
   zeit_gesamt_s auf das Ende dieses Ablaufs, nicht auf die Summe der
   Dauern.

8. Der Schritt-Titel ist ein Kurzlabel von ein bis vier Woertern
   ("aufgiessen", "Tomatenmark roesten"), die Anweisung der ganze Satz.

9. hinweise und untertitel sind Kochwissen, kein Plauderton. Hinein
   gehoert, was jemand am Herd braucht: Varianten, Aufbewahrung, was
   schiefgeht und warum, regionale Namensunterschiede. NICHT hinein
   gehoeren Anspielungen auf Personen oder Orte ("fuer X zur
   Klarstellung", "in Y faellt das auf") und Aussagen ueber die App
   statt ueber das Essen ("im Grid sind das zwei Klammern"). Die
   Rezepte werden veroeffentlicht. Prueffrage: Stuende der Satz so in
   einem Kochbuch, das jemand kauft?

10. Die Reihenfolge der Schritte im JSON folgt dem berechneten Plan,
    nicht der Quelle: pruefe-grid.js meldet Stufen, die im Array vor
    einer stehen, die der Planer frueher beginnt. Bei zwei
    beaufsichtigten Straengen kommt der mit dem laengeren Restpfad
    zuerst, und der zweite darf im Array nicht zwischen die Stufen des
    ersten (sonst zerreisst dessen Zeilenblock) — also komplett dahinter.

Danach fuehre bitte aus:
  node tools/build-manifest.js
  node tools/pruefe-grid.js
und melde mir das Ergebnis. Pruefe ausserdem selbst, ob die Mengen zur
Portionszahl passen; zeit_aktiv_s und zeit_gesamt_s prueft das Skript.
```
