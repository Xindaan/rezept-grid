#!/usr/bin/env node
// pruefe-grid.js — Headless-Pruefung der Layout-Berechnung aus js/grid.js.
//
//   node tools/pruefe-grid.js
//
// Prueft Zeilenreihenfolge, Bloecke/rowspans, die drei Edge Cases aus
// T-0002, die Formatierung und dass fehlerhafte Rezepte gemeldet statt
// geworfen werden. Deckt einen Teil von T-0011 ab; die vollstaendige
// Schema-Pruefung aller Dateien unter rezepte/ steht noch aus.
"use strict";
var fs = require("fs"), path = require("path");
var wurzel = path.resolve(__dirname, "..");

// Minimal-DOM anmelden, BEVOR die Browser-Module geladen werden (T-0044).
// Ohne das laedt kochmodus.js nur seinen headless-Teil und render.js gar
// nicht — und genau dort sass ein Fehler, den keine Zahlenpruefung
// findet. Siehe tools/dom-attrappe.js.
var DOM = require("./dom-attrappe.js");
DOM.anmelden();

// require statt eval (T-0050). Jedes Modul endet auf
// `(typeof window !== "undefined" ? window : globalThis)` bzw. `(window)`
// und setzt seine Globals selbst — require reicht also, und zwar aus zwei
// Gruenden, die beide in dieser Sitzung konkret wurden:
//
// 1. Stack-Traces nennen Datei und Zeile der QUELLE. Ein Syntaxfehler in
//    js/portionen.js meldete unter eval nur die eval-Stelle hier.
// 2. **eval teilt den Scope dieser Datei.** Beim Umbau fuer T-0049 habe
//    ich in js/grid.js `Z.vorstufenIds(...)` geschrieben — grid.js hat
//    aber gar kein `Z`. Unter eval lief es trotzdem gruen, weil das `Z`
//    aus DIESER Datei sichtbar war; im Browser waere es abgestuerzt.
//    Ein Pruefskript, das dem Produktionscode heimlich eigene Variablen
//    leiht, prueft nicht das, was ausgeliefert wird.
require("../js/zeitmass.js");
require("../js/grid.js");
require("../js/portionen.js");
require("../js/einkauf.js");
require("../js/kochmodus.js");
require("../js/stufenliste.js");
require("../js/render.js");
require("../js/app.js");
var G = globalThis.RezeptGrid;
var P = globalThis.RezeptPortionen;
var K = globalThis.RezeptKochmodus;
var Z = globalThis.RezeptZeitmass;
var S = globalThis.RezeptStufenliste;
var R = globalThis.RezeptRender;
var A = globalThis.RezeptApp;

var fehler = 0;
function pruefe(name, ist, soll) {
  var ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok) { fehler++; console.log("FAIL  " + name + "\n      ist:  " + JSON.stringify(ist) + "\n      soll: " + JSON.stringify(soll)); }
  else console.log("ok    " + name);
}

// --- 1. Beispielrezept ------------------------------------------------
var rezept = JSON.parse(fs.readFileSync(path.join(wurzel, "tools/testdaten/linsen-eintopf.json"), "utf8"));
var m = G.gridModellBauen(rezept);

pruefe("keine Probleme", m.probleme, []);
pruefe("15 Zeilen", m.zeilen.length, 15);
pruefe("Zeilenreihenfolge = Erstverwendung",
  m.zeilen.map(function (z) { return z.zutat.id; }),
  ["z-olivenoel","z-zwiebeln","z-knoblauch","z-karotten","z-sellerie","z-kartoffeln",
   "z-tomatenmark","z-linsen","z-bruehe","z-lorbeer","z-thymian",
   "z-essig","z-salz","z-pfeffer","z-petersilie"]);
pruefe("Bloecke (von,bis,hoehe)",
  m.spalten.map(function (s) { return [s.schritt.id, s.von, s.bis, s.hoehe]; }),
  [["s-anschwitzen",0,2,3],["s-wurzelgemuese",0,5,6],["s-tomatenmark",0,6,7],
   ["s-abloeschen",0,10,11],["s-koecheln",0,10,11],["s-abschmecken",0,14,15]]);
pruefe("Edge: koecheln hat 0 neue Zutaten",
  m.spalten.find(function (s) { return s.schritt.id === "s-koecheln"; }).neueZutaten, 0);
pruefe("Edge: koecheln erbt Hoehe der Vorstufe",
  m.spalten[4].hoehe, m.spalten[3].hoehe);

// Tabellen-Integritaet: Bloecke muessen im Zeilenbereich liegen, die
// Hoehe muss zum Bereich passen, und die rowspan-Zelle aus render.js
// darf genau die Zeilen von..bis abdecken — nicht mehr, nicht weniger.
var integritaet = [];
m.spalten.forEach(function (s) {
  if (s.von < 0 || s.bis >= m.zeilen.length) integritaet.push(s.schritt.id + ": Block ausserhalb der Zeilen");
  if (s.hoehe !== s.bis - s.von + 1) integritaet.push(s.schritt.id + ": hoehe passt nicht zu von/bis");
  var abgedeckt = [];
  for (var r = 0; r < m.zeilen.length; r++) {
    if (s.von === r) abgedeckt.push(r);                       // eigene Zelle (rowspan)
    else if (r > s.von && r <= s.bis) abgedeckt.push(r);      // von ihr verdeckt
  }
  if (abgedeckt.length !== s.hoehe) integritaet.push(s.schritt.id + ": rowspan deckt " + abgedeckt.length + " statt " + s.hoehe + " Zeilen");
});
pruefe("Tabellen-Integritaet (rowspan deckt genau den Block)", integritaet, []);

// --- 2. Edge Cases der Formatierung -----------------------------------
pruefe("Dauer 45 Sek", G.dauerFormatieren(45), "45 Sek");
pruefe("Dauer 2100 s", G.dauerFormatieren(2100), "35 Min");
pruefe("Dauer 3900 s", G.dauerFormatieren(3900), "1 Std 5 Min");
pruefe("Dauer 3600 s", G.dauerFormatieren(3600), "1 Std");
pruefe("Dauer null = leer", G.dauerFormatieren(null), "");
pruefe("Menge ohne Wert", P.mengeFormatieren({menge:null,einheit:null}, 1), "");
pruefe("Menge 1,5 TL wird zum Bruch", P.mengeFormatieren({menge:1.5,einheit:"TL"}, 1), "1½ TL");
pruefe("Menge Spanne", P.mengeFormatieren({menge:1,menge_bis:2,einheit:"EL"}, 1), "1–2 EL");

// --- 2b. Rundungsregeln aus T-0003 ------------------------------------
pruefe("g/ml ab 10 ganzzahlig", P.dezimalRunden(133.333), 133);
pruefe("g/ml unter 10 eine Nachkommastelle", P.dezimalRunden(9.44), 9.4);
pruefe("g/ml Grenzfall 10", P.dezimalRunden(10), 10);
pruefe("g/ml rundet ueber die Grenze", P.dezimalRunden(9.96), 10);
pruefe("Bruch 1,5", P.bruchFormatieren(1.5), "1½");
pruefe("Bruch 0,75", P.bruchFormatieren(0.75), "¾");
pruefe("Bruch 2,25", P.bruchFormatieren(2.25), "2¼");
pruefe("Bruch 1,333", P.bruchFormatieren(4/3), "1⅓");
pruefe("Bruch ganze Zahl bleibt ganz", P.bruchFormatieren(3), "3");
pruefe("Bruch rundet 0,9 auf 1 auf", P.bruchFormatieren(0.9), "1");
pruefe("Bruch faellt nicht auf 0", P.bruchFormatieren(0.1), "¼");
pruefe("Bruch 0 bleibt 0", P.bruchFormatieren(0), "0");
pruefe("Einheiten-Klassifikation", [P.istBruchEinheit("EL"), P.istBruchEinheit("Zehe"), P.istBruchEinheit("g"), P.istBruchEinheit("ml")], [true, true, false, false]);
pruefe("Portionsoptionen zu Basis 4", P.portionsOptionen(4), [2,4,6,8]);
pruefe("Portionsoptionen zu Basis 6", P.portionsOptionen(6), [3,6,9,12]);
pruefe("Portionsoptionen zu Basis 3 (keine halben)", P.portionsOptionen(3), [3,6]);
pruefe("Portionsoptionen zu Basis 1", P.portionsOptionen(1), [1,2]);

// --- 2c. Skalierung am echten Rezept ----------------------------------
function menge(id, portionen) {
  var z = rezept.zutaten.find(function (x) { return x.id === id; });
  return P.mengeFormatieren(z, portionen / rezept.portionen);
}
pruefe("2 Portionen: Gewicht halbiert", menge("z-zwiebeln", 2), "100 g");
pruefe("2 Portionen: Volumen halbiert", menge("z-bruehe", 2), "600 ml");
pruefe("2 Portionen: TL als Bruch", menge("z-salz", 2), "¾ TL");
pruefe("2 Portionen: Stueck-Einheit als Bruch", menge("z-thymian", 2), "1½ Stiel");
pruefe("2 Portionen: Spanne skaliert mit", menge("z-essig", 2), "½–1 EL");
pruefe("6 Portionen: TL als Bruch", menge("z-salz", 6), "2¼ TL");
pruefe("6 Portionen: Volumen", menge("z-bruehe", 6), "1800 ml");
pruefe("6 Portionen: Spanne", menge("z-essig", 6), "1½–3 EL");
pruefe("8 Portionen: glatte Zehen", menge("z-knoblauch", 8), "4 Zehe");
pruefe("skalieren:false bleibt fix (2)", menge("z-lorbeer", 2), "2 Blatt");
pruefe("skalieren:false bleibt fix (8)", menge("z-lorbeer", 8), "2 Blatt");
pruefe("mengenlose Zutat bleibt leer", menge("z-pfeffer", 8), "");

// Keine Zutat darf bei irgendeiner Portionszahl NaN/undefined liefern.
var schrott = [];
P.portionsOptionen(rezept.portionen).forEach(function (p) {
  rezept.zutaten.forEach(function (z) {
    var t = P.mengeFormatieren(z, p / rezept.portionen);
    if (typeof t !== "string" || t.indexOf("NaN") > -1 || t.indexOf("undefined") > -1) {
      schrott.push(p + " Portionen / " + z.id + " -> " + t);
    }
  });
});
pruefe("alle Zutaten bei allen Portionszahlen sauber", schrott, []);

