// grid.js — Layout-Berechnung fuer die Chu-Tabelle.
//
// Kern des Projekts: aus einem Rezept nach docs/schema.md wird das
// Tabellen-Layout BERECHNET (Zeilenreihenfolge, rowspans, Luecken).
// Reine Rechnung, kein DOM, kein I/O — damit testbar und wiederverwendbar.
// Braucht js/zeitmass.js (der Zeitplan bestimmt die Spalten, T-0032);
// deshalb steht zeitmass.js in index.html davor.

(function (global) {
  "use strict";

  // Baut das Grid-Modell. Liefert immer ein Ergebnis; erkannte Fehler
  // stehen in `probleme` und werden sichtbar gemacht statt zu werfen —
  // ein halb kaputtes Rezept soll trotzdem etwas anzeigen.
  function gridModellBauen(rezept) {
    var probleme = [];
    var zutatNachId = new Map();
    var i;

    for (i = 0; i < rezept.zutaten.length; i++) {
      var z = rezept.zutaten[i];
      if (zutatNachId.has(z.id)) {
        probleme.push('Zutaten-ID "' + z.id + '" ist doppelt vergeben.');
      }
      zutatNachId.set(z.id, z);
    }

    // --- 1. Zeilenreihenfolge = Reihenfolge der Erstverwendung ---------
    var zeilen = [];
    var zeileVonZutat = new Map();

    rezept.schritte.forEach(function (schritt) {
      (schritt.zutaten || []).forEach(function (zid) {
        var zutat = zutatNachId.get(zid);
        if (!zutat) {
          probleme.push('Schritt "' + schritt.id + '" verweist auf die unbekannte Zutat "' + zid + '".');
          return;
        }
        if (zeileVonZutat.has(zid)) {
          probleme.push('Zutat "' + zid + '" wird in mehreren Schritten gelistet. Eine Zutat belegt genau eine Zeile — mehrfach verwendete Zutaten brauchen je einen eigenen Eintrag (siehe docs/schema.md).');
          return;
        }
        zeileVonZutat.set(zid, zeilen.length);
        zeilen.push({ zutat: zutat, schrittId: schritt.id });
      });
    });

    // Nicht referenzierte Zutaten haengen unten an, damit sie nicht
    // stillschweigend verschwinden.
    rezept.zutaten.forEach(function (zutat) {
      if (zeileVonZutat.has(zutat.id)) return;
      probleme.push('Zutat "' + zutat.id + '" wird von keinem Schritt verwendet.');
      zeileVonZutat.set(zutat.id, zeilen.length);
      zeilen.push({ zutat: zutat, schrittId: null });
    });

    // --- 2. Zeilenblock je Schritt ------------------------------------
    // block(s) = eigene neue Zutaten + Bloecke aller Vorstufen.
    var zeilenVonSchritt = new Map(); // schritt-id -> Set<zeilenindex>
    var spalten = [];

    // Die Default-Regel steht in zeitmass.js (T-0049). Hier wird die
    // ID-Form gebraucht, nicht die gefilterte Indexform: unbekannte
    // Vorstufen sollen gemeldet werden, nicht verschwinden.
    var vorstufenJeSchritt = global.RezeptZeitmass.vorstufenIds(rezept.schritte);

    rezept.schritte.forEach(function (schritt, index) {
      var vorstufen = vorstufenJeSchritt[index];

      var meine = new Set();
      // Zeilen der Zutaten, die genau bei diesem Schritt dazukommen —
      // getrennt vom geerbten Block, weil der Kochmodus (T-0004) nur die
      // neuen hervorheben soll. Der Block waechst kumulativ; ihn komplett
      // zu markieren waere beim letzten Schritt das ganze Rezept.
      var eigeneZeilen = [];

      (schritt.zutaten || []).forEach(function (zid) {
        var r = zeileVonZutat.get(zid);
        if (r !== undefined) {
          meine.add(r);
          eigeneZeilen.push(r);
        }
      });

      vorstufen.forEach(function (vid) {
        var vorher = zeilenVonSchritt.get(vid);
        if (!vorher) {
          probleme.push('Schritt "' + schritt.id + '": Vorstufe "' + vid + '" ist unbekannt oder steht nicht vor diesem Schritt.');
          return;
        }
        vorher.forEach(function (r) { meine.add(r); });
      });

      zeilenVonSchritt.set(schritt.id, meine);

      if (meine.size === 0) {
        probleme.push('Schritt "' + schritt.id + '" hat weder neue Zutaten noch eine gueltige Vorstufe und wird nicht dargestellt.');
        return;
      }

      var von = Infinity, bis = -Infinity;
      meine.forEach(function (r) {
        if (r < von) von = r;
        if (r > bis) bis = r;
      });

      // Zusammenhaengend? Wenn im Bereich [von,bis] Zeilen liegen, die
      // nicht zu diesem Strang gehoeren, ist das Rezept nicht linear.
      var luecken = (bis - von + 1) - meine.size;
      if (luecken > 0) {
        probleme.push('Schritt "' + schritt.id + '" umfasst keinen zusammenhaengenden Zeilenblock (' + luecken + ' fremde Zeile(n) dazwischen). Nicht-lineare Rezepte kann der Renderer noch nicht (T-0008).');
      }

      spalten.push({
        schritt: schritt,
        vorstufen: vorstufen,
        von: von,
        bis: bis,
        hoehe: bis - von + 1,
        eigeneZeilen: eigeneZeilen.sort(function (a, b) { return a - b; }),
        neueZutaten: (schritt.zutaten || []).length
      });
    });

    // --- 3. Zeitplan fuer eine Person ---------------------------------
    // Erst der Plan, dann die Spalten — nicht umgekehrt (T-0032). Vorher
    // ergab sich die Spalte aus der Abhaengigkeitstiefe: eine Stufe ohne
    // Vorstufen landete in Spalte 0, egal wann man sie realistisch macht.
    // Bei den Maultaschen stand "Fuellung mischen" dadurch neben dem
    // Kneten, obwohl beides die Haende braucht. Sie gehoert in die
    // Ruhezeit des Teigs, und genau das rechnet der Plan aus.
    var indexNachId = {};
    spalten.forEach(function (s, i) { indexNachId[s.schritt.id] = i; });

    var plan = global.RezeptZeitmass.plan(
      spalten.map(function (s) { return s.schritt.dauer_s; }),
      spalten.map(function (s) {
        return s.vorstufen.map(function (vid) { return indexNachId[vid]; })
                          .filter(function (j) { return j !== undefined; });
      }),
      spalten.map(function (s) { return !!s.schritt.unbeaufsichtigt; })
    );
    spalten.forEach(function (s, i) {
      s.start = plan.starts[i];
      s.ende = plan.enden[i];
    });

    // --- 4. Spaltenzuordnung ------------------------------------------
    // Eine Spalte ist ein Zeitpunkt: Stufen, die zusammen beginnen,
    // teilen sie sich. Das geht nur, wenn ihre Zeilenbloecke sich nicht
    // ueberschneiden — sonst rueckt die spaetere nach rechts. Bei
    // linearen Rezepten faellt daraus wieder genau eine Spalte je Stufe.
    var belegung = [];
    var minSpalte = 0, letzterStart = null;

    spalten.map(function (s, i) { return i; })
      .sort(function (a, b) {
        return (spalten[a].start - spalten[b].start) || (a - b);
      })
      .forEach(function (i) {
        var s = spalten[i];
        // Neuer Zeitpunkt: alles bisher Platzierte liegt links davon.
        if (letzterStart !== null && s.start > letzterStart) minSpalte = belegung.length;
        letzterStart = s.start;

        // Redundant, solange jede Stufe positive Dauer hat — aber eine
        // Stufe ohne Dauer beginnt zeitgleich mit ihrer Vorstufe und
        // duerfte sonst links von ihr landen.
        var c = minSpalte;
        s.vorstufen.forEach(function (vid) {
          var vor = spalten[indexNachId[vid]];
          if (vor && vor.spalte !== undefined) c = Math.max(c, vor.spalte + 1);
        });

        while (belegung[c] && belegung[c].some(function (b) {
          return !(s.bis < b.von || s.von > b.bis);
        })) c++;

        s.spalte = c;
        belegung[c] = belegung[c] || [];
        belegung[c].push({ von: s.von, bis: s.bis });
      });

    return {
      rezept: rezept,
      zeilen: zeilen,
      spalten: spalten,
      spaltenAnzahl: belegung.length,
      probleme: probleme
    };
  }

  // --- Formatierung ---------------------------------------------------

  // Sekunden -> "45 Sek" / "6 Min" / "1 Std 15 Min".
  function dauerFormatieren(sekunden) {
    if (sekunden === null || sekunden === undefined) return "";
    if (sekunden < 60) return sekunden + " Sek";
    var minuten = Math.round(sekunden / 60);
    if (minuten < 60) return minuten + " Min";
    var stunden = Math.floor(minuten / 60);
    var rest = minuten % 60;
    return rest === 0 ? stunden + " Std" : stunden + " Std " + rest + " Min";
  }

  // Zahl mit deutschem Dezimalkomma, ohne unnoetige Nullen.
  function zahlFormatieren(wert) {
    if (Number.isInteger(wert)) return String(wert);
    return String(Math.round(wert * 100) / 100).replace(".", ",");
  }

  // Mengen-Formatierung liegt in portionen.js, weil sie vom
  // Portionsfaktor und von der Einheit abhaengt (T-0003).

  global.RezeptGrid = {
    gridModellBauen: gridModellBauen,
    dauerFormatieren: dauerFormatieren,
    zahlFormatieren: zahlFormatieren
  };
})(typeof window !== "undefined" ? window : globalThis);
