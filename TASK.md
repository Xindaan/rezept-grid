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
- **T-0004** Kochmodus: Stufen-Navigation (vor/zurueck/Exit), Countdown je
  Schritt, Hervorhebung aktiver Schritt + beteiligte Zutaten, Rest dimmen.
  Vorarbeit liegt: `unbeaufsichtigt` je Schritt im Schema, und das
  Grid-Modell kennt pro Schritt seinen Zeilenblock (= beteiligte Zutaten).

## Backlog

- **T-0005** Zutaten-Abhaken per Klick (Einkauf / Mise en place).
- **T-0006** Rezept-Uebersicht: `index.html` listet alle Rezepte. Der
  Ladeweg ist mit T-0002 entschieden (generiertes `rezepte/manifest.js`
  fuer `file://`, direktes `fetch` ueber http) — offen ist nur noch die
  Oberflaeche: Liste, Auswahl, Verlinkung per `?rezept=<id>`.
- **T-0013** Veraltetes Manifest verhindern: `rezepte/manifest.js` wird von
  Hand angestossen und laeuft auseinander, wenn jemand eine `.json` aendert
  und `node tools/build-manifest.js` vergisst. Ueber http faellt das nicht
  auf (dort gewinnt `fetch`), per `file://` zeigt die App dann stillschweigend
  alte Daten. Idee: Pruefung in `tools/pruefe-grid.js`, die Manifest gegen
  die JSON-Dateien vergleicht und bei Abweichung rot wird.
- **T-0007** `docs/konvertierung.md`: Arbeitsanleitung + Prompt-Vorlage fuer
  Claude-Sessions (Text/URL -> Schema-JSON, Umformulierungs-Pflicht,
  Plausibilitaetscheck Mengen/Zeiten).
- **T-0008** Nicht-lineare Rezepte (parallele Straenge, z. B. Sauce separat):
  Konzept Teiltabellen/verschachtelte Spalten. Erst nach T-0002 stabil.
- **T-0009** Verteilung an Familie+Freunde (GitHub Pages o. ae.) inkl.
  kurzem Urheberrechts-Check der enthaltenen Rezepte.
- **T-0010** Druck-Stylesheet (eine Seite, ohne Controls).
- **T-0011** Schema-Checkscript fuer alle Dateien unter `rezepte/` (Node,
  ohne Dependencies). Teilweise erledigt: `tools/pruefe-grid.js` prueft die
  Layout-Berechnung und das Beispielrezept, `tools/build-manifest.js` prueft
  JSON-Gueltigkeit und `id` == Dateiname. Offen: die uebrigen
  Schema-Regeln aus `docs/schema.md` (Einheiten-Vokabular, `menge`/`einheit`
  paarweise, `menge_bis > menge`) ueber alle Rezepte.

## Done

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