// --- 2d. Kochmodus (T-0004), DOM-freier Teil --------------------------
var stufen = K.kochSchritteBauen(m);
pruefe("Kochmodus: eine Stufe je Schritt", stufen.length, 6);
pruefe("Kochmodus: neue Zutaten je Stufe",
  stufen.map(function (s) { return s.eigeneZeilen.length; }),
  [3, 3, 1, 4, 0, 4]);
pruefe("Kochmodus: Stufe 1 hebt genau ihre Zeilen hervor",
  stufen[0].eigeneZeilen, [0, 1, 2]);
pruefe("Kochmodus: Stufe 4 hebt nur die neuen hervor, nicht den ganzen Block",
  [stufen[3].eigeneZeilen, stufen[3].imTopfZeilen],
  [[7, 8, 9, 10], [0, 1, 2, 3, 4, 5, 6]]);
// Der Schritt ohne neue Zutaten: nichts hervorzuheben, alles ist im Topf.
pruefe("Kochmodus: Stufe ohne neue Zutaten",
  [stufen[4].eigeneZeilen.length, stufen[4].imTopfZeilen.length], [0, 11]);
// Letzte Stufe: neue Zutaten + alles davor, zusammen die vollen 15 Zeilen.
pruefe("Kochmodus: letzte Stufe deckt alle Zeilen ab",
  stufen[5].eigeneZeilen.length + stufen[5].imTopfZeilen.length, 15);
// Keine Zeile darf gleichzeitig "neu" und "im Topf" sein.
var doppelt = stufen.filter(function (s) {
  return s.eigeneZeilen.some(function (r) { return s.imTopfZeilen.indexOf(r) > -1; });
});
pruefe("Kochmodus: neu und im-Topf ueberschneiden sich nie", doppelt.length, 0);

pruefe("Uhr 35 Min", K.zeitFormatieren(2100), "35:00");
pruefe("Uhr 6 Min", K.zeitFormatieren(360), "6:00");
pruefe("Uhr unter einer Minute", K.zeitFormatieren(45), "0:45");
pruefe("Uhr ueber einer Stunde", K.zeitFormatieren(3900), "1:05:00");
pruefe("Uhr bei 0", K.zeitFormatieren(0), "0:00");
pruefe("Uhr wird nicht negativ", K.zeitFormatieren(-5), "0:00");

// --- 2c2. Countdown haengt an der Wanduhr (T-0045) --------------------
// Bis T-0045 zaehlte der Timer Ticks. Im gedrosselten Hintergrund-Tab
// feuert setInterval nur noch etwa einmal pro Minute — die Uhr blieb
// dann fast stehen, waehrend das Essen im Topf weiterlief. Gemessen am
// echten Modul: nach 400 s Wanduhr auf einer 360-s-Stufe standen noch
// 5:54 auf der Uhr. Deshalb wird hier nicht der Quelltext geprueft,
// sondern die Rechnung mit gestellter Uhr durchgespielt.
var jetzt = 1000000000000;
function uhrStellen() { return jetzt; }
function warten(sekunden) { jetzt += sekunden * 1000; }

var cd = K.countdownBauen(uhrStellen);
cd.setzen(60);
pruefe("Countdown: gesetzt, steht", [cd.stand(), cd.laeuft()], [60, false]);
cd.starten();
warten(10);
pruefe("Countdown: nach 10 s laeuft er und zeigt 50", [cd.stand(), cd.laeuft()], [50, true]);

// Der Kern des Befunds: KEIN Tick dazwischen, nur Wanduhr.
warten(70);
pruefe("Countdown: 80 s auf 60-s-Stufe ohne Tick -> abgelaufen",
  [cd.stand(), cd.laeuft()], [0, false]);

// Pause haelt die Zeit an, auch wenn die Wanduhr weiterlaeuft.
var cd2 = K.countdownBauen(uhrStellen);
cd2.setzen(300);
cd2.starten();
warten(120);
cd2.pausieren();
warten(600);
pruefe("Countdown: Pause haelt an, Wanduhr laeuft weiter",
  [cd2.stand(), cd2.laeuft()], [180, false]);
cd2.starten();
warten(60);
pruefe("Countdown: nach Pause laeuft er ab dem gehaltenen Rest weiter",
  cd2.stand(), 120);

// Abgelaufen + Start = wieder von vorn (Knopf "Neu").
var cd3 = K.countdownBauen(uhrStellen);
cd3.setzen(45);
cd3.starten();
warten(200);
pruefe("Countdown: abgelaufen", cd3.stand(), 0);
cd3.starten();
pruefe("Countdown: Neustart nach Ablauf beginnt bei der vollen Dauer", cd3.stand(), 45);

// Stufe ohne Zeit bleibt ohne Zeit, egal was gedrueckt wird.
var cd4 = K.countdownBauen(uhrStellen);
cd4.setzen(null);
cd4.starten();
warten(500);
pruefe("Countdown: Stufe ohne dauer_s hat keine Uhr",
  [cd4.stand(), cd4.laeuft()], [null, false]);

// --- 2d2. Spaltenzuordnung (T-0030) -----------------------------------
// Stufen teilen sich eine Spalte, wenn ihre Zeilenbloecke sich nicht
// ueberschneiden — so stehen parallele Straenge nebeneinander.
function spaltenPruefen(name, rezept, erwarteteSpalten) {
  var m = G.gridModellBauen(rezept);
  var maengel = [];

  if (m.spaltenAnzahl !== erwarteteSpalten) {
    maengel.push(m.spaltenAnzahl + " Spalten statt " + erwarteteSpalten);
  }

  var nachId = {};
  m.spalten.forEach(function (s) { nachId[s.schritt.id] = s; });

  m.spalten.forEach(function (s) {
    // Eine Stufe steht rechts von allen ihren Vorstufen.
    (s.vorstufen || []).forEach(function (vid) {
      var vor = nachId[vid];
      if (vor && vor.spalte >= s.spalte) {
        maengel.push(s.schritt.id + " steht nicht rechts von " + vid);
      }
    });
    // In derselben Spalte darf sich kein Zeilenblock ueberschneiden.
    m.spalten.forEach(function (t) {
      if (t === s || t.spalte !== s.spalte) return;
      if (!(s.bis < t.von || s.von > t.bis)) {
        maengel.push(s.schritt.id + " und " + t.schritt.id + " ueberschneiden sich in Spalte " + s.spalte);
      }
    });
  });

  pruefe("Spalten " + name, maengel, []);
}

// Lineare Rezepte: jede Stufe behaelt ihre eigene Spalte.
spaltenPruefen("linear (Linsen-Eintopf)", rezept, 6);
// Paralleler Strang: die Fuellung steht neben der RUHEZEIT, nicht neben
// dem Kneten (T-0032). Beides mit den Haenden gleichzeitig geht nicht.
var maultaschen = JSON.parse(fs.readFileSync(path.join(wurzel, "rezepte/maultaschen.json"), "utf8"));
spaltenPruefen("parallel (Maultaschen)", maultaschen, 4);
pruefe("Maultaschen: Fuellung steht neben der Ruhezeit, nicht neben dem Kneten",
  (function () {
    var m = G.gridModellBauen(maultaschen);
    function sp(id) { return m.spalten.find(function (s) { return s.schritt.id === id; }); }
    return [sp("s-teig").spalte, sp("s-teig-ruhen").spalte, sp("s-fuellung").spalte];
  })(), [0, 1, 1]);
pruefe("Maultaschen: Startzeiten im Modell folgen dem Einpersonen-Plan",
  (function () {
    var m = G.gridModellBauen(maultaschen);
    return m.spalten.map(function (s) { return s.start; });
  })(), [0, 600, 600, 2400, 3600]);
// Der eigentliche Befund: keine zwei beaufsichtigten Stufen zur gleichen
// Zeit. Genau das war vorher im Bild — 15 Min Fuellung neben 10 Min
// Kneten. Gilt fuer jedes Rezept, nicht nur fuer die Maultaschen.
function haendePruefen(name, rezept) {
  var m = G.gridModellBauen(rezept);
  var maengel = [];
  m.spalten.forEach(function (a, i) {
    if (a.schritt.unbeaufsichtigt) return;
    m.spalten.forEach(function (b, j) {
      if (j <= i || b.schritt.unbeaufsichtigt) return;
      if (a.start < b.ende && b.start < a.ende) {
        maengel.push(a.schritt.id + " und " + b.schritt.id + " brauchen gleichzeitig die Haende");
      }
    });
  });
  pruefe("Zwei Haende " + name, maengel, []);
}
haendePruefen("(Maultaschen)", maultaschen);
haendePruefen("(Linsen-Eintopf)", rezept);

// Isomorphie-Check zu T-0032: der Kochmodus laeuft die Stufen in der
// Reihenfolge des JSON durch und kennt den Zeitplan nicht. Solange die
// Startzeiten in dieser Reihenfolge nicht zurueckspringen, ist das
// dieselbe Reihenfolge. Ein paralleler Strang, der im JSON zu frueh
// steht, wuerde den Kochmodus sonst still in die falsche Folge schicken.
function kochfolgePruefen(name, rezept) {
  var m = G.gridModellBauen(rezept);
  var maengel = [];
  m.spalten.forEach(function (s, i) {
    if (i > 0 && s.start < m.spalten[i - 1].start) {
      maengel.push(s.schritt.id + " beginnt vor " + m.spalten[i - 1].schritt.id +
                   ", steht im JSON aber dahinter");
    }
  });
  pruefe("Kochmodus-Reihenfolge " + name, maengel, []);
}
kochfolgePruefen("(Maultaschen)", maultaschen);

