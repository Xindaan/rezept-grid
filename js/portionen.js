// portionen.js — Mengen skalieren und metrisch sinnvoll runden.
//
// Reine Rechnung, kein DOM. Regeln aus TASK.md T-0003:
//   Gewicht/Volumen (g, ml, ...) -> ab 10 ganzzahlig, darunter eine
//   Nachkommastelle. Stueck-artige Einheiten (EL, TL, Zehe, Blatt, ...)
//   -> auf gaengige Kuechenbrueche runden (1/4, 1/3, 1/2, 2/3, 3/4).
//
// Warum zwei Regeln: 133,333 ml sind eine Scheingenauigkeit, 130 ml sind
// abmessbar. Umgekehrt ist "1,3 Zehen Knoblauch" keine Anweisung, die
// jemand ausfuehren kann — "1 1/3" schon.

(function (global) {
  "use strict";

  // Einheiten, die man zaehlt oder loeffelt statt wiegt.
  var BRUCH_EINHEITEN = [
    "EL", "TL", "Msp", "Prise",
    "Stueck", "Stück", "Zehe", "Blatt", "Stiel", "Zweig",
    "Bund", "Dose", "Packung", "Scheibe", "Handvoll"
  ];

  var BRUECHE = [
    { wert: 0, zeichen: "" },
    { wert: 1 / 4, zeichen: "¼" },
    { wert: 1 / 3, zeichen: "⅓" },
    { wert: 1 / 2, zeichen: "½" },
    { wert: 2 / 3, zeichen: "⅔" },
    { wert: 3 / 4, zeichen: "¾" },
    { wert: 1, zeichen: null } // null = auf die naechste ganze Zahl aufrunden
  ];

  // Ohne Einheit ist die Menge eine reine Stueckzahl ("4 Eier") — die
  // gehoert zu den gezaehlten, nicht zu den gewogenen Groessen.
  // Sonst kaeme bei 3 Eiern und anderthalbfacher Menge "4,5 Eier" heraus.
  function istBruchEinheit(einheit) {
    if (einheit === null || einheit === undefined || einheit === "") return true;
    return BRUCH_EINHEITEN.indexOf(einheit) > -1;
  }

  // Gewicht/Volumen: ab 10 ganzzahlig, darunter eine Nachkommastelle.
  function dezimalRunden(wert) {
    if (wert >= 10) return Math.round(wert);
    return Math.round(wert * 10) / 10;
  }

  // Stueck-artig: ganzer Anteil + naechstgelegener Kuechenbruch.
  function bruchFormatieren(wert) {
    if (wert <= 0) return "0";

    var ganz = Math.floor(wert);
    var rest = wert - ganz;

    var beste = BRUECHE[0];
    var kleinsterAbstand = Infinity;
    BRUECHE.forEach(function (kandidat) {
      var abstand = Math.abs(rest - kandidat.wert);
      if (abstand < kleinsterAbstand) {
        kleinsterAbstand = abstand;
        beste = kandidat;
      }
    });

    if (beste.zeichen === null) { // auf die naechste ganze Zahl gerundet
      ganz += 1;
      beste = BRUECHE[0];
    }

    // Sehr kleine Restmengen nicht auf 0 runden — lieber die kleinste
    // noch abmessbare Angabe zeigen.
    if (ganz === 0 && beste.zeichen === "") return "¼";
    if (ganz === 0) return beste.zeichen;
    return String(ganz) + beste.zeichen;
  }

  // Einzelwert -> Anzeigetext, je nach Einheit.
  function wertFormatieren(wert, einheit) {
    if (istBruchEinheit(einheit)) return bruchFormatieren(wert);
    return global.RezeptGrid.zahlFormatieren(dezimalRunden(wert));
  }

  // Menge + Einheit einer Zutat fuer den gewuenschten Faktor.
  // Mengenlose Zutaten ("nach Geschmack") liefern "".
  function mengeFormatieren(zutat, faktor) {
    if (zutat.menge === null || zutat.menge === undefined) return "";
    var f = (zutat.skalieren === false) ? 1 : (faktor === undefined ? 1 : faktor);

    var text = wertFormatieren(zutat.menge * f, zutat.einheit);
    if (zutat.menge_bis !== null && zutat.menge_bis !== undefined) {
      text += "–" + wertFormatieren(zutat.menge_bis * f, zutat.einheit);
    }
    return zutat.einheit ? text + " " + zutat.einheit : text;
  }

  // Auswahlwerte fuer die Portions-Umschaltung: halbe, einfache,
  // anderthalbfache und doppelte Basis, sofern ganzzahlig.
  function portionsOptionen(basis) {
    var werte = [basis / 2, basis, basis * 1.5, basis * 2];
    var ergebnis = [];
    werte.forEach(function (w) {
      if (w >= 1 && Number.isInteger(w) && ergebnis.indexOf(w) === -1) ergebnis.push(w);
    });
    if (ergebnis.indexOf(basis) === -1) ergebnis.push(basis);
    return ergebnis.sort(function (a, b) { return a - b; });
  }

  global.RezeptPortionen = {
    mengeFormatieren: mengeFormatieren,
    wertFormatieren: wertFormatieren,
    bruchFormatieren: bruchFormatieren,
    dezimalRunden: dezimalRunden,
    istBruchEinheit: istBruchEinheit,
    portionsOptionen: portionsOptionen
  };
})(typeof window !== "undefined" ? window : globalThis);
