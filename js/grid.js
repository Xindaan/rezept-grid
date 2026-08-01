// grid.js — Layout-Berechnung fuer die Chu-Tabelle.
//
// Kern des Projekts: aus einem Rezept nach docs/schema.md wird das
// Tabellen-Layout BERECHNET (Zeilenreihenfolge, rowspans, Luecken).
// Reine Rechnung, kein DOM, kein I/O — damit testbar und wiederverwendbar.

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

    rezept.schritte.forEach(function (schritt, index) {
      // vorstufen ist optional: Default ist der unmittelbare Vorgaenger.
      var vorstufen = schritt.vorstufen;
      if (vorstufen === undefined || vorstufen === null) {
        vorstufen = index > 0 ? [rezept.schritte[index - 1].id] : [];
      }

      var meine = new Set();

      (schritt.zutaten || []).forEach(function (zid) {
        var r = zeileVonZutat.get(zid);
        if (r !== undefined) meine.add(r);
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
        von: von,
        bis: bis,
        hoehe: bis - von + 1,
        neueZutaten: (schritt.zutaten || []).length
      });
    });

    return { rezept: rezept, zeilen: zeilen, spalten: spalten, probleme: probleme };
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