// --- 2e. Zeitmass (T-0020) --------------------------------------------
// Die Spaltenbreiten sind Prozentwerte an der Mindestbreite. Drei
// Eigenschaften muessen fuer JEDES Rezept gelten, sonst ist entweder eine
// Stufe unlesbar schmal oder eine dominiert die Tabelle.
function zeitmassPruefen(name, dauern) {
  var n = dauern.length;
  var breite = Z.noetigeBreite(n);
  var b = Z.spaltenbreiten(dauern, breite);
  var px = b.stufen.map(function (a) { return a * breite; });
  var maengel = [];

  var summe = b.stufen.reduce(function (a, x) { return a + x; }, 0);
  var soll = 1 - Z.ZUTATEN[0] - Z.ZUTATEN[1];
  if (Math.abs(summe - soll) > 0.001) maengel.push("Summe " + summe.toFixed(4) + " statt " + soll);

  // T-0039: auf schmalen Schirmen pinnt stil.css die Zutatenspalten auf
  // feste Pixel, und der Browser holt sich den Platz bei den
  // Prozentspalten. Die Mindestbreite muss das aushalten — sonst
  // rutschen die Stufen unter MIN_PX und die Titel werden unlesbar.
  var nachPinnen = (breite - Z.ZUTATEN_MIN_PX[0] - Z.ZUTATEN_MIN_PX[1]) / n;
  if (nachPinnen < Z.MIN_PX - 0.5) {
    maengel.push("nach dem Pinnen der Zutatenspalten nur " + nachPinnen.toFixed(1)
                 + " px je Stufe, noetig " + Z.MIN_PX);
  }

  var schmalste = Math.min.apply(null, px);
  if (schmalste < Z.MIN_PX - 0.5) maengel.push("schmalste Spalte " + schmalste.toFixed(1) + " px < " + Z.MIN_PX);

  // Der wirksame Deckel ist nie schaerfer als der Gleichanteil: bei drei
  // Spalten sind 26 % je Spalte unvermeidlich, bei einer sind es 78 %.
  var wirksamerDeckel = Math.max(Z.DECKEL, soll / n);
  var breiteste = Math.max.apply(null, b.stufen);
  if (breiteste > wirksamerDeckel + 0.001) {
    maengel.push("breiteste Spalte " + (breiteste * 100).toFixed(1) + " % > Deckel " + (wirksamerDeckel * 100).toFixed(1) + " %");
  }

  // Laengere Dauer darf nie zu einer schmaleren Spalte fuehren.
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      if ((dauern[i] || 0) > (dauern[j] || 0) && px[i] < px[j] - 0.5) {
        maengel.push("Stufe " + i + " dauert laenger als " + j + ", ist aber schmaler");
      }
    }
  }
  pruefe("Zeitmass " + name, maengel, []);
}

zeitmassPruefen("Linsen-Eintopf", [360, 300, 60, 180, 2100, null]);
zeitmassPruefen("Pfannkuchen", [900, 600, 3600, 1800, 1200, null]);
zeitmassPruefen("Maultaschen", [600, 1800, 900, 1200, 900]);
zeitmassPruefen("alle ohne Dauer", [null, null, null]);
zeitmassPruefen("eine Stufe", [600]);
zeitmassPruefen("zwoelf Stufen", [60,60,60,60,60,60,60,60,60,60,60,3600]);

// Lineare Kette: Startzeiten kumulieren wie bisher.
pruefe("Zeitmass: Startzeiten kumulieren (linear)",
  Z.startzeiten([360, 300, 60, 180, 2100, null]), [0, 360, 660, 720, 900, 3000]);
// Paralleler Strang: Stufe 2 hat keine Vorstufen und beginnt bei null,
// waehrend Stufe 1 noch laeuft. Genau der Maultaschen-Fall.
pruefe("Zeitmass: paralleler Strang beginnt bei null",
  Z.startzeiten([600, 1800, 900, 1200, 900], [[], [0], [], [1, 2], [3]]),
  [0, 600, 0, 2400, 3600]);
pruefe("Zeitmass: Gesamtdauer ist der kritische Pfad, nicht die Summe",
  Z.gesamtdauer([600, 1800, 900, 1200, 900], [[], [0], [], [1, 2], [3]]), 4500);
pruefe("Zeitmass: bei linearer Kette ist beides gleich",
  Z.gesamtdauer([360, 300, 60, 180, 2100]), 3000);

// --- Freie Zeit (T-0028) ---------------------------------------------
// Nicht die Summe der unbeaufsichtigten Stufen: waehrend der Teig ruht,
// wird die Fuellung gemischt. Frei bleibt Gesamtdauer minus Arbeit.
var mtDauern = [600, 1800, 900, 1200, 900];
var mtUnbeauf = [false, true, false, false, false];
var mtVor = [[], [0], [], [1, 2], [3]];
pruefe("Freie Zeit: Maultaschen 15 statt 30 Min",
  Z.freieZeit(mtDauern, mtVor, mtUnbeauf), 900);
pruefe("Freie Zeit: Summe der unbeaufsichtigten waere 30 Min gewesen",
  mtDauern.reduce(function (a, d, i) { return a + (mtUnbeauf[i] ? d : 0); }, 0), 1800);
pruefe("Freie Zeit: Arbeit ist die Summe der beaufsichtigten Stufen",
  Z.arbeitszeit(mtDauern, mtUnbeauf), 3600);
// Laengere Parallelarbeit als Ruhezeit: nichts frei, und es dauert laenger.
var langDauern = [600, 1800, 2700, 1200, 900];
pruefe("Freie Zeit: zu lange Parallelarbeit laesst nichts frei",
  Z.freieZeit(langDauern, mtVor, mtUnbeauf), 0);
pruefe("Freie Zeit: dann waechst die Gesamtdauer ueber den kritischen Pfad",
  [Z.gesamtdauer(langDauern, mtVor), Z.realeGesamtdauer(langDauern, mtVor, mtUnbeauf)],
  [4800, 5400]);
pruefe("Freie Zeit: und das wird als 'braucht zwei Haende' gemeldet",
  [Z.braucht2Haende(mtDauern, mtVor, mtUnbeauf), Z.braucht2Haende(langDauern, mtVor, mtUnbeauf)],
  [false, true]);

// --- Einpersonen-Plan (T-0032) ---------------------------------------
// Der Plan serialisiert, was die Haende braucht. Bei den Maultaschen
// heisst das: die Fuellung faellt in die Ruhezeit, nicht auf das Kneten.
pruefe("Plan: Fuellung beginnt erst nach dem Kneten",
  Z.plan(mtDauern, mtVor, mtUnbeauf).starts, [0, 600, 600, 2400, 3600]);
pruefe("Plan: die Ruhezeit belegt die Haende nicht und startet sofort",
  Z.plan(mtDauern, mtVor, mtUnbeauf).enden, [600, 2400, 1500, 3600, 4500]);
pruefe("Plan: Gesamtdauer bleibt der kritische Pfad, wenn die Arbeit hineinpasst",
  Z.plan(mtDauern, mtVor, mtUnbeauf).gesamt, Z.gesamtdauer(mtDauern, mtVor));
// Ohne die Reihenfolge-Heuristik waere die lange Fuellung zuerst dran
// und wuerde das Ruhen um 45 Minuten verschieben — 7200 statt 5400.
pruefe("Plan: die Stufe mit dem laengsten Rest kommt zuerst dran",
  Z.plan(langDauern, mtVor, mtUnbeauf).starts, [0, 600, 600, 3300, 4500]);
// Lineare Rezepte: der Plan aendert nichts, es gab nie eine Ueberlappung.
pruefe("Plan: lineare Kette bleibt die alte Kumulation",
  Z.plan([360, 300, 60, 180, 2100, null], null, null).starts,
  Z.startzeiten([360, 300, 60, 180, 2100, null]));
// Erzwungener Leerlauf: zwei Ruhezeiten, an denen je eine Arbeit haengt.
// max(kritischer Pfad, Arbeit) waere 100 Min — der Plan sieht die 50 Min
// Leerlauf, in denen man auf die zweite Ruhezeit wartet.
var leerDauern = [3000, 3000, 3000, 3000];
var leerVor = [[], [0], [], [2]];
var leerUnbeauf = [true, false, true, false];
pruefe("Plan: erzwungener Leerlauf zaehlt zur Gesamtdauer",
  [Z.gesamtdauer(leerDauern, leerVor),
   Z.arbeitszeit(leerDauern, leerUnbeauf),
   Z.realeGesamtdauer(leerDauern, leerVor, leerUnbeauf)],
  [6000, 6000, 9000]);

// Lineare Rezepte: freie Zeit bleibt die Summe der unbeaufsichtigten.
var pkDauern = [900, 600, 3600, 1800, 1200, 0];
var pkUnbeauf = [true, false, true, true, false, false];
pruefe("Freie Zeit: bei linearem Rezept unveraendert",
  Z.freieZeit(pkDauern, null, pkUnbeauf),
  pkDauern.reduce(function (a, d, i) { return a + (pkUnbeauf[i] ? d : 0); }, 0));
// Eine Stufe ohne Dauer bekommt nie WENIGER als die Untergrenze. Mehr
// darf sie bekommen: der Ueberschuss einer gedeckelten Nachbarstufe muss
// irgendwohin, sonst verliert die Tabelle Breite.
pruefe("Zeitmass: Stufe ohne Dauer faellt nicht unter die Untergrenze",
  Math.round(Z.spaltenbreiten([2100, null], Z.noetigeBreite(2)).stufen[1] * Z.noetigeBreite(2)) >= Z.MIN_PX, true);
// Und sie ist nie breiter als eine Stufe, die tatsaechlich Zeit braucht.
pruefe("Zeitmass: Stufe ohne Dauer ueberholt keine mit Dauer",
  (function () {
    var b = Z.spaltenbreiten([2100, 600, null], Z.noetigeBreite(3));
    return b.stufen[2] <= b.stufen[1] + 0.001 && b.stufen[1] <= b.stufen[0] + 0.001;
  })(), true);
// Mindestbreite waechst mit der Stufenzahl — sonst scrollt nichts.
pruefe("Zeitmass: Mindestbreite steigt mit der Stufenzahl",
  [Z.noetigeBreite(3) < Z.noetigeBreite(6), Z.noetigeBreite(6) < Z.noetigeBreite(12)], [true, true]);

// --- Untergrenze der Zutatenspalten (T-0039) --------------------------
// Der Fehler war, dass es sie nur fuer die Stufenspalten gab. Anteile
// sind geraeteblind: 6 % von 493 px sind 30, "400 g" braucht 48.
pruefe("Zutaten: Untergrenze plus MIN_PX je Stufe passen in die Tabelle",
  [2, 3, 4, 6, 12].map(function (n) {
    return Z.noetigeBreite(n) >= n * Z.MIN_PX + Z.ZUTATEN_MIN_PX[0] + Z.ZUTATEN_MIN_PX[1];
  }), [true, true, true, true, true]);
