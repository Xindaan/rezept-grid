# rezept-grid — Projektkonventionen

## Zweck

Statische Rezept-App fuer Familie und Freunde. Rezepte werden in der
Tabellen-Notation von "Cooking for Engineers" (Michael Chu) dargestellt:
Zutaten als Zeilen links, Arbeitsschritte als verbundene Zellen rechts —
das Grid kodiert, was wann mit was kombiniert wird.

Vorbild (Einzelrezept, handkodiert): claude.ai-Artifact "The Stew"
https://claude.ai/public/artifacts/61558425-7ef9-40b9-86ae-b241baaf9cdc

## Architektur-Eckpfeiler (bewusst entschieden, nicht ohne Ruecksprache
aendern)

1. **Reine statische Dateien.** HTML/CSS/JS ohne Framework, ohne
   Build-Tooling, ohne Server. `index.html` im Browser oeffnen = die App.
2. **Keine API-Calls zur Laufzeit, nirgends.** Grund: keine laufenden
   Kosten. Konvertierung neuer Rezepte passiert ausschliesslich in
   Claude-Code-Sessions (Abo): Rezepttext/URL rein -> JSON-Datei nach
   `rezepte/` -> App liest sie. Anleitung dafuer: `docs/konvertierung.md`.
3. **Rezepte sind Daten, kein Markup.** Jedes Rezept ist eine JSON-Datei
   nach `docs/schema.md`. Das Grid-Layout (rowspans, Zeilenreihenfolge)
   wird vom Renderer BERECHNET, nie von Hand kodiert.
4. **Metrisch only.** Kein US/Metrik-Umschalter.

## Urheberrecht (Pflicht bei jeder Konvertierung)

Zutatenlisten und Mengen sind rechtlich unkritisch. Woertliche
Anleitungstexte fremder Quellen (rezepte.de, Chefkoch etc.) NICHT
uebernehmen — Schritte beim Konvertieren eigenstaendig und knapp neu
formulieren. Keine fremden Bilder. Quelle im JSON-Feld `quelle` nennen.

## Sprache

Override zu `~/src/CLAUDE.md` §7: **UI-Strings Deutsch MIT Umlauten**
(UTF-8, nutzersichtbar). Code, Kommentare, Bezeichner, Dateinamen:
weiterhin Deutsch ASCII (keine Umlaute/ss).

## Verifikation

- Smoke-Test: `index.html` im Browser oeffnen, Beispielrezept rendern,
  Portionen umschalten, Kochmodus starten.
- Schema-Aenderungen: alle Dateien unter `rezepte/` gegen das Schema
  pruefen mit `node tools/pruefe-grid.js`. Das Skript prueft Schema,
  Layout, Zeitplan, Manifest und die DOM-Schicht in einem Lauf; ein
  eigenes `check-rezepte.js` gibt es nicht und ist auch nicht geplant.

## Steuerdateien

TASK.md / STATE.md nach `~/src/CLAUDE.md`. IDs beginnen bei T-0001.