// Und die Untergrenze darf das breite Bild nicht anfassen: ab vier
// Stufen — alles, was der Bestand hat — bleibt die Mindestbreite exakt
// die von vor T-0039. Sonst verschieben sich die Stufenbreiten, und
// genau das soll die CSS-Loesung vermeiden.
pruefe("Zutaten: Mindestbreite ab vier Stufen unveraendert",
  [4, 5, 6, 12].map(function (n) {
    var alt = Math.ceil((n * Z.MIN_PX) / ((1 - Z.ZUTATEN[0] - Z.ZUTATEN[1]) * 0.75));
    return Z.noetigeBreite(n) === alt;
  }), [true, true, true, true]);
// Die Untergrenze darf die Tabelle nicht aufblaehen: ueber den Anteil
// gefordert (56 px muessen 6 % sein) kaeme sie schon bei drei Stufen auf
// 934 px statt 448 — dreimal so viel Querscrollen wie noetig.
pruefe("Zutaten: Untergrenze blaeht die Tabelle nicht auf",
  Z.noetigeBreite(3) < Z.ZUTATEN_MIN_PX[0] / Z.ZUTATEN[0], true);
// Auf breiten Schirmen zaehlt wieder der Anteil, nicht die Pixelgrenze.
// Genau diese Umschaltung macht das CSS-max() in render.js.
pruefe("Zutaten: Anteil schlaegt die Pixelgrenze, sobald Platz da ist",
  [1400 * Z.ZUTATEN[0] > Z.ZUTATEN_MIN_PX[0],
   1400 * Z.ZUTATEN[1] > Z.ZUTATEN_MIN_PX[1]], [true, true]);
// Und die laengste Menge im Bestand muss hineinpassen. Gemessen wurden
// 48 px fuer "400 g" bei 13 px Schrift; die Grenze hat Luft fuer Polster.
pruefe("Zutaten: Untergrenze deckt die gemessene Textbreite",
  [Z.ZUTATEN_MIN_PX[0] >= 48, Z.ZUTATEN_MIN_PX[1] >= 91], [true, true]);

// --- 2f. Einkaufsliste (T-0026) ---------------------------------------
var EK = globalThis.RezeptEinkauf;
function ladeRezept(id) {
  return JSON.parse(fs.readFileSync(path.join(wurzel, "rezepte/" + id + ".json"), "utf8"));
}
function posten(liste, name, einheit) {
  return liste.filter(function (p) {
    return p.name === name && (einheit === undefined || p.einheit === einheit);
  });
}

var sp = ladeRezept("spaetzle"), mt = ladeRezept("maultaschen");
var liste = EK.listeBauen([
  { rezept: sp, portionen: 4 },
  { rezept: mt, portionen: 4 }
]);

pruefe("Einkauf: gleicher Name + gleiche Einheit werden addiert",
  posten(liste, "Butter", "g")[0].menge, 50);
pruefe("Einkauf: Eier aus beiden Rezepten zusammen",
  posten(liste, "Eier", null)[0].menge, 9);
pruefe("Einkauf: Wasser bleibt getrennt (skaliert vs. fix)",
  posten(liste, "Wasser").map(function (p) { return [p.einheit, p.menge, p.fix]; }),
  [["ml", 100, false], ["l", 4, true]]);
pruefe("Einkauf: mengenlose Zutat einmal, ohne Menge",
  (function () {
    var m = posten(liste, "Muskatnuss");
    return [m.length, m[0].mengenlos, m[0].quellen.length];
  })(), [1, true, 2]);
pruefe("Einkauf: jeder Posten kennt seine Rezepte",
  posten(liste, "Butter", "g")[0].quellen.sort(), ["Maultaschen", "Spätzle"]);
pruefe("Einkauf: alphabetisch sortiert",
  liste.map(function (p) { return p.name; }).join("|") ===
  liste.map(function (p) { return p.name; }).sort(function (a, b) {
    return a.localeCompare(b, "de");
  }).join("|"), true);

// Portionen wirken: doppelte Portionszahl verdoppelt die skalierten Mengen,
// laesst die festen aber stehen.
var doppelt = EK.listeBauen([{ rezept: sp, portionen: 8 }]);
var einfach = EK.listeBauen([{ rezept: sp, portionen: 4 }]);
pruefe("Einkauf: Portionen verdoppeln die skalierte Menge",
  [posten(einfach, "Spätzlemehl", "g")[0].menge, posten(doppelt, "Spätzlemehl", "g")[0].menge],
  [400, 800]);
pruefe("Einkauf: feste Menge bleibt bei Portionswechsel gleich",
  [posten(einfach, "Wasser", "l")[0].menge, posten(doppelt, "Wasser", "l")[0].menge],
  [4, 4]);
// Dasselbe Rezept zweimal mit fester Menge: kein Aufsummieren.
pruefe("Einkauf: feste Mengen werden nicht summiert, nur das Maximum zaehlt",
  posten(EK.listeBauen([
    { rezept: sp, portionen: 4 }, { rezept: sp, portionen: 8 }
  ]), "Wasser", "l")[0].menge, 4);

pruefe("Einkauf: Auswahl aus der URL lesen",
  EK.auswahlLesen("spaetzle:8,maultaschen"),
  [{ id: "spaetzle", portionen: 8 }, { id: "maultaschen", portionen: null }]);
pruefe("Einkauf: Auswahl in die URL schreiben",
  EK.auswahlSchreiben([{ id: "spaetzle", portionen: 8 }, { id: "maultaschen", portionen: null }]),
  "spaetzle:8,maultaschen");
pruefe("Einkauf: leere Auswahl ergibt leere Liste", EK.listeBauen([]), []);

// --- 3. Fehlerfaelle werden gemeldet, nicht geworfen ------------------
var kaputt = {
  zutaten: [{id:"z-a",name:"A",menge:1,einheit:"g"},{id:"z-b",name:"B",menge:1,einheit:"g"},{id:"z-x",name:"Unbenutzt",menge:1,einheit:"g"}],
  schritte: [
    {id:"s1",titel:"eins",anweisung:"",dauer_s:60,zutaten:["z-a"],vorstufen:[]},
    {id:"s2",titel:"zwei",anweisung:"",dauer_s:60,zutaten:["z-a","z-b","z-fehlt"],vorstufen:["s1"]},
    {id:"s3",titel:"drei",anweisung:"",dauer_s:null,zutaten:[],vorstufen:["s-gibts-nicht"]}
  ]
};
var mk = G.gridModellBauen(kaputt);
// 5 = doppelte Zutat, unbekannte Zutat, unbenutzte Zutat, unbekannte
// Vorstufe + die Folgemeldung, dass s3 dadurch keinen Block mehr hat.
pruefe("kaputtes Rezept: 5 Probleme gemeldet", mk.probleme.length, 5);
pruefe("kaputtes Rezept: rendert trotzdem Zeilen", mk.zeilen.length, 3);

// --- 4. Nicht-linear wird als solcher erkannt (T-0008) ----------------
var parallel = {
  zutaten: [{id:"z-1",name:"1",menge:1,einheit:"g"},{id:"z-2",name:"2",menge:1,einheit:"g"},{id:"z-3",name:"3",menge:1,einheit:"g"}],
  schritte: [
    {id:"a",titel:"a",anweisung:"",dauer_s:60,zutaten:["z-1"],vorstufen:[]},
    {id:"b",titel:"b",anweisung:"",dauer_s:60,zutaten:["z-2"],vorstufen:[]},
    {id:"c",titel:"c",anweisung:"",dauer_s:60,zutaten:["z-3"],vorstufen:["a"]}
  ]
};
var mp = G.gridModellBauen(parallel);
pruefe("nicht-linear: genau 1 Zusammenhangs-Problem",
  mp.probleme.filter(function (p) { return p.indexOf("zusammenhaengenden") > -1; }).length, 1);

// --- 4b. Vorstufen-Normalisierung, eine Quelle (T-0049) ---------------
// Die Regel "fehlendes `vorstufen` = unmittelbarer Vorgaenger" stand in
// vier Dateien. Diese Pruefung haelt fest, dass alle Wege dieselbe Kette
// sehen — sie ist die Alarmanlage gegen ein Wiederauseinanderlaufen.
(function () {
  function schritt(id, vorstufen) {
    var s = { id: id, titel: id, anweisung: "", dauer_s: 60, zutaten: ["z-" + id] };
    if (vorstufen !== undefined) s.vorstufen = vorstufen;
    return s;
  }
  function rezept(schritte) {
    return {
      id: "t", titel: "t", portionen: 1, zeit_aktiv_s: null, zeit_gesamt_s: null,
      zutaten: schritte.map(function (s) {
        return { id: "z-" + s.id, name: s.id, menge: 1, einheit: "g" };
      }),
      schritte: schritte
    };
  }

  // Ganz ohne vorstufen-Feld: lineare Kette.
  var ohne = rezept([schritt("a"), schritt("b"), schritt("c")]);
  pruefe("Vorstufen: ID-Form ohne Feld ist die lineare Kette",
    Z.vorstufenIds(ohne.schritte), [[], ["a"], ["b"]]);
  pruefe("Vorstufen: Indexform ohne Feld ist die lineare Kette",
    Z.vorstufenIndizes(ohne.schritte), [[], [0], [1]]);
  pruefe("Vorstufen: grid.js uebernimmt dieselbe Kette",
    G.gridModellBauen(ohne).spalten.map(function (sp) { return sp.vorstufen; }),
    [[], ["a"], ["b"]]);
  pruefe("Vorstufen: zeitmass rechnet dieselbe Kette (3x60 s hintereinander)",
    Z.gesamtdauer([60, 60, 60], Z.vorstufenIndizes(ohne.schritte)), 180);

  // Leeres Feld ist NICHT dasselbe wie fehlendes Feld.
  var leer = rezept([schritt("a"), schritt("b", []), schritt("c", ["a", "b"])]);
  pruefe("Vorstufen: leeres Feld heisst 'faengt neu an', nicht 'Vorgaenger'",
    Z.vorstufenIndizes(leer.schritte), [[], [], [0, 1]]);
  pruefe("Vorstufen: zeitmass laesst die beiden parallel laufen",
    Z.gesamtdauer([60, 60, 60], Z.vorstufenIndizes(leer.schritte)), 120);

  // Unbekannte ID: die ID-Form behaelt sie (grid.js meldet sie),
  // die Indexform wirft sie weg (sie laesst sich nicht rechnen).
  var kaputt = rezept([schritt("a"), schritt("b", ["gibts-nicht"])]);
  pruefe("Vorstufen: unbekannte ID bleibt in der ID-Form",
    Z.vorstufenIds(kaputt.schritte), [[], ["gibts-nicht"]]);
  pruefe("Vorstufen: unbekannte ID faellt aus der Indexform",
    Z.vorstufenIndizes(kaputt.schritte), [[], []]);
  pruefe("Vorstufen: grid.js meldet die unbekannte ID",
    G.gridModellBauen(kaputt).probleme.filter(function (pr) {
      return pr.indexOf("gibts-nicht") > -1;
    }).length, 1);
})();

// --- 5. Alle Rezepte gegen die Schema-Regeln --------------------------
// Laeuft ueber rezepte/*.json, nicht nur ueber das Beispiel. Damit faellt
// auf, wenn ein neu konvertiertes Rezept das Schema verletzt (Teil von
// T-0011).
var rezeptOrdner = path.join(wurzel, "rezepte");
var dateien = fs.readdirSync(rezeptOrdner).filter(function (d) { return d.endsWith(".json"); }).sort();
pruefe("mindestens zwei Rezepte vorhanden", dateien.length >= 2, true);

// Die Vorlage unter tools/testdaten/ haengt mit dran (T-0046). Sie ist
// der Anker der Abschnitte 1 bis 3, wurde aber selbst nie gegen das
// Schema gehalten — und war falsch: zeit_gesamt_s 3900, waehrend der
// eigene Plan bei 3000 endet und der eigene Untertitel "50 Minuten"
// sagt. Eine Vorlage, die sich selbst widerspricht, ist ein schlechter
// Anker. `dateien` bleibt unveraendert, die Manifest-Pruefung weiter
// unten darf die Testdatei nicht sehen.
var zuPruefen = dateien.map(function (d) {
  return { ordner: rezeptOrdner, datei: d };
}).concat([
  { ordner: path.join(wurzel, "tools/testdaten"), datei: "linsen-eintopf.json" }
]);

zuPruefen.forEach(function (eintrag) {
  var datei = eintrag.datei;
  var r = JSON.parse(fs.readFileSync(path.join(eintrag.ordner, datei), "utf8"));
  var name = datei.replace(".json", "");
  var maengel = [];

  if (r.id !== name) maengel.push('id "' + r.id + '" passt nicht zum Dateinamen');
  if (!r.portionen || r.portionen < 1) maengel.push("portionen fehlt oder ist < 1");

  // Einheiten gegen ein festes Vokabular. Ein Tippfehler wie "Zehen"
  // statt "Zehe" faellt sonst nirgends auf: die Einheit ist dann keine
  // Bruch-Einheit mehr und die Menge laeuft still in die Dezimalrundung —
  // aus "1½ Zehe" wird "1,5 Zehen".
  var ERLAUBTE_EINHEITEN = ["g", "kg", "ml", "l", "EL", "TL", "Msp", "Prise",
    "Stueck", "Stück", "Zehe", "Blatt", "Stiel", "Zweig", "Bund", "Dose",
    "Packung", "Scheibe", "Handvoll"];

  var ids = {};
  r.zutaten.forEach(function (z) {
    if (z.einheit && ERLAUBTE_EINHEITEN.indexOf(z.einheit) === -1) {
      maengel.push('"' + z.id + '": Einheit "' + z.einheit + '" steht nicht im Vokabular');
    }
    if (ids[z.id]) maengel.push('Zutaten-ID "' + z.id + '" doppelt');
    ids[z.id] = true;
    if ((z.menge === null || z.menge === undefined) && z.einheit) {
      maengel.push('"' + z.id + '": ohne Menge, aber mit Einheit');
    }
    if (z.menge_bis !== undefined && z.menge_bis !== null) {
      if (z.menge === null || z.menge === undefined) maengel.push('"' + z.id + '": menge_bis ohne menge');
      else if (z.menge_bis <= z.menge) maengel.push('"' + z.id + '": menge_bis nicht groesser als menge');
    }
  });

  var schrittIds = {};
  r.schritte.forEach(function (s, i) {
    if (schrittIds[s.id]) maengel.push('Schritt-ID "' + s.id + '" doppelt');
    schrittIds[s.id] = true;
    if (!s.titel) maengel.push('Schritt "' + s.id + '" ohne titel');
    if (!("dauer_s" in s)) maengel.push('Schritt "' + s.id + '" ohne dauer_s');
    (s.vorstufen || []).forEach(function (v) {
      var davor = r.schritte.slice(0, i).some(function (x) { return x.id === v; });
      if (!davor) maengel.push('Schritt "' + s.id + '": Vorstufe "' + v + '" steht nicht davor');
    });
  });

  // Layout muss ohne Beanstandung durchlaufen.
  var mm = G.gridModellBauen(r);
  mm.probleme.forEach(function (p) { maengel.push("Layout: " + p); });

  // Und der Zeitplan muss fuer eine Person aufgehen (T-0032): keine zwei
  // beaufsichtigten Stufen gleichzeitig, und die JSON-Reihenfolge darf
  // der Reihenfolge des Plans nicht widersprechen (Kochmodus).
  mm.spalten.forEach(function (a, i) {
    if (i > 0 && a.start < mm.spalten[i - 1].start) {
      maengel.push("Zeitplan: " + a.schritt.id + " beginnt vor " +
                   mm.spalten[i - 1].schritt.id + ", steht im JSON aber dahinter");
    }
    if (a.schritt.unbeaufsichtigt) return;
    mm.spalten.forEach(function (b, j) {
      if (j <= i || b.schritt.unbeaufsichtigt) return;
      if (a.start < b.ende && b.start < a.ende) {
        maengel.push("Zeitplan: " + a.schritt.id + " und " + b.schritt.id +
                     " brauchen gleichzeitig die Haende");
      }
    });
  });

  // zeit_gesamt_s muss zum Einpersonen-Plan passen. Zu klein ist
  // unmoeglich — und die Untergrenze ist seit T-0032 der Plan, nicht der
  // kritische Pfad: der Pfad laesst zwei beaufsichtigte Stufen parallel
  // laufen und ist deshalb zu optimistisch. Deutlich zu gross heisst
  // meistens: jemand hat die Dauern stumpf addiert und die parallelen
  // Straenge uebersehen.
  //
  // Die Obergrenze hing bis T-0046 an `allein < summe` und griff deshalb
  // NUR bei Rezepten mit parallelen Straengen. Bei einem linearen Rezept
  // ist `allein === summe`, die Bedingung nie wahr — und jede beliebig
  // grosse Zahl lief durch. So kamen Pfannkuchen (10800 gegen Plan 8100)
  // und der Linsen-Eintopf (3900 gegen 3000, waehrend der eigene
  // Untertitel "50 Minuten" sagt) durch alle 137 gruenen Pruefungen.
  //
  // Jetzt gilt die Obergrenze immer. Asymmetrisch mit Absicht: weniger
  // als der Plan ist physikalisch unmoeglich und bleibt hart verboten,
  // mehr als der Plan ist plausibler Puffer (Ofen vorheizen, Anrichten)
  // und bekommt 10 % Luft. Der Eierkuchen braucht sie: 3600 gegen Plan
  // 3570 ist eine ehrliche Rundung auf die volle Stunde.
  var vorstufen = Z.vorstufenIndizes(r.schritte);
  var dauern = r.schritte.map(function (s) { return s.dauer_s; });
  var unbeauf = r.schritte.map(function (s) { return !!s.unbeaufsichtigt; });
  var allein = Z.realeGesamtdauer(dauern, vorstufen, unbeauf);
  var summe = dauern.reduce(function (a, d) { return a + (d || 0); }, 0);
  var TOLERANZ_OBEN = 0.10;
  if (r.zeit_gesamt_s && r.zeit_gesamt_s < allein) {
    maengel.push("zeit_gesamt_s " + r.zeit_gesamt_s + " < Einpersonen-Plan " + allein);
  }
  var obergrenze = Math.round(allein * (1 + TOLERANZ_OBEN));
  if (r.zeit_gesamt_s && r.zeit_gesamt_s > obergrenze) {
    maengel.push("zeit_gesamt_s " + r.zeit_gesamt_s + " > Einpersonen-Plan " + allein +
                 " + " + Math.round(TOLERANZ_OBEN * 100) + " % (max " + obergrenze + ")" +
                 (allein < summe
                   ? " — sieht nach stumpf addierten Dauern aus (Summe " + summe + ")"
                   : ""));
  }

  // Und die drei Kacheln im Kopf duerfen zusammen nicht mehr ergeben als
  // das Ganze (T-0053). Der Leser sieht "Arbeit", "ohne Zutun" und
  // "gesamt" nebeneinander und addiert die ersten beiden — beim
  // Pfannkuchen kamen 45 Min + 1 Std 45 Min = 2 Std 30 Min heraus,
  // waehrend daneben 2 Std 15 Min stand.
  //
  // Die Ursache ist, dass die beiden Zahlen aus verschiedenen Quellen
  // kommen: "Arbeit" aus dem JSON-Feld, "ohne Zutun" aus dem gerechneten
  // Plan. Solange ein Arbeitsschritt `dauer_s: null` hat, kann das
  // auseinanderlaufen, ohne dass eine der Einzelpruefungen anschlaegt —
  // beide Werte sind fuer sich plausibel.
  var frei = Z.freieZeit(dauern, vorstufen, unbeauf);
  if (r.zeit_aktiv_s && r.zeit_gesamt_s && r.zeit_aktiv_s + frei > r.zeit_gesamt_s) {
    maengel.push("Kennzahlen widersprechen sich: zeit_aktiv_s " + r.zeit_aktiv_s +
                 " + freie Zeit " + frei + " = " + (r.zeit_aktiv_s + frei) +
                 " > zeit_gesamt_s " + r.zeit_gesamt_s +
                 " (Arbeitsschritt ohne dauer_s?)");
  }

  // zeit_aktiv_s stand bis T-0046 ueberhaupt nicht im Pruefskript, obwohl
  // docs/schema.md und docs/konvertierung.md dafuer eine Untergrenze
  // nennen. Dieselbe Fehlerklasse wie oben, ein Feld weiter: eine
  // Kennzahl im Rezeptkopf, die niemand gegen den Plan haelt.
  var betreut = r.schritte.reduce(function (a, s2) {
    return a + (s2.unbeaufsichtigt ? 0 : (s2.dauer_s || 0));
  }, 0);
  if (r.zeit_aktiv_s !== null && r.zeit_aktiv_s !== undefined) {
    if (r.zeit_aktiv_s < betreut) {
      maengel.push("zeit_aktiv_s " + r.zeit_aktiv_s +
                   " < Summe der beaufsichtigten Stufen " + betreut);
    }
    if (r.zeit_gesamt_s && r.zeit_aktiv_s > r.zeit_gesamt_s) {
      maengel.push("zeit_aktiv_s " + r.zeit_aktiv_s +
                   " > zeit_gesamt_s " + r.zeit_gesamt_s);
    }
  }

  // Und jede Menge muss bei jeder waehlbaren Portionszahl sauber sein.
  P.portionsOptionen(r.portionen).forEach(function (p) {
    r.zutaten.forEach(function (z) {
      var t = P.mengeFormatieren(z, p / r.portionen);
      if (typeof t !== "string" || /NaN|undefined/.test(t)) {
        maengel.push(p + " Portionen / " + z.id + " -> " + t);
      }
    });
  });

  pruefe("Rezept " + datei, maengel, []);
});

// --- 5a. Manifest gegen die JSON-Dateien (T-0013) ---------------------
// Das Manifest wird von Hand angestossen. Laeuft es auseinander, faellt
// das ueber http nicht auf (dort gewinnt fetch), aber per file:// zeigt
// die App alte Daten — und die Uebersicht ein Rezept gar nicht erst an.
var manifestQuelle = fs.readFileSync(path.join(rezeptOrdner, "manifest.js"), "utf8");
var fensterAttrappe = {};
new Function("window", manifestQuelle)(fensterAttrappe);
var imManifest = fensterAttrappe.REZEPTE || {};

var manifestMaengel = [];
dateien.forEach(function (datei) {
  var id = datei.replace(".json", "");
  if (!imManifest[id]) {
    manifestMaengel.push(id + " fehlt im Manifest");
    return;
  }
  var aufPlatte = fs.readFileSync(path.join(rezeptOrdner, datei), "utf8");
  if (JSON.stringify(imManifest[id]) !== JSON.stringify(JSON.parse(aufPlatte))) {
    manifestMaengel.push(id + " weicht vom Manifest ab");
  }
});
Object.keys(imManifest).forEach(function (id) {
  if (dateien.indexOf(id + ".json") === -1) manifestMaengel.push(id + " steht im Manifest, hat aber keine Datei");
});
pruefe("Manifest aktuell (sonst: node tools/build-manifest.js)", manifestMaengel, []);

// --- 5a2. Einkaufsliste im DOM (T-0044) -------------------------------
// Der Abhak-Zustand lebt nur als Klasse am Listeneintrag. Bis T-0044 warf
// der Portionswechsel die Liste weg und baute sie neu — Haken, Scroll und
// Fokus gingen mit. Hier laeuft das echte einkaufRendern gegen die
// DOM-Attrappe, weil der Fehler nur im Verhalten sichtbar ist.
(function () {
  var sp = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, "spaetzle.json"), "utf8"));
  var mt = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, "maultaschen.json"), "utf8"));
  var auswahl = [
    { rezept: sp, portionen: sp.portionen },
    { rezept: mt, portionen: mt.portionen }
  ];
  var ziel = DOM.knotenBauen("div");
  R.einkaufRendern(auswahl, ziel);

  function posten() { return ziel.querySelectorAll(".einkauf-posten"); }
  function haken() {
    return ziel.querySelectorAll(".einkauf-posten.abgehakt").map(function (li) {
      return li.querySelector(".posten-name").textContent;
    }).sort();
  }
  function menge(name) {
    var treffer = posten().filter(function (li) {
      return li.querySelector(".posten-name").textContent === name;
    })[0];
    return treffer ? treffer.querySelector(".posten-menge").textContent : null;
  }

  pruefe("Einkauf/DOM: Liste hat Posten", posten().length > 0, true);

  [0, 2, 4].forEach(function (i) { posten()[i].ausloesen("click"); });
  var vorher = haken();
  var anzahlVorher = posten().length;
  pruefe("Einkauf/DOM: drei Posten abgehakt", vorher.length, 3);
  // Spaetzlemehl kommt nur aus dem ersten Rezept und skaliert mit.
  pruefe("Einkauf/DOM: Menge bei 4 Portionen", menge("Spätzlemehl"), "400 g");

  // Portionswechsel auf 8 beim ersten Rezept (Knopf 2/4/6/8 -> Index 3).
  ziel.querySelectorAll(".portionen-knopf")[3].ausloesen("click");

  pruefe("Einkauf/DOM: Haken ueberleben den Portionswechsel", haken(), vorher);
  // Ohne diese Zeile geht ein kaputter Schluessel durch: die Liste
  // verdoppelt sich dann, statt Haken zu verlieren, und die Haken-Pruefung
  // allein bliebe gruen. Beim ersten Anlauf ist mir genau das passiert.
  pruefe("Einkauf/DOM: die Liste verdoppelt sich dabei nicht",
    posten().length, anzahlVorher);
  // Gegenprobe zum Fix selbst: die Haken duerfen nicht deshalb stehen
  // bleiben, weil ueberhaupt nichts mehr passiert.
  pruefe("Einkauf/DOM: die Menge wird trotzdem fortgeschrieben",
    menge("Spätzlemehl"), "800 g");

  // Zweimal Abhaken schaltet wieder aus, und aria-pressed geht mit.
  var einer = posten()[0];
  var warAn = einer.classList.contains("abgehakt");
  einer.ausloesen("click");
  pruefe("Einkauf/DOM: Abhaken schaltet um, aria-pressed folgt",
    [einer.classList.contains("abgehakt"), einer.getAttribute("aria-pressed")],
    [!warAn, String(!warAn)]);
})();

// Der Kennzahlenstreifen, wie er wirklich im DOM landet (T-0049).
// Die Rechnung dahinter war geprueft, die Anzeige nicht — auffaellig
// geworden, weil eine Negativprobe an render.js keinen einzigen Test
// umwarf. Genau die Luecke, in der eine korrigierte Formel und ein
// stehengebliebenes Bild nebeneinander leben koennen.
(function () {
  function kacheln(id) {
    var r = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, id + ".json"), "utf8"));
    var ziel = DOM.knotenBauen("div");
    ziel.className = "rezept";
    R.rezeptRendern(r, ziel);
    return ziel.querySelectorAll(".kennzahl").map(function (k) {
      return k.querySelector(".kennzahl-label").textContent + "=" +
             k.querySelector(".kennzahl-wert").textContent;
    });
  }
  pruefe("Kennzahlen/DOM: Maultaschen",
    kacheln("maultaschen"),
    ["Arbeit=1 Std", "ohne Zutun=15 Min", "gesamt=1 Std 15 Min"]);
  pruefe("Kennzahlen/DOM: Spaetzle",
    kacheln("spaetzle"),
    ["Arbeit=28 Min", "ohne Zutun=20 Min", "gesamt=48 Min"]);

  // Die eigentliche Zusage aus T-0053: was der Leser addiert, geht auf.
  // Auf der ANZEIGE geprueft, nicht auf den Rohwerten — dort entsteht der
  // Widerspruch, den jemand sieht.
  function alsMinuten(text) {
    var std = /(\d+)\s*Std/.exec(text), min = /(\d+)\s*Min/.exec(text);
    return (std ? parseInt(std[1], 10) * 60 : 0) + (min ? parseInt(min[1], 10) : 0);
  }
  var widersprueche = dateien.map(function (d) { return d.replace(".json", ""); })
    .map(function (id) {
      var w = kacheln(id).map(function (k) { return alsMinuten(k.split("=")[1]); });
      return w[0] + w[1] === w[2]
        ? null
        : id + ": " + w[0] + " + " + w[1] + " = " + (w[0] + w[1]) + " statt " + w[2];
    }).filter(Boolean);
  pruefe("Kennzahlen/DOM: Arbeit + ohne Zutun ergibt gesamt, in jedem Rezept",
    widersprueche, []);
  // Pfannkuchen zweimal korrigiert: T-0046 nahm die falschen 3 Std auf das
  // Planende zurueck, T-0053 gab dem Fuellen seine 15 Minuten und hob das
  // Planende entsprechend an. 45 + 105 = 150 Min.
  pruefe("Kennzahlen/DOM: Pfannkuchen",
    kacheln("pfannkuchen"),
    ["Arbeit=45 Min", "ohne Zutun=1 Std 45 Min", "gesamt=2 Std 30 Min"]);
})();

// --- 5a6. Zeitachse: Start UND Planende (T-0052) ----------------------
// Alle Marken sind Startzeiten, aber nur die letzte trug eine Einheit —
// und las sich damit als Gesamtdauer. Gemessen war die Luecke beim
// Eierkuchen am groessten: Achse endete auf 35 Min, gesamt sind 60.
// Jetzt traegt die letzte Zelle beides: links weiter den Start ihrer
// Spalte, rechts das Ende des Plans.
(function () {
  function achse(id) {
    var r = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, id + ".json"), "utf8"));
    var ziel = DOM.knotenBauen("div");
    ziel.className = "rezept";
    R.rezeptRendern(r, ziel);
    var marken = ziel.querySelectorAll(".zeitachse-marke");
    return {
      starts: marken.map(function (m) {
        return m.querySelector(".zeitachse-start").textContent;
      }),
      ende: ziel.querySelector(".zeitachse-ende").textContent,
      vorgelesen: marken.map(function (m) { return m.getAttribute("aria-label"); }),
      // Was beim Kopieren herauskommt: nur echte Textknoten.
      kopiert: marken.map(function (m) { return m.textContent; }),
      gesamt: ziel.querySelectorAll(".kennzahl").map(function (k) {
        return k.querySelector(".kennzahl-label").textContent === "gesamt"
          ? k.querySelector(".kennzahl-wert").textContent : null;
      }).filter(Boolean)[0]
    };
  }

  // Keine Marke behauptet mehr eine Summe: alle Starts sind blanke Zahlen.
  pruefe("Zeitachse: Startmarken tragen keine Einheit",
    achse("maultaschen").starts, ["0", "10", "40", "60"]);
  pruefe("Zeitachse: die Startzeit der letzten Stufe bleibt erhalten",
    achse("eierkuchen").starts.slice(-1)[0], "35");

  // Das Planende steht rechts in derselben Zelle — und muss zur Kennzahl
  // passen, sonst widerspricht sich der Kopf wieder selbst.
  pruefe("Zeitachse: Planende beim Eierkuchen", achse("eierkuchen").ende, "60 Min");
  pruefe("Zeitachse: Planende bei den Maultaschen", achse("maultaschen").ende, "75 Min");
  // Vorgelesen bekommt jede Marke ihre Einheit, die letzte zusaetzlich
  // das Planende — als aria-label, damit nichts davon beim Kopieren
  // mitgeht (gemessen: ein versteckter Textknoten wird mitgenommen).
  pruefe("Zeitachse: jede Marke wird mit Einheit vorgelesen",
    achse("maultaschen").vorgelesen,
    ["ab 0 Minuten", "ab 10 Minuten", "ab 40 Minuten",
     "ab 60 Minuten, Planende 75 Minuten"]);
  // Eierkuchen hat eine Marke bei 1 — dort muss der Numerus stimmen.
  pruefe("Zeitachse: Einzahl bei einer Minute",
    achse("eierkuchen").vorgelesen[1], "ab 1 Minute");
  pruefe("Zeitachse: kopiert wird nur, was man sieht",
    achse("maultaschen").kopiert, ["0", "10", "40", "6075 Min"]);

  var abweichungen = dateien.map(function (d) { return d.replace(".json", ""); })
    .map(function (id) {
      var a = achse(id);
      // "1 Std 15 Min" gegen "75 Min" — ueber die Minuten vergleichen.
      var minuten = parseInt(a.ende, 10);
      var k = a.gesamt;
      var std = /(\d+)\s*Std/.exec(k);
      var min = /(\d+)\s*Min/.exec(k);
      var kMinuten = (std ? parseInt(std[1], 10) * 60 : 0) + (min ? parseInt(min[1], 10) : 0);
      return minuten === kMinuten ? null : id + ": Achse " + minuten + " gegen Kennzahl " + kMinuten;
    }).filter(Boolean);
  pruefe("Zeitachse: das Planende deckt sich in jedem Rezept mit der Kennzahl",
    abweichungen, []);
})();

// Isomorphie-Gegenprobe zu T-0044: dieselbe Fehlerklasse im Rezept-Grid.
// Auch dort lebt der Haken nur als Klasse im DOM, und auch dort gibt es
// einen Portionswechsel. Der Weg ist ein anderer (mengenAktualisieren
// schreibt in place statt neu zu bauen) und deshalb heil — aber das war
// vorher nirgends festgehalten.
(function () {
  var sp = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, "spaetzle.json"), "utf8"));
  var ziel = DOM.knotenBauen("div");
  ziel.className = "rezept";
  R.rezeptRendern(sp, ziel);

  var zutaten = ziel.querySelectorAll(".zutat");
  [0, 1].forEach(function (i) { zutaten[i].ausloesen("click"); });
  var hakenVorher = ziel.querySelectorAll(".abgehakt").length;
  var mengeVorher = ziel.querySelectorAll(".menge")[0].textContent;
  pruefe("Grid: zwei Zeilen abgehakt (beide Ansichten, Menge + Zutat)", hakenVorher, 8);

  ziel.querySelectorAll(".portionen-knopf")[3].ausloesen("click");
  pruefe("Grid: Haken ueberleben den Portionswechsel",
    ziel.querySelectorAll(".abgehakt").length, hakenVorher);
  pruefe("Grid: Mengen werden dabei verdoppelt",
    [mengeVorher, ziel.querySelectorAll(".menge")[0].textContent], ["400 g", "800 g"]);
})();

// Und der Abgleich selbst: weggefallene Posten verschwinden, neue kommen
// dazu, die Reihenfolge stimmt, und wer bleibt, behaelt seinen Knoten.
(function () {
  var liste = DOM.knotenBauen("ul");
  function schreiben(namen) {
    R.postenSchreiben(liste, namen.map(function (n) {
      return { schluessel: n + "|g|skaliert", name: n, einheit: "g", menge: 100,
               menge_bis: null, mengenlos: false, fix: false, quellen: ["X"] };
    }));
  }
  function namen() {
    return liste.children.map(function (li) {
      return li.querySelector(".posten-name").textContent;
    });
  }
  schreiben(["Butter", "Mehl", "Zucker"]);
  var mehlKnoten = liste.children[1];
  mehlKnoten.classList.add("abgehakt");

  schreiben(["Apfel", "Mehl", "Zimt"]);
  pruefe("Einkauf/Abgleich: Reihenfolge nach dem Wechsel",
    namen(), ["Apfel", "Mehl", "Zimt"]);
  pruefe("Einkauf/Abgleich: der bleibende Posten behaelt Knoten und Haken",
    [liste.children[1] === mehlKnoten, mehlKnoten.classList.contains("abgehakt")],
    [true, true]);

  schreiben([]);
  pruefe("Einkauf/Abgleich: leere Liste raeumt alles weg", liste.children.length, 0);
})();

// --- 5a3. Trennzeichen stehen im Text, nicht im Stylesheet (T-0043) ---
// Die Serie T-0037 / Quellenzeile / T-0042 hatte dreimal dieselbe
// Ursache: CSS malte eine Trennung, die der Text nicht enthielt — beim
// Kopieren klebten die Woerter zusammen. Beim Umbau der Quellenzeile
// wurde der Textknoten ergaenzt und die alte CSS-Regel stehen gelassen;
// seitdem stand dort ein Gedankenstrich doppelt, sichtbar im Omelett.
//
// Zwei Pruefungen: der gerenderte Text darf den Strich nur einmal haben,
// und im Stylesheet darf kein `content` mit sichtbarem Text stehen,
// ausser den bewusst behaltenen. Wer einen neuen anlegt, faellt hier auf
// und muss sich entscheiden.
(function () {
  var om = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, "omelett-mit-pilzen.json"), "utf8"));
  var ziel = DOM.knotenBauen("div");
  R.rezeptRendern(om, ziel);
  var quelle = ziel.querySelector(".quelle");
  var striche = (quelle.textContent.match(/—/g) || []).length;
  // Einer trennt Titel und Autor, einer den Hinweis.
  pruefe("Quelle: Gedankenstriche im gerenderten Text", striche, 2);

  var css = fs.readFileSync(path.join(wurzel, "css/stil.css"), "utf8");
  var erlaubt = [".zurueck-link::before"];  // rein dekorativer Pfeil
  var mitInhalt = [];
  css.replace(/([^{}]+)\{([^}]*)\}/g, function (_, auswahl, block) {
    var treffer = block.match(/(^|[;\s])content:\s*("[^"]*"|'[^']*')/);
    if (!treffer) return "";
    var text = treffer[2].slice(1, -1).trim();
    if (text) mitInhalt.push(auswahl.trim());
    return "";
  });
  pruefe("CSS: kein Pseudo-Inhalt ausser den bewusst behaltenen",
    mitInhalt.filter(function (a) { return erlaubt.indexOf(a) === -1; }), []);
})();

// --- 5a4. Wo .gefaess wirklich steht (T-0048) -------------------------
// Bis T-0048 stand im Stylesheet `.untertitel + .gefaess` mit einer
// negativen Marge und einem Kommentar, der ein Layout beschrieb, das es
// seit T-0039.3 nicht mehr gibt: die Ausstattung sitzt in
// section.rezept-anhang unter dem Grid, nie direkt hinter dem Untertitel.
// Gemessen ueber alle Rezepte: fuenf .gefaess-Elemente, null Treffer.
// Diese Pruefung haelt den Zustand fest — zieht jemand die Ausstattung
// zurueck nach oben, faellt es hier auf und nicht erst am Abstand.
(function () {
  var stellen = [];
  dateien.forEach(function (datei) {
    var r = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, datei), "utf8"));
    var ziel = DOM.knotenBauen("div");
    ziel.className = "rezept";
    R.rezeptRendern(r, ziel);
    ziel.querySelectorAll(".gefaess").forEach(function (g) {
      var geschwister = g.elternteil.children;
      var davor = geschwister[geschwister.indexOf(g) - 1];
      stellen.push({
        eltern: g.elternteil.className,
        davorUntertitel: !!(davor && davor.classList.contains("untertitel"))
      });
    });
  });
  pruefe("Ausstattung: jedes Rezept hat genau eine", stellen.length, dateien.length);
  pruefe("Ausstattung: steht in .rezept-anhang, nie hinter dem Untertitel",
    stellen.filter(function (o) {
      return o.eltern !== "rezept-anhang" || o.davorUntertitel;
    }), []);
})();

// --- 5a5. Kochleiste ist eine Live-Region (T-0051) --------------------
// Im Kochmodus ist das ganze Feedback reine Textaenderung: "Schritt 3 von
// 6", die neue Anweisung, das Ablaufen der Uhr. Ohne aria-live sagt ein
// Screenreader davon nichts — und der Countdown-Alarm, der einzige Grund
// fuer den Timer, ist fuer blinde Nutzer schlicht nicht da. Im ganzen
// Repo gab es bis T-0051 kein einziges aria-live.
(function () {
  var sp = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, "spaetzle.json"), "utf8"));
  var ziel = DOM.knotenBauen("div");
  ziel.className = "rezept";
  R.rezeptRendern(sp, ziel);
  var km = K.kochmodusBauen(G.gridModellBauen(sp), ziel);
  km.starten();

  var leiste = document.body.querySelector(".koch-leiste");
  var text = leiste.querySelector(".koch-text");
  pruefe("Kochleiste: Schrittwechsel wird angesagt",
    [text.getAttribute("aria-live"), text.getAttribute("aria-atomic")],
    ["polite", "true"]);
  pruefe("Kochleiste: die Uhr ist als Timer ausgezeichnet",
    leiste.querySelector(".koch-uhr").getAttribute("role"), "timer");
  // Die Uhr selbst darf NICHT live sein — sonst liest der Screenreader
  // jede Sekunde vor. Angesagt wird nur das Ablaufen, einmal.
  pruefe("Kochleiste: die Uhr tickt nicht in die Ansage",
    leiste.querySelector(".koch-uhr").getAttribute("aria-live"), null);

  var alarm = leiste.querySelector(".koch-alarm");
  pruefe("Kochleiste: es gibt eine Statuszeile fuer den Ablauf",
    alarm.getAttribute("role"), "status");
  pruefe("Kochleiste: sie schweigt, solange nichts abgelaufen ist",
    alarm.textContent, "");

  // Timer starten, Wanduhr ueber das Ende schieben, den Tick von Hand
  // ausloesen — genau der Ablauf im gedrosselten Tab. Ein zweiter
  // Knopfdruck taete es NICHT: der startet nach Ablauf wieder von vorn.
  var echtInterval = globalThis.setInterval, echtClear = globalThis.clearInterval;
  var tick = null;
  globalThis.setInterval = function (fn) { tick = fn; return 1; };
  globalThis.clearInterval = function () {};
  km.timerUmschalten();
  var echteUhr = Date.now;
  Date.now = function () { return echteUhr() + 999999; };
  tick();
  Date.now = echteUhr;
  globalThis.setInterval = echtInterval;
  globalThis.clearInterval = echtClear;

  pruefe("Kochleiste: abgelaufen wird einmal angesagt",
    leiste.querySelector(".koch-alarm").textContent, "Zeit abgelaufen");

  km.beenden();
})();

// Isomorphie-Fund zu T-0051: dieselbe Klasse in der Uebersicht. Beim
// Anhaken eines Rezepts taucht die Leiste "N Rezepte gewaehlt" auf —
// eine Zustandsaenderung, die vorher nur zu sehen war.
(function () {
  var rezepte = dateien.map(function (d) {
    return JSON.parse(fs.readFileSync(path.join(rezeptOrdner, d), "utf8"));
  });
  var ziel = DOM.knotenBauen("div");
  R.uebersichtRendern(rezepte, ziel);
  pruefe("Uebersicht: der Auswahlzaehler wird angesagt",
    ziel.querySelector(".einkauf-zaehler").getAttribute("aria-live"), "polite");
})();

// --- 5b. Das zweite Rezept im Detail ----------------------------------
var eier = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, "eierkuchen.json"), "utf8"));
var me = G.gridModellBauen(eier);
pruefe("Eierkuchen: 7 Zeilen, 6 Spalten", [me.zeilen.length, me.spalten.length], [7, 6]);
pruefe("Eierkuchen: Bloecke",
  me.spalten.map(function (s) { return [s.von, s.bis]; }),
  [[0,2],[0,3],[0,4],[0,5],[0,5],[0,6]]);
// Dieselbe Zutat zweimal im Rezept: zwei Eintraege, zwei Zeilen.
pruefe("Eierkuchen: Milch belegt zwei getrennte Zeilen",
  me.zeilen.map(function (z) { return z.zutat.name; })
    .reduce(function (n, name) { return name === "Milch" ? n + 1 : n; }, 0), 2);
pruefe("Eierkuchen: Ruhestufe hat keine neuen Zutaten",
  me.spalten[4].eigeneZeilen.length, 0);
pruefe("Eierkuchen: Ruhestufe ist unbeaufsichtigt",
  me.spalten[4].schritt.unbeaufsichtigt, true);
// Reine Stueckzahl ohne Einheit.
var eierZutat = eier.zutaten.find(function (z) { return z.id === "z-eier"; });
pruefe("Eierkuchen: 4 Eier ohne Einheit", P.mengeFormatieren(eierZutat, 1), "4");
pruefe("Eierkuchen: 8 Portionen -> 8 Eier", P.mengeFormatieren(eierZutat, 2), "8");
pruefe("Stueckzahl ohne Einheit wird als Bruch gerundet",
  P.mengeFormatieren({menge: 3, einheit: null}, 1.5), "4½");
pruefe("Prise bleibt bei skalieren:false fix",
  P.mengeFormatieren({menge: 1, einheit: "Prise", skalieren: false}, 3), "1 Prise");


// --- Stufenliste (T-0040) ---------------------------------------------
// Maultaschen sind der Pruefstein: zwei Straenge, ein Zusammenlauf, eine
// Ruhezeit, die einen zweiten Strang traegt.
var mtM = G.gridModellBauen(maultaschen);

pruefe("Stufenliste: Tiefen bei zwei Straengen", S.tiefen(mtM), [0, 1, 0, 2, 3]);
pruefe("Stufenliste: Fuellung liegt in der Teigruhe",
  S.ruhefenster(mtM), [null, null, "Teig ruhen lassen", null, null]);

// Genau eine Stufe hat mehr als eine Vorstufe, und sie bringt die
// Zeilenbloecke beider Straenge mit.
var gab = S.gabeln(mtM);
pruefe("Stufenliste: nur der Zusammenlauf hat eine Gabel",
  gab.map(function (x) { return !!x; }), [false, false, false, true, false]);
pruefe("Stufenliste: Gabel kennt die Tiefen der Straenge", gab[3].tiefen, [1, 0]);
pruefe("Stufenliste: Gabel zaehlt die eingehenden Zutaten",
  gab[3].teile.map(function (t) { return t.zutaten; }), [4, 12]);

// Ein lineares Rezept muss eine Treppe ohne Luecken ergeben, sonst stimmt
// die Einrueckung nicht mit der Klammer der Tabelle ueberein.
var ekM = G.gridModellBauen(eier);
pruefe("Stufenliste: lineares Rezept steigt um eins je Stufe",
  S.tiefen(ekM), [0, 1, 2, 3, 4, 5]);
pruefe("Stufenliste: lineares Rezept hat keinen Zusammenlauf",
  S.gabeln(ekM).filter(Boolean).length, 0);

// Die Einrueckung darf den Schirm nicht verlassen.
pruefe("Stufenliste: Einrueckung ist begrenzt",
  [S.einzug(3), S.einzug(12) === S.einzug(S.MAX_EBENEN)], [3 * S.EINZUG_PX, true]);
pruefe("Stufenliste: tiefste Einrueckung laesst 250 px Inhalt",
  343 - S.einzug(S.MAX_EBENEN) - 13 >= 250, true);

// Eigener Zusatz: die Liste muss JEDE Stufe zeigen, sonst faellt auf dem
// Telefon stillschweigend ein Arbeitsschritt weg. Gegen alle Rezepte.
var listeLuecken = [];
["eierkuchen", "pfannkuchen", "spaetzle", "maultaschen"].forEach(function (id) {
  var r = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, id + ".json"), "utf8"));
  var mm = G.gridModellBauen(r);
  if (S.tiefen(mm).length !== mm.spalten.length) listeLuecken.push(id + ": Tiefen unvollstaendig");
  if (S.ruhefenster(mm).length !== mm.spalten.length) listeLuecken.push(id + ": Ruhefenster unvollstaendig");
  // Eine Stufe darf nie in ihrem eigenen Ruhefenster liegen.
  S.ruhefenster(mm).forEach(function (traeger, i) {
    if (traeger && traeger === mm.spalten[i].schritt.titel) listeLuecken.push(id + ": " + traeger + " traegt sich selbst");
  });
});
pruefe("Stufenliste: jede Stufe kommt in allen Rezepten vor", listeLuecken, []);

// --- 6. Ladeweg: wann darf das Manifest einspringen? (T-0047) ---------
// Ueber file:// ist der Fallback der Ladeweg, ueber http(s) ein Fehler,
// der wie ein Erfolg aussieht: bis T-0047 zeigte jeder HTTP-500, jeder
// Netzwerkabbruch und jede kaputte JSON kommentarlos die von Hand
// erzeugte Manifest-Kopie. Deshalb hier mit gestelltem fetch durchgespielt.
function ladewegPruefen() {
  var echt = { id: "spaetzle", titel: "frisch vom Server" };
  var manifest = { spaetzle: { id: "spaetzle", titel: "alte Manifest-Fassung" } };
  globalThis.REZEPTE = manifest;

  function fetchStellen(art) {
    globalThis.fetch = function () {
      if (art === "ok") {
        return Promise.resolve({ ok: true, json: function () { return Promise.resolve(echt); } });
      }
      if (art === "500") return Promise.resolve({ ok: false, status: 500 });
      if (art === "kaputt") {
        return Promise.resolve({
          ok: true,
          json: function () { return Promise.reject(new SyntaxError("Unexpected token }")); }
        });
      }
      // file:// — der Browser laesst fetch gar nicht erst zu
      return Promise.reject(new TypeError("Failed to fetch"));
    };
  }

  function lauf(name, art, protokoll, pruefung) {
    fetchStellen(art);
    return A.rezeptLaden("spaetzle", protokoll)
      .then(function (r) { pruefe(name, pruefung(null, r), true); })
      .catch(function (e) { pruefe(name, pruefung(e, null), true); });
  }

  pruefe("Ladeweg: Fallback nur ueber file://",
    [A.fallbackErlaubt("file:"), A.fallbackErlaubt("http:"), A.fallbackErlaubt("https:")],
    [true, false, false]);

  return Promise.resolve()
    .then(function () {
      return lauf("Ladeweg: http + alles gut -> Fassung vom Server", "ok", "http:",
        function (e, r) { return !e && r.titel === "frisch vom Server"; });
    })
    .then(function () {
      return lauf("Ladeweg: http + HTTP 500 -> Fehler statt alter Kopie", "500", "http:",
        function (e, r) { return !r && !!e && e.message.indexOf("HTTP 500") > -1; });
    })
    .then(function () {
      return lauf("Ladeweg: http + kaputte JSON -> Fehler statt alter Kopie", "kaputt", "http:",
        function (e, r) { return !r && !!e && e.message.indexOf("Unexpected token") > -1; });
    })
    .then(function () {
      return lauf("Ladeweg: file:// + fetch blockiert -> Manifest springt ein", "blockiert", "file:",
        function (e, r) { return !e && r.titel === "alte Manifest-Fassung"; });
    })
    .then(function () {
      globalThis.REZEPTE = {};
      return lauf("Ladeweg: nichts da -> \"nicht gefunden\"", "blockiert", "file:",
        function (e, r) { return !r && !!e && e.message.indexOf("nicht gefunden") > -1; });
    })
    .then(function () { globalThis.REZEPTE = manifest; });
}

ladewegPruefen().then(function () {
  console.log(fehler === 0 ? "\nALLE PRUEFUNGEN GRUEN" : "\n" + fehler + " FEHLER");
  process.exit(fehler ? 1 : 0);
});
