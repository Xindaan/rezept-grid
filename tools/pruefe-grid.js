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
require("../js/merker.js");
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
var M = globalThis.RezeptMerker;

var fehler = 0;

// Vergleich ueber JSON. Ein DOM-Knoten darin ist ein Ring (Kind zeigt auf
// Eltern zeigt auf Kind) — JSON.stringify wirft daran, und zwar erst im
// FEHLERFALL. Ein Test, der bei Abweichung abstuerzt statt zu melden,
// nimmt einem genau die Meldung weg, fuer die er da ist; aufgefallen in
// der Negativprobe zu T-0060. Deshalb hier abgefangen: lieber eine
// grobe Beschreibung als kein Ergebnis.
function alsText(wert) {
  try {
    return JSON.stringify(wert);
  } catch (e) {
    return "<nicht serialisierbar: " + e.message + ">";
  }
}

function pruefe(name, ist, soll) {
  var a = alsText(ist), b = alsText(soll);
  var ok = a === b && a.indexOf("<nicht serialisierbar") !== 0;
  if (!ok) { fehler++; console.log("FAIL  " + name + "\n      ist:  " + a + "\n      soll: " + b); }
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
// Grosse Einheiten: eine Nachkommastelle waere hier 100 ml bzw. 100 g
// (T-0058). Aus 0,75 l wurde "0,8 l" — fuenfzig Milliliter daneben.
pruefe("kg/l bekommen zwei Nachkommastellen", P.dezimalRunden(0.75, "l"), 0.75);
pruefe("kg/l: auch beim Gewicht", P.dezimalRunden(1.25, "kg"), 1.25);
pruefe("kg/l: ab 10 bleibt es ganzzahlig wie ueberall", P.dezimalRunden(12.5, "l"), 13);
pruefe("g/ml bleiben bei einer Nachkommastelle", P.dezimalRunden(0.75, "g"), 0.8);
pruefe("ohne Einheit gilt weiter die g/ml-Regel", P.dezimalRunden(0.75), 0.8);
pruefe("Einheiten-Groessenklasse",
  [P.istGrosseEinheit("l"), P.istGrosseEinheit("kg"),
   P.istGrosseEinheit("ml"), P.istGrosseEinheit("g")],
  [true, true, false, false]);
// Und am Anzeigetext, nicht nur an der Rechnung — dort sieht es der Leser.
pruefe("kg/l: der angezeigte Text stimmt",
  [P.mengeFormatieren({ menge: 1.5, einheit: "l" }, 0.5),
   P.mengeFormatieren({ menge: 2.5, einheit: "kg" }, 0.5)],
  ["0,75 l", "1,25 kg"]);

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

// --- Der Planer laesst die Haende nicht leer (T-0054) -----------------
// Zwei Regeln, jede mit eigenem Fall — sonst deckt ein Test beide ab und
// die Negativprobe bleibt gruen, wenn man eine davon ausbaut.
//
// Regel 1 (Zeit): dran ist, was am fruehesten anfangen kann. Bis T-0054
// entschied der Restpfad allein; die Stufe hinter der Ruhezeit gewann,
// `handFrei` sprang mit ihr ans Ende der Ruhezeit, und die unabhaengige
// Arbeit kam erst danach.
var wartDauern = [600, 3600, 600, 600];        // Arbeit, Ruhe, Arbeit, freie Arbeit
var wartVor = [[], [0], [1], []];
var wartUnbeauf = [false, true, false, false];
pruefe("Plan: die bereite Stufe kommt vor der, die auf eine Ruhezeit wartet",
  Z.plan(wartDauern, wartVor, wartUnbeauf).starts, [0, 600, 4200, 600]);
pruefe("Plan: dadurch keine Leerzeit — 80 statt 90 Minuten",
  Z.realeGesamtdauer(wartDauern, wartVor, wartUnbeauf), 4800);
// Und die Folge, die der Leser sieht: keine falsche Warnung im Kopf. Der
// Plan trifft hier den kritischen Pfad, zu zweit ginge es nicht schneller.
pruefe("Plan: kein falsches 'braucht zwei Haende'",
  [Z.braucht2Haende(wartDauern, wartVor, wartUnbeauf),
   Z.gesamtdauer(wartDauern, wartVor)], [false, 4800]);

// Regel 2 (Restpfad): bei GLEICHEM fruehesten Start entscheidet weiter,
// hinter wem am meisten haengt. Das ist die Maultaschen-Logik in klein —
// zuerst das, hinter dem eine Ruhezeit haengt, denn die laeuft dann
// waehrend der uebrigen Arbeit.
//
// Der Fall ist bewusst so gebaut, dass die Reihenfolge im Feld NICHT
// die richtige Antwort ist: Stufe 1 traegt die Kette, Stufe 0 nicht.
// Ohne die Regel gewinnt der erste Treffer, und die Ruhezeit beginnt
// erst nach aller Arbeit — 70 statt 60 Minuten. (Ein Rezept mit dieser
// Reihenfolge wuerde die JSON-Reihenfolgepruefung weiter unten melden;
// hier steht der Planer allein auf dem Pruefstand.)
var kettenDauern = [600, 600, 3000];
var kettenVor = [[], [], [1]];
var kettenUnbeauf = [false, false, true];
pruefe("Plan: bei gleichem Start kommt der laengste Restpfad zuerst",
  Z.plan(kettenDauern, kettenVor, kettenUnbeauf).starts, [600, 0, 600]);
pruefe("Plan: und die Ruhezeit laeuft dadurch waehrend der uebrigen Arbeit",
  Z.realeGesamtdauer(kettenDauern, kettenVor, kettenUnbeauf), 3600);

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

// --- Spannen addieren sich als Spanne (T-0057) ------------------------
// "1 EL" plus "1-2 EL" ist "2-3 EL". Vorher trug die Zutat ohne Spanne
// zur Obergrenze nichts bei, und heraus kam "2-2 EL" — eine Spanne, die
// keine ist, und eine Obergrenze unter der Wahrheit.
(function () {
  function rez(id, zutaten) {
    return { id: id, titel: id, portionen: 4, zutaten: zutaten };
  }
  function spanne(liste) {
    return liste.map(function (p) { return [p.menge, p.menge_bis]; });
  }
  var einzeln = rez("a", [{ id: "z", name: "Essig", menge: 1, einheit: "EL" }]);
  var mitSpanne = rez("b", [{ id: "z", name: "Essig", menge: 1, menge_bis: 2, einheit: "EL" }]);
  var festeSpanne = rez("c", [{ id: "z", name: "Essig", menge: 1, menge_bis: 2,
                               einheit: "EL", skalieren: false }]);

  pruefe("Einkauf: Einzelwert plus Spanne ergibt eine Spanne",
    spanne(EK.listeBauen([{ rezept: einzeln, portionen: 4 }, { rezept: mitSpanne, portionen: 4 }])),
    [[2, 3]]);
  // Und zwar unabhaengig davon, welches Rezept zuerst kommt — genau
  // daran haengt die Fehlerklasse.
  pruefe("Einkauf: Spanne plus Einzelwert ergibt dieselbe Spanne",
    spanne(EK.listeBauen([{ rezept: mitSpanne, portionen: 4 }, { rezept: einzeln, portionen: 4 }])),
    [[2, 3]]);
  pruefe("Einkauf: zwei Spannen addieren beide Grenzen",
    spanne(EK.listeBauen([{ rezept: mitSpanne, portionen: 4 }, { rezept: mitSpanne, portionen: 4 }])),
    [[2, 4]]);
  // Ohne Spanne darf keine entstehen, sonst stuende ueberall "2-2 EL".
  pruefe("Einkauf: ohne Spanne bleibt der Posten ohne Spanne",
    spanne(EK.listeBauen([{ rezept: einzeln, portionen: 4 }, { rezept: einzeln, portionen: 4 }])),
    [[2, null]]);
  // Feste Mengen summieren nicht — auch ihre Obergrenze nicht.
  pruefe("Einkauf: feste Spanne nimmt das Maximum statt zu summieren",
    spanne(EK.listeBauen([{ rezept: festeSpanne, portionen: 4 }, { rezept: festeSpanne, portionen: 8 }])),
    [[1, 2]]);
  // Skalierung greift auf beiden Grenzen.
  pruefe("Einkauf: die Portionszahl skaliert beide Grenzen",
    spanne(EK.listeBauen([{ rezept: mitSpanne, portionen: 8 }])), [[2, 4]]);
  // Die Hilfsfelder der Rechnung duerfen den Posten nicht verlassen —
  // sonst wandern sie in die Anzeige und in jeden Vergleich.
  pruefe("Einkauf: der Posten traegt keine Rechenreste",
    Object.keys(EK.listeBauen([{ rezept: mitSpanne, portionen: 4 }])[0]).sort(),
    ["einheit", "fix", "menge", "menge_bis", "mengenlos", "name", "quellen", "schluessel"]);
})();

// Die Auswahl steht in der URL und ist damit Eingabe von aussen.
pruefe("Einkauf: unbrauchbare Portionszahlen fallen auf die Basis zurueck",
  EK.auswahlLesen("a:-4,b:0,c:abc,d:8").map(function (x) { return x.portionen; }),
  [null, null, null, 8]);

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
//
// Der Gurkensalat steht dort fuer die Faelle, die der Bestand nicht hat:
// keine Wartezeit (Kachel "ohne Zutun" faellt weg) und kein `gefaess`
// (optional laut Schema). Zwei Pruefungen hatten genau diese Eigenschaften
// des Bestands als Regel festgeschrieben und haetten das naechste
// Rezept dieser Art rot gemacht (T-0073).
var testdatenOrdner = path.join(wurzel, "tools/testdaten");
var testdaten = ["gurkensalat.json", "linsen-eintopf.json"];
var zuPruefen = dateien.map(function (d) {
  return { ordner: rezeptOrdner, datei: d };
}).concat(testdaten.map(function (d) {
  return { ordner: testdatenOrdner, datei: d };
}));

zuPruefen.forEach(function (eintrag) {
  var datei = eintrag.datei;
  var r = JSON.parse(fs.readFileSync(path.join(eintrag.ordner, datei), "utf8"));
  var name = datei.replace(".json", "");
  var maengel = [];

  if (r.id !== name) maengel.push('id "' + r.id + '" passt nicht zum Dateinamen');
  if (!r.portionen || r.portionen < 1) maengel.push("portionen fehlt oder ist < 1");

  // Die Pflichtfelder aus docs/schema.md, bisher ungeprueft (T-0062).
  // Sie fehlen selten — aber wenn, dann faellt es erst im Browser auf,
  // und dort als leere Ueberschrift statt als Meldung.
  if (r.schema !== 1) maengel.push("schema fehlt oder ist nicht 1");
  if (!r.titel) maengel.push("titel fehlt");
  if (!Number.isInteger(r.portionen)) maengel.push("portionen ist keine ganze Zahl");
  if (!("quelle" in r)) maengel.push("quelle fehlt (null bei Eigenkreation)");
  if (r.quelle !== null && typeof r.quelle !== "object") {
    maengel.push("quelle ist weder null noch ein Objekt");
  }
  if (!Array.isArray(r.zutaten) || !r.zutaten.length) maengel.push("zutaten fehlt oder ist leer");
  if (!Array.isArray(r.schritte) || !r.schritte.length) maengel.push("schritte fehlt oder ist leer");
  // Die id-Form ist ASCII-kebab-case; sie ist zugleich der Dateiname und
  // steht in URLs.
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id || "")) {
    maengel.push('id "' + r.id + '" ist kein ASCII-kebab-case');
  }

  // Einheiten gegen ein festes Vokabular. Ein Tippfehler wie "Zehen"
  // statt "Zehe" faellt sonst nirgends auf: die Einheit ist dann keine
  // Bruch-Einheit mehr und die Menge laeuft still in die Dezimalrundung —
  // aus "1½ Zehe" wird "1,5 Zehen".
  //
  // Das Vokabular kommt aus js/portionen.js und steht nicht mehr hier
  // (T-0062). Dort entscheidet es ueber die Rundung; eine zweite Liste
  // haette bedeutet, dass eine neue Einheit erst richtig gerundet und
  // dann trotzdem als Fehler gemeldet wird.
  var ERLAUBTE_EINHEITEN = P.ALLE_EINHEITEN;

  var ids = {};
  r.zutaten.forEach(function (z) {
    if (!z.name) maengel.push('Zutat "' + z.id + '" ohne name');
    if (!/^z-[a-z0-9]+(-[a-z0-9]+)*$/.test(z.id || "")) {
      maengel.push('Zutaten-ID "' + z.id + '" folgt nicht dem Muster z-kebab-case');
    }
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
    if (typeof s.anweisung !== "string") maengel.push('Schritt "' + s.id + '" ohne anweisung');
    if (!/^s-[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id || "")) {
      maengel.push('Schritt-ID "' + s.id + '" folgt nicht dem Muster s-kebab-case');
    }
    if (!Array.isArray(s.zutaten)) maengel.push('Schritt "' + s.id + '" ohne zutaten-Feld');
    if (!("dauer_s" in s)) maengel.push('Schritt "' + s.id + '" ohne dauer_s');
    if (s.dauer_s !== null && !(typeof s.dauer_s === "number" && s.dauer_s >= 0)) {
      maengel.push('Schritt "' + s.id + '": dauer_s ist weder null noch eine Zahl >= 0');
    }
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

  // Die Liste wird fortgeschrieben, BEVOR die URL angefasst wird
  // (T-0057). `replaceState` ist der Teil, der scheitern kann — ueber
  // file:// wirft es in manchen Browsern. Stand es davor, blieb der
  // Portionswechsel danach wirkungslos.
  (function () {
    var echt = globalThis.history.replaceState;
    globalThis.history.replaceState = function () {
      throw new Error("SecurityError: replaceState auf file:// nicht erlaubt");
    };
    var geworfen = null;
    try {
      ziel.querySelectorAll(".portionen-knopf")[1].ausloesen("click");
    } catch (e) {
      geworfen = e;
    }
    globalThis.history.replaceState = echt;
    pruefe("Einkauf/DOM: die Mengen stehen auch, wenn replaceState wirft",
      menge("Spätzlemehl"), "400 g");
    // Zurueck auf 8 Portionen fuer die folgenden Pruefungen.
    ziel.querySelectorAll(".portionen-knopf")[3].ausloesen("click");
    pruefe("Einkauf/DOM: und danach laeuft die Umschaltung normal weiter",
      menge("Spätzlemehl"), "800 g");
  })();

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
  function kacheln(id, ordner) {
    var r = JSON.parse(fs.readFileSync(path.join(ordner || rezeptOrdner, id + ".json"), "utf8"));
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
  // Gelesen wird nach Beschriftung, nicht nach Position: bei 0 Minuten
  // laesst render.js die Kachel "ohne Zutun" weg (T-0073). Fehlen darf
  // nur sie — ohne "Arbeit" oder "gesamt" ist die Rechnung kaputt.
  function summenFehler(id, ordner) {
    var w = {};
    kacheln(id, ordner).forEach(function (k) {
      var teil = k.split("=");
      w[teil[0]] = alsMinuten(teil[1]);
    });
    if (w.Arbeit === undefined || w.gesamt === undefined) {
      return id + ": Kachel fehlt (" + Object.keys(w).join(", ") + ")";
    }
    var ohne = w["ohne Zutun"] || 0;
    return w.Arbeit + ohne === w.gesamt
      ? null
      : id + ": " + w.Arbeit + " + " + ohne + " = " + (w.Arbeit + ohne) + " statt " + w.gesamt;
  }
  var widersprueche = dateien.map(function (d) {
    return summenFehler(d.replace(".json", ""), rezeptOrdner);
  }).concat(testdaten.map(function (d) {
    return summenFehler(d.replace(".json", ""), testdatenOrdner);
  })).filter(Boolean);
  pruefe("Kennzahlen/DOM: Arbeit + ohne Zutun ergibt gesamt, in jedem Rezept",
    widersprueche, []);
  // Pfannkuchen zweimal korrigiert: T-0046 nahm die falschen 3 Std auf das
  // Planende zurueck, T-0053 gab dem Fuellen seine 15 Minuten und hob das
  // Planende entsprechend an. 45 + 105 = 150 Min.
  pruefe("Kennzahlen/DOM: Pfannkuchen",
    kacheln("pfannkuchen"),
    ["Arbeit=45 Min", "ohne Zutun=1 Std 45 Min", "gesamt=2 Std 30 Min"]);
})();

// --- 5a5b. Die Spaltenbreiten landen wirklich im DOM (T-0055) --------
// breitenAnwenden ist die Stelle, an der das ganze Zeitmass sichtbar
// wird — und sie war in JEDER Pruefung stumm: `tabelle.parentElement`
// kannte die Attrappe nicht, die Funktion stieg an ihrem eigenen
// Waechter aus, und 197 gruene Pruefungen sagten nichts darueber.
// Gemessen: nach rezeptRendern war style.minWidth undefined und alle
// acht col-Breiten ebenfalls.
//
// Diese Pruefungen fassen an, was der Nutzer sieht: die Mindestbreite,
// die Zahl der Spalten, die beiden Zutatenanteile, die Summe der
// Stufenanteile und den sticky-Versatz.
(function () {
  function tabelle(id) {
    var r = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, id + ".json"), "utf8"));
    var ziel = DOM.knotenBauen("div");
    ziel.className = "rezept";
    var m = R.rezeptRendern(r, ziel);
    var t = ziel.querySelector("table");
    return {
      modell: m,
      tabelle: t,
      ziel: ziel,
      breiten: ziel.querySelectorAll("colgroup col").map(function (c) { return c.style.width; })
    };
  }

  var pk = tabelle("pfannkuchen");
  pruefe("Breiten/DOM: die Mindestbreite steht an der Tabelle",
    pk.tabelle.style.minWidth, Z.noetigeBreite(pk.modell.spaltenAnzahl) + "px");
  pruefe("Breiten/DOM: und sie ist die gerechnete, nicht irgendeine",
    pk.tabelle.style.minWidth, "739px");
  pruefe("Breiten/DOM: eine col je Spalte plus die beiden Zutatenspalten",
    pk.breiten.length, pk.modell.spaltenAnzahl + 2);
  pruefe("Breiten/DOM: keine col bleibt ohne Breite",
    pk.breiten.filter(function (b) { return !b; }), []);
  pruefe("Breiten/DOM: die beiden Zutatenspalten tragen ihren Anteil",
    [pk.breiten[0], pk.breiten[1]],
    [(Z.ZUTATEN[0] * 100).toFixed(3) + "%", (Z.ZUTATEN[1] * 100).toFixed(3) + "%"]);
  // Die Stufen teilen sich exakt den Rest — sonst ist die Tabelle
  // entweder zu schmal oder laeuft ueber.
  pruefe("Breiten/DOM: die Stufenanteile ergeben zusammen den Rest",
    Math.round(pk.breiten.slice(2).reduce(function (a, b) {
      return a + parseFloat(b);
    }, 0) * 100) / 100,
    Math.round((1 - Z.ZUTATEN[0] - Z.ZUTATEN[1]) * 10000) / 100);
  // Der sticky-Versatz muss der TATSAECHLICHEN Breite der Mengenspalte
  // folgen, nicht ihrem Anteil — sonst schiebt sich die Zutatenspalte
  // beim Querscrollen darueber (T-0023/T-0039).
  pruefe("Breiten/DOM: der sticky-Versatz steht als CSS-Variable",
    pk.tabelle.style["--zutat-links"],
    Math.round(Z.spaltenbreiten(
      [0], Z.noetigeBreite(pk.modell.spaltenAnzahl)).zutatenPx[0]) + "px");

  // Und ein zweites Rezept mit anderer Stufenzahl, damit nicht eine
  // zufaellig passende Konstante durchgeht.
  var mtT = tabelle("maultaschen");
  pruefe("Breiten/DOM: andere Stufenzahl, andere Mindestbreite",
    [mtT.tabelle.style.minWidth, mtT.breiten.length], ["493px", 6]);

  // --- Der Kuerzungsvermerk gehoert der Stufe (T-0056) ---------------
  // Zwei Stufen koennen sich eine Spalte teilen; aufgespannt wird sie von
  // der laengeren. Vorher rechnete der Vermerk mit der Spalte und landete
  // trotzdem an jeder Stufe darin: an "Fuellung mischen" (15 von 90 Min)
  // stand "40 % -> 22 %" — die Zahl der Teigruhe daneben.
  function vermerke(t) {
    var raus = {};
    t.modell.spalten.forEach(function (sp) {
      var td = t.tabelle.querySelector('[data-schritt="' + sp.schritt.id + '"]');
      var k = td && td.querySelector(".kuerzung");
      if (k) raus[sp.schritt.id] = k.textContent;
    });
    return raus;
  }
  var mtVermerke = vermerke(mtT);
  // Seit T-0074 auf einer Skala: Zeit UND Breite als Anteil an der
  // Stufenflaeche. Vorher stand hier die Sollliste ["s-fuellen",
  // "s-teig-ruhen"] und "40 % -> 22 %" — beides war der Skalenfehler
  // selbst: die Fuellung steht mit 27 % Zeit auf 25 % Breite, also
  // massstabsgetreu; die 22 % waren Anteil an der GANZEN Tabelle.
  pruefe("Kuerzung: die Stufe in der geteilten Spalte bekommt keinen fremden Vermerk",
    Object.keys(mtVermerke).sort(), ["s-teig-ruhen"]);
  pruefe("Kuerzung: und die Teigruhe nennt ihren eigenen Anteil",
    mtVermerke["s-teig-ruhen"], "∕∕ Achse gekürzt, 40 % → 29 %");
  // Der kleinste Fall des Skalenfehlers: zwei gleich lange Stufen stehen
  // exakt im Verhaeltnis und sind nicht gekuerzt. Die Gegenprobe, eine
  // wirklich gestauchte lange Stufe, behaelt den Vermerk.
  pruefe("Kuerzung: zwei gleich lange Stufen sind nicht gekuerzt, eine gestauchte lange schon",
    [Z.spaltenbreiten([600, 600], Z.noetigeBreite(2)).gekuerzt,
     Z.spaltenbreiten([3600, 60, 60, 60, 60, 60], Z.noetigeBreite(6)).gekuerzt[0]],
    [[false, false], true]);

  // Ueber alle Rezepte: die genannte Prozentzahl ist immer der Anteil der
  // STUFE an der Summe der Spaltenspannen — derselben Skala, auf der die
  // Breiten stehen. Eine Zahl, die zu einer anderen Stufe gehoert, faellt
  // hier auf, egal in welchem Rezept.
  var falscheZahlen = [];
  dateien.map(function (d) { return d.replace(".json", ""); }).forEach(function (id) {
    var t = tabelle(id);
    var spannen = [];
    t.modell.spalten.forEach(function (sp) {
      var c = sp.spalte;
      if (!spannen[c]) spannen[c] = { von: Infinity, bis: 0 };
      spannen[c].von = Math.min(spannen[c].von, sp.start);
      spannen[c].bis = Math.max(spannen[c].bis, sp.ende);
    });
    var summe = spannen.reduce(function (a, x) { return a + (x.bis - x.von); }, 0);
    var gefunden = vermerke(t);
    t.modell.spalten.forEach(function (sp) {
      var text = gefunden[sp.schritt.id];
      if (!text) return;
      var soll = Math.round((sp.schritt.dauer_s || 0) / summe * 100);
      var ist = parseInt(/(\d+)\s*%/.exec(text)[1], 10);
      if (ist !== soll) {
        falscheZahlen.push(id + "/" + sp.schritt.id + ": nennt " + ist + " %, eigene Dauer sind " + soll + " %");
      }
    });
  });
  pruefe("Kuerzung: die genannte Zahl ist in jedem Rezept die der Stufe selbst",
    falscheZahlen, []);
})();

// --- 5a5d. Die Stufenzelle bleibt eine Zelle (T-0060) ----------------
// Vorher trug das <td> selbst role="button" und ein aria-label aus Titel
// plus Hinweis. Ein aria-label ERSETZT den Namen: Dauer, Temperatur und
// die Marken standen sichtbar da, wurden aber nicht mehr vorgelesen. Und
// die Zelle verlor ihre Rolle im Tabellenraster — in einer Tabelle, die
// die Kodierung des Rezepts IST.
(function () {
  function gerendert(id) {
    var r = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, id + ".json"), "utf8"));
    var ziel = DOM.knotenBauen("div");
    ziel.className = "rezept";
    R.rezeptRendern(r, ziel);
    return ziel;
  }

  var mt = gerendert("maultaschen");
  var zellen = mt.querySelectorAll("td.schritt");
  // Verglichen werden die WERTE, nicht die Knoten: ein Knoten im Vergleich
  // laesst den Testlauf im Fehlerfall abstuerzen, statt zu melden.
  pruefe("Stufenzelle: keine Zelle gibt ihre Rasterrolle auf",
    zellen.map(function (td) { return td.getAttribute("role"); })
          .filter(function (rolle) { return rolle !== null; }), []);
  pruefe("Stufenzelle: und keine ueberschreibt ihren Namen",
    zellen.map(function (td) { return td.getAttribute("aria-label"); })
          .filter(function (name) { return name !== null; }), []);
  pruefe("Stufenzelle: jede tippbare Zelle traegt einen echten Knopf",
    zellen.map(function (td) {
      var b = td.querySelector(".schritt-knopf");
      return b ? b.tagName : null;
    }),
    ["BUTTON", "BUTTON", "BUTTON", "BUTTON", "BUTTON"]);

  // Der Name des Knopfes wird aus denselben Teilen gebaut, die sichtbar
  // dastehen. Genau diese Angaben fielen vorher weg.
  function labelVon(ziel, schrittId) {
    return ziel.querySelector('[data-schritt="' + schrittId + '"]')
               .querySelector(".schritt-knopf").getAttribute("aria-label");
  }
  pruefe("Stufenzelle: die Wartezeit wird mit vorgelesen",
    labelVon(mt, "s-teig-ruhen"),
    "Teig ruhen lassen, 30 Min, läuft von allein — Anweisung anzeigen");
  pruefe("Stufenzelle: die Gleichzeitigkeit auch",
    labelVon(mt, "s-fuellung"),
    "Füllung mischen, 15 Min, nebenher möglich — Anweisung anzeigen");
  pruefe("Stufenzelle: und die Temperatur",
    labelVon(gerendert("pfannkuchen"), "s-backen"),
    "ausbacken, 20 Min, 170 °C — Anweisung anzeigen");

  // Der Knopf muss auch tun, wozu er da ist (T-0038). Das war bis jetzt
  // ungeprueft, weil die Attrappe den Sprung nicht nachbilden konnte.
  var sp = gerendert("spaetzle");
  sp.querySelector('[data-schritt="s-teig"]').querySelector(".schritt-knopf").ausloesen("click");
  var sprungziel = document.getElementById("anweisung-s-teig");
  pruefe("Stufenzelle: der Knopf springt zum Wortlaut und hebt ihn hervor",
    [sprungziel.wurdeAngesprungen, sprungziel.classList.contains("ist-angesprungen")],
    [true, true]);

  // Abgehakt ist ein Zustand, kein Knopfdruck.
  var zutat = sp.querySelectorAll("td.zutat")[0];
  pruefe("Zutatenzelle: als Kontrollkaestchen ausgezeichnet",
    [zutat.getAttribute("role"), zutat.getAttribute("aria-checked")], ["checkbox", "false"]);
  zutat.ausloesen("click");
  pruefe("Zutatenzelle: und der Zustand geht beim Abhaken mit",
    [zutat.getAttribute("aria-checked"), zutat.classList.contains("abgehakt")], ["true", true]);
})();

// --- 5a5c. Kopf und Plan sind dieselbe Rechnung (T-0059) -------------
// Vorher speiste sich der Kopf aus drei Quellen: "Arbeit" aus dem
// JSON-Feld, "ohne Zutun" gerechnet, "gesamt" wieder aus dem JSON. Beide
// Faelle, in denen das auseinanderlaeuft, stehen hier — mit
// zusammengebauten Rezepten, weil der Bestand sie (noch) nicht hat.
(function () {
  function zeige(rezept) {
    var ziel = DOM.knotenBauen("div");
    ziel.className = "rezept";
    R.rezeptRendern(rezept, ziel);
    var kacheln = {};
    ziel.querySelectorAll(".kennzahl").forEach(function (k) {
      kacheln[k.querySelector(".kennzahl-label").textContent] =
        k.querySelector(".kennzahl-wert").textContent;
    });
    var ende = ziel.querySelector(".zeitachse-ende");
    return { kacheln: kacheln, achse: ende ? ende.textContent : null };
  }

  // Fall 1: ein Schritt, den das Grid nicht darstellen kann — zutatenlos
  // und ohne gueltige Vorstufe. grid.js meldet ihn und laesst ihn weg;
  // vorher zaehlte er trotzdem in den Kennzahlen, und der Kopf behauptete
  // 25 Minuten, waehrend die Achse bei 11 endete.
  var mitLoch = {
    id: "t", titel: "t", portionen: 2, zeit_aktiv_s: 60, zeit_gesamt_s: 1500,
    zutaten: [{ id: "z-a", name: "A", menge: 1, einheit: "g" }],
    schritte: [
      { id: "s-ofen", titel: "Ofen vorheizen", anweisung: "", dauer_s: 900,
        unbeaufsichtigt: true, zutaten: [], vorstufen: [] },
      { id: "s-a", titel: "a", anweisung: "", dauer_s: 60, zutaten: ["z-a"], vorstufen: [] },
      { id: "s-b", titel: "backen", anweisung: "", dauer_s: 600,
        unbeaufsichtigt: true, zutaten: [], vorstufen: ["s-a"] }
    ]
  };
  var loch = zeige(mitLoch);
  pruefe("Kennzahlen/DOM: ein nicht darstellbarer Schritt zaehlt auch im Kopf nicht",
    [loch.kacheln["Arbeit"], loch.kacheln["ohne Zutun"], loch.kacheln["gesamt"]],
    ["1 Min", "10 Min", "11 Min"]);
  pruefe("Kennzahlen/DOM: und die Achse sagt dasselbe",
    loch.achse, "11 Min");

  // Fall 2: ein Rezept nutzt den dokumentierten Puffer von zehn Prozent
  // ueber dem Plan (docs/schema.md, docs/konvertierung.md). Der Kopf darf
  // der Achse deswegen nicht widersprechen — beides ist der Plan.
  var mitPuffer = {
    id: "t2", titel: "t2", portionen: 2, zeit_aktiv_s: 660, zeit_gesamt_s: 1320,
    zutaten: [{ id: "z-a", name: "A", menge: 1, einheit: "g" }],
    schritte: [
      { id: "s-a", titel: "a", anweisung: "", dauer_s: 600, zutaten: ["z-a"], vorstufen: [] },
      { id: "s-b", titel: "ruhen", anweisung: "", dauer_s: 600,
        unbeaufsichtigt: true, zutaten: [], vorstufen: ["s-a"] }
    ]
  };
  var puffer = zeige(mitPuffer);
  pruefe("Kennzahlen/DOM: der erlaubte Puffer im JSON verbiegt den Kopf nicht",
    [puffer.kacheln["Arbeit"], puffer.kacheln["ohne Zutun"], puffer.kacheln["gesamt"]],
    ["10 Min", "10 Min", "20 Min"]);
  pruefe("Kennzahlen/DOM: Kopf und Achse bleiben auch dann deckungsgleich",
    puffer.achse, "20 Min");
})();

// --- 5a5h. Karte und Kopf sagen dasselbe (T-0070) --------------------
// Die Uebersichtskarte zeigte `zeit_gesamt_s` aus der Datei, der Kopf
// seit T-0059 den gerechneten Plan. Solange sich beide decken, faellt
// das nicht auf — bei allen fuenf Rezepten des Bestands tun sie das.
// Genau deshalb steht hier ein Rezept, das den erlaubten 10-%-Puffer
// AUSNUTZT: nur daran laesst sich sehen, welche Quelle die Karte liest.
(function () {
  // Plan: 600 + 1800 = 2400 s. Das Feld nennt 2640 (+10 %, erlaubt).
  var gedehnt = {
    schema: 1, id: "puffer-probe", titel: "Pufferprobe", portionen: 2,
    portionen_einheit: "Portionen", zeit_aktiv_s: 600, zeit_gesamt_s: 2640,
    quelle: null,
    zutaten: [{ id: "z-a", name: "A", menge: 1, einheit: "g", notiz: null }],
    schritte: [
      { id: "s-eins", titel: "eins", anweisung: "x", dauer_s: 600, zutaten: ["z-a"], vorstufen: [] },
      { id: "s-zwei", titel: "zwei", anweisung: "y", dauer_s: 1800,
        unbeaufsichtigt: true, zutaten: [], vorstufen: ["s-eins"] }
    ]
  };

  function karteVon(rezepte, titel) {
    var ziel = DOM.knotenBauen("div");
    R.uebersichtRendern(rezepte, ziel);
    var treffer = ziel.querySelectorAll(".rezept-karte").filter(function (k) {
      return k.querySelector(".karte-titel").textContent === titel;
    })[0];
    return treffer ? treffer.querySelector(".karte-fakten").textContent.split(" · ")[0] : null;
  }
  function kopfVon(rezept) {
    var ziel = DOM.knotenBauen("div");
    ziel.className = "rezept";
    R.rezeptRendern(rezept, ziel);
    return ziel.querySelectorAll(".kennzahl").map(function (k) {
      return k.querySelector(".kennzahl-label").textContent === "gesamt"
        ? k.querySelector(".kennzahl-wert").textContent : null;
    }).filter(Boolean)[0];
  }

  // 2400 s Plan = "40 Min"; 2640 s Feld waeren "44 Min".
  pruefe("Karte/Kopf: die Karte zeigt den Plan, nicht das JSON-Feld",
    karteVon([gedehnt], "Pufferprobe"), "40 Min");
  pruefe("Karte/Kopf: und der Kopf sagt dasselbe", kopfVon(gedehnt), "40 Min");

  // Und die Invariante ueber den echten Bestand: was auf der Karte steht,
  // steht auch im Kopf. Die kann kein Rezept zufaellig erfuellen, weil
  // sie beide Wege vergleicht statt einen davon nachzurechnen.
  var alle = dateien.map(function (d) {
    return JSON.parse(fs.readFileSync(path.join(rezeptOrdner, d), "utf8"));
  });
  var abweichungen = alle.map(function (r) {
    var k = karteVon(alle, r.titel), kopf = kopfVon(r);
    return k === kopf ? null : r.id + ": Karte " + k + " gegen Kopf " + kopf;
  }).filter(Boolean);
  pruefe("Karte/Kopf: in jedem Rezept dieselbe Gesamtzeit", abweichungen, []);
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

  // --- Druck (T-0065) ------------------------------------------------
  // Das hier ist eine QUELLTEXT-Pruefung, und sie weiss das: ohne
  // Browser laesst sich kein Druckbild messen. Sie haelt genau die eine
  // Kopplung fest, die man beim Aendern uebersieht — die Mindestbreite
  // steht als INLINE-Stil an der Tabelle (render.js, breitenAnwenden),
  // und nur `!important` kommt dagegen an. Faellt das weg, laeuft die
  // Tabelle ueber den Seitenrand und wird abgeschnitten; auf dem
  // Bildschirm sieht man davon nichts. Das Druckbild selbst wurde im
  // Browser nachgesehen.
  // --- `hidden` muss verbergen (T-0067) ------------------------------
  // Auch das ist eine Quelltext-Pruefung, und auch sie weiss das. Der
  // Befund kam aus dem Browser: `.einkauf-leiste` hatte `display: flex`,
  // der Code setzte `hidden = true`, und die Leiste stand trotzdem da —
  // die Regel des Browsers verliert gegen jede eigene. Die Attrappe kennt
  // kein CSS und sah nur `hidden === true`.
  //
  // Statt an jeder Klasse einzeln steht die Gegenregel einmal global.
  // Diese Pruefung haelt fest, dass sie da ist; wer sie entfernt, macht
  // jedes `hidden` im Projekt lautlos wirkungslos.
  pruefe("CSS: hidden verbirgt wirklich",
    /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(css), true);

  var druck = /@media\s+print\s*\{/.test(css);
  pruefe("Druck: es gibt ueberhaupt Druckregeln", druck, true);
  pruefe("Druck: die Mindestbreite der Tabelle wird ueberstimmt",
    /min-width:\s*0\s*!important/.test(css), true);
  // Beide Ansichten stehen im DOM. Welche gedruckt wird, darf nicht von
  // der Seitenbreite abhaengen, die der Drucker gerade meldet.
  pruefe("Druck: genau eine der beiden Ansichten wird gedruckt",
    [/\.stufenliste\s*\{\s*display:\s*none\s*!important/.test(css),
     /\.grid-rahmen\s*\{\s*display:\s*block\s*!important/.test(css)],
    [true, true]);
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
  // `gefaess` ist laut Schema optional (T-0073): gezaehlt wird gegen die
  // Rezepte, die eines angeben — und eines ohne darf keines zeigen.
  var stellen = [], mitGefaess = 0;
  zuPruefen.forEach(function (eintrag) {
    var r = JSON.parse(fs.readFileSync(path.join(eintrag.ordner, eintrag.datei), "utf8"));
    if (r.gefaess) mitGefaess++;
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
  pruefe("Ausstattung: genau eine je Rezept mit gefaess, keine ohne",
    stellen.length, mitGefaess);
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

// --- 5a5e. Der Timer meldet sich (T-0063) ----------------------------
// Die Uhr rechnete seit T-0045 richtig — sie sagte nur niemandem
// Bescheid. Beim Kochen liegt das Telefon mit dem Display nach unten
// neben dem Herd; ein Timer, den man ansehen muss, ist keiner.
//
// Geprueft wird nicht der Ton (den gibt es headless nicht), sondern das
// Verhalten: kommt der Alarm, kommt er GENAU EINMAL, und bleibt der
// Bildschirm nur waehrend des Kochens wach.
(function () {
  var sp = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, "spaetzle.json"), "utf8"));
  var ziel = DOM.knotenBauen("div");
  ziel.className = "rezept";
  R.rezeptRendern(sp, ziel);

  var gezaehlt = { vorbereitet: 0, alarm: 0, wachAn: 0, wachAus: 0 };
  var geber = {
    vorbereiten: function () { gezaehlt.vorbereitet++; },
    abgelaufen: function () { gezaehlt.alarm++; }
  };
  var wachhalter = {
    an: function () { gezaehlt.wachAn++; },
    aus: function () { gezaehlt.wachAus++; }
  };

  var km = K.kochmodusBauen(G.gridModellBauen(sp), ziel, geber, wachhalter);
  km.starten();
  pruefe("Alarm: der Bildschirm wird beim Start wachgehalten",
    [gezaehlt.wachAn, gezaehlt.wachAus], [1, 0]);
  pruefe("Alarm: vor dem Start ist nichts zu melden", gezaehlt.alarm, 0);

  // Timer starten und die Wanduhr ueber das Ende schieben — derselbe
  // Ablauf wie im gedrosselten Tab.
  var echtInterval = globalThis.setInterval, echtClear = globalThis.clearInterval;
  var tick = null;
  globalThis.setInterval = function (fn) { tick = fn; return 1; };
  globalThis.clearInterval = function () {};
  km.timerUmschalten();
  pruefe("Alarm: der Start bereitet den Ton vor (die Nutzergeste)",
    gezaehlt.vorbereitet, 1);
  pruefe("Alarm: solange die Zeit laeuft, schweigt er", gezaehlt.alarm, 0);

  var echteUhr = Date.now;
  Date.now = function () { return echteUhr() + 999999; };
  tick();
  pruefe("Alarm: beim Ablaufen kommt er", gezaehlt.alarm, 1);
  // Und zwar einmal. Im Hintergrund-Tab holt der naechste Tick die
  // Wanduhr nach — er darf den Alarm nicht wiederholen.
  tick();
  tick();
  pruefe("Alarm: weitere Ticks wiederholen ihn nicht", gezaehlt.alarm, 1);
  Date.now = echteUhr;
  globalThis.setInterval = echtInterval;
  globalThis.clearInterval = echtClear;

  km.beenden();
  pruefe("Alarm: nach dem Beenden darf der Bildschirm wieder ausgehen",
    [gezaehlt.wachAn, gezaehlt.wachAus], [1, 1]);

  // Die eingebauten Geber duerfen in einer Umgebung ohne Vibration, ohne
  // Ton und ohne Wake Lock nicht werfen — sonst reisst der Kochmodus an
  // einer Zugabe ab. Genau diese Umgebung ist hier.
  var echt = K.signalgeberBauen();
  var geworfen = null;
  try { echt.vorbereiten(); echt.abgelaufen(); } catch (e) { geworfen = e.message; }
  var wach = K.wachhalterBauen();
  try { wach.an(); wach.aus(); } catch (e) { geworfen = e.message; }
  pruefe("Alarm: ohne Vibration, Ton und Wake Lock wirft nichts", geworfen, null);
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

// --- 5a5i. Der Kochmodus folgt der Stufe (T-0071) -------------------
// Bis T-0071 setzte jeder Stufenwechsel nur Klassen; am Telefon lag die
// aktive Stufe ab Schritt 2-3 unter der Leiste, am Tablet die neue Zutat
// unterhalb des Bildschirms. Geprueft wird, WELCHER Knoten angesprungen
// wird — die Attrappe merkt sich das —, und zwar je Ansicht: was CSS
// verbirgt, stellt `unsichtbar` nach.
(function () {
  var K = global.RezeptKochmodus;
  var still = { vorbereiten: function () {}, abgelaufen: function () {} };
  var ohneWache = { an: function () {}, aus: function () {} };

  function aufbauen(id, verbergen) {
    var r = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, id + ".json"), "utf8"));
    var ziel = DOM.knotenBauen("div");
    ziel.className = "rezept";
    R.rezeptRendern(r, ziel);
    ziel.querySelectorAll("[data-schritt], .zutat, .menge").forEach(function (k) {
      if (verbergen(k)) k.unsichtbar = true;
    });
    return { ziel: ziel, km: K.kochmodusBauen(G.gridModellBauen(r), ziel, still, ohneWache) };
  }

  // Liefert, was beim Wechsel auf Stufe `i` angesprungen wurde.
  function sprungBei(a, i) {
    var alle = a.ziel.querySelectorAll("[data-schritt], .zutat");
    alle.forEach(function (k) { k.wurdeAngesprungen = false; });
    a.km.gehe(i);
    return alle.filter(function (k) { return k.wurdeAngesprungen; });
  }

  function beschreiben(k) {
    return k.tagName + (k.dataset.schritt ? ":" + k.dataset.schritt : "") +
      (k.classList.contains("zutat") ? ":" + k.querySelector(".zutat-name").textContent : "");
  }

  // Telefon: Tabelle verborgen, die Stufenliste traegt den Wortlaut.
  var telefon = aufbauen("maultaschen", function (k) { return k.tagName === "TD"; });
  telefon.km.starten();
  var falsch = telefon.km.stufen.map(function (s, i) {
    var t = sprungBei(telefon, i);
    return t.length === 1 && t[0].tagName === "ARTICLE" && t[0].dataset.schritt === s.schritt.id
      ? null : "Stufe " + (i + 1) + ": " + t.map(beschreiben).join(", ");
  }).filter(Boolean);
  telefon.km.beenden();
  pruefe("Kochmodus/Telefon: jede Stufe springt zu ihrem Eintrag der Stufenliste",
    falsch, []);

  // Tablet: Stufenliste verborgen. "in Bruehe ziehen" spannt die ganze
  // Tabelle; die einzige neue Zutat steht unten — die zaehlt.
  var tablet = aufbauen("maultaschen", function (k) { return k.tagName === "ARTICLE"; });
  tablet.km.starten();
  var letzte = tablet.km.stufen.length - 1;
  var t = sprungBei(tablet, letzte);
  tablet.km.beenden();
  pruefe("Kochmodus/Tablet: die letzte Maultaschen-Stufe springt zur neuen Zutat, nicht zur Zelle",
    t.map(beschreiben), ["TD:Fleischbrühe"]);

  // Ohne neue Zutat bleibt die Zelle (Omelett "fuellen und falten").
  var omelett = aufbauen("omelett-mit-pilzen", function (k) { return k.tagName === "ARTICLE"; });
  omelett.km.starten();
  var ohneNeue = omelett.km.stufen.filter(function (s) { return s.eigeneZeilen.length === 0; })[0];
  var o = sprungBei(omelett, ohneNeue.index);
  omelett.km.beenden();
  pruefe("Kochmodus/Tablet: eine Stufe ohne neue Zutat springt zu ihrer Zelle",
    o.map(beschreiben), ["TD:" + ohneNeue.schritt.id]);
  // Ausrichtung: Zelle und Eintrag am Anfang (sie sind oft hoeher als der
  // freie Platz), die einzelne Zutatenzeile nur so weit wie noetig.
  pruefe("Kochmodus: Zelle am Anfang, Zutatenzeile nur so weit wie noetig",
    [o[0].angesprungenMit.block, t[0].angesprungenMit.block], ["start", "nearest"]);

  // Reduzierte Bewegung: gesprungen wird trotzdem, nur ohne Animation.
  var echtMM = global.matchMedia;
  global.matchMedia = function (q) { return { matches: /reduce/.test(q) }; };
  var ruhig = aufbauen("maultaschen", function (k) { return k.tagName === "TD"; });
  ruhig.km.starten();
  var r1 = sprungBei(ruhig, 1);
  ruhig.km.beenden();
  global.matchMedia = echtMM;
  pruefe("Kochmodus: bei reduzierter Bewegung ohne Animation",
    r1.map(function (k) { return k.angesprungenMit && k.angesprungenMit.behavior; }), ["auto"]);
})();

// --- 5a5j. Eine Uhr je Stufe, Alarm bis zur Quittung (T-0072) -------
// Bis T-0072 setzte jeder Stufenwechsel die einzige Uhr zurueck — bei
// "Teig ruhen lassen", nach dem man weiterblaettert. Der Alarm klang
// einmal und war dann still; ein Neuladen verlor Stufe und Uhr.
(function () {
  var K = global.RezeptKochmodus;

  // Erst das Uhrwerk allein, mit einstellbarer Wanduhr.
  var t = 0;
  var werk = K.uhrwerkBauen([60, 120, null], function () { return t; });
  werk.umschalten(0);
  t = 10000;
  werk.umschalten(1);
  t = 30000;
  pruefe("Uhrwerk: eine gestartete Uhr laeuft weiter, waehrend eine andere startet",
    [werk.uhr(0).stand(), werk.uhr(1).stand(), werk.uhr(2).stand()], [30, 100, null]);

  t = 61000;
  var meldungen = [werk.pruefen(), werk.pruefen()];
  t = 61000 + K.WIEDERHOLEN_MS;
  meldungen.push(werk.pruefen());
  werk.quittieren(0);
  t = 200000;
  meldungen.push(werk.pruefen().filter(function (i) { return i === 0; }));
  pruefe("Uhrwerk: Alarm beim Ablauf, nicht bei jedem Tick, wieder nach der Frist, still nach Quittung",
    meldungen, [[0], [], [0], []]);
  pruefe("Uhrwerk: quittiert heisst zurueck auf die volle Zeit",
    [werk.uhr(0).stand(), werk.uhr(0).laeuft(), werk.abgelaufen(0)], [60, false, false]);

  // Der verspaetete Tick (Review zustand-11): der Knopf zeigt noch
  // "Pause", die Wanduhr ist laengst drueber. Der Druck darf nicht neu
  // starten, er muss melden.
  t = 0;
  var spaet = K.uhrwerkBauen([60], function () { return t; });
  spaet.umschalten(0);
  t = 100000;
  pruefe("Uhrwerk: Druck nach unbemerktem Ablauf meldet statt neu zu starten",
    [spaet.umschalten(0), spaet.abgelaufen(0), spaet.uhr(0).stand()], [[0], true, 0]);

  // Herstellen aus dem Merker prueft die Form (Review zustand-9).
  var heil = K.uhrwerkBauen([60, 120, null], function () { return t; });
  var gesichert = werk.sichern();
  pruefe("Uhrwerk: kaputte Staende werden abgewiesen, heile uebernommen",
    [heil.herstellen("x"), heil.herstellen([{ rest: "a", endeAt: null, gemeldet: null }, {}, {}]),
     heil.herstellen(gesichert), heil.uhr(1).stand() === werk.uhr(1).stand()],
    [false, false, true, true]);

  // Dann der Kochmodus im DOM.
  var sp = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, "spaetzle.json"), "utf8"));
  var echtInterval = globalThis.setInterval, echtClear = globalThis.clearInterval;
  var tick = null;
  globalThis.setInterval = function (fn) { tick = fn; return 1; };
  globalThis.clearInterval = function () {};
  var echteUhr = Date.now, versatz = 0;
  Date.now = function () { return echteUhr() + versatz; };
  var gezaehlt = { alarm: 0 };
  var geber = { vorbereiten: function () {}, abgelaufen: function () { gezaehlt.alarm++; } };
  var ohneWache = { an: function () {}, aus: function () {} };

  // Ohne Ablage gerendert: rezeptRendern nimmt einen gemerkten Kochstand
  // sonst selbst auf und baute daneben eine zweite, verborgene Instanz.
  // Diesen Weg prueft der Fall "rezeptRendern nimmt ... auf" eigens.
  function neu() {
    var ziel = DOM.knotenBauen("div");
    ziel.className = "rezept";
    var ablage = globalThis.localStorage;
    delete globalThis.localStorage;
    try { R.rezeptRendern(sp, ziel); } finally { if (ablage) globalThis.localStorage = ablage; }
    return K.kochmodusBauen(G.gridModellBauen(sp), ziel, geber, ohneWache);
  }
  // Die zuletzt angehaengte Leiste ist die der laufenden Instanz; fruehere
  // Instanzen dieses Abschnitts (das "Neuladen") lassen ihre stehen.
  function leiste() {
    var alle = document.body.querySelectorAll(".koch-leiste");
    return alle.length ? alle[alle.length - 1] : null;
  }

  var km = neu();
  km.starten();
  km.gehe(1);
  km.timerUmschalten();
  km.gehe(2);
  var knoepfe = leiste().querySelectorAll(".koch-nebenher-knopf");
  pruefe("Kochmodus: Weiter laesst die Uhr der vorigen Stufe laufen und zeigt sie mit Namen",
    [km.zustand().laufend, knoepfe.length,
     knoepfe.length ? knoepfe[0].textContent.indexOf(km.stufen[1].schritt.titel) === 0 : false],
    [[1], 1, true]);
  if (knoepfe[0]) knoepfe[0].ausloesen("click");
  pruefe("Kochmodus: der Knopf der laufenden Uhr springt zu ihrer Stufe",
    [km.zustand().aktiv, km.zustand().laeuft], [1, true]);

  // Ablauf: sichtbar, wiederholt, bis quittiert.
  versatz = (km.stufen[1].schritt.dauer_s + 5) * 1000;
  tick();
  var meldung = leiste().querySelector(".koch-meldung");
  var warSichtbar = !meldung.hidden;
  var nannte = meldung.textContent.indexOf(km.stufen[1].schritt.titel) > -1;
  tick();
  var nachZweitemTick = gezaehlt.alarm;
  versatz += K.WIEDERHOLEN_MS;
  tick();
  var nachFrist = gezaehlt.alarm;
  meldung.querySelector("button").ausloesen("click");
  versatz += 60000;
  tick();
  pruefe("Kochmodus: abgelaufen steht sichtbar mit Stufenname da",
    [warSichtbar, nannte], [true, true]);
  pruefe("Kochmodus: Alarm einmal je Frist, nach Quittung still",
    [nachZweitemTick, nachFrist, gezaehlt.alarm, meldung.hidden], [1, 2, 2, true]);

  // Beenden mit laufender Uhr fragt nach.
  km.timerUmschalten();
  var gefragt = 0;
  global.confirm = function () { gefragt++; return false; };
  km.beenden();
  var bliebOffen = km.zustand().offen;
  global.confirm = function () { gefragt++; return true; };
  km.beenden();
  delete global.confirm;
  pruefe("Kochmodus: Beenden mit laufender Uhr fragt nach und respektiert die Antwort",
    [gefragt, bliebOffen, km.zustand().offen], [2, true, false]);

  // Der Kochstand ueberlebt ein Neuladen — auch ueber rezeptRendern.
  globalThis.localStorage = DOM.speicherBauen();
  versatz = 0;
  var vorher = neu();
  vorher.starten();
  vorher.gehe(2);
  vorher.timerUmschalten();
  var restVorher = vorher.zustand().verbleibend;
  document.body.classList.remove("kochmodus");
  var nachher = neu();
  nachher.starten();
  pruefe("Kochmodus: nach dem Neuladen dieselbe Stufe, die Uhr laeuft weiter",
    [nachher.zustand().aktiv, nachher.zustand().laufend, nachher.zustand().verbleibend <= restVorher],
    [2, [2], true]);

  var ziel2 = DOM.knotenBauen("div");
  ziel2.className = "rezept";
  var modell2 = R.rezeptRendern(sp, ziel2);
  pruefe("Kochmodus: rezeptRendern nimmt einen gemerkten Kochstand von selbst auf",
    modell2.kochmodus() ? modell2.kochmodus().zustand().aktiv : null, 2);
  if (modell2.kochmodus()) modell2.kochmodus().beenden();
  var nachBeenden = globalThis.localStorage.getItem(M.PRAEFIX + "koch:spaetzle");
  var dritter = neu();
  dritter.starten();
  pruefe("Kochmodus: Beenden vergisst den Kochstand",
    [nachBeenden, dritter.zustand().aktiv], [null, 0]);
  dritter.beenden();

  globalThis.localStorage.setItem(M.PRAEFIX + "koch:spaetzle",
    JSON.stringify({ stand: Date.now(), daten: { aktiv: "zwei", uhren: "kaputt" } }));
  var kaputt = neu();
  var geworfen = null;
  try { kaputt.starten(); } catch (e) { geworfen = e.message; }
  pruefe("Kochmodus: ein kaputter Kochstand faellt auf Stufe 1 zurueck, ohne Wurf",
    [geworfen, kaputt.zustand().aktiv], [null, 0]);
  kaputt.beenden();

  // Heile Uhren, aber eine Stufe, die es nicht gibt oder keine ganze Zahl
  // ist: je ein Fall, damit die Pruefung von aktiv nicht im Schatten der
  // Uhren-Pruefung steht. Geprueft wird auch, dass die Leiste gezeichnet
  // ist — bei 99 kehrt gehe() frueh zurueck, und die Leiste bliebe leer.
  var heileUhren = K.uhrwerkBauen(km.stufen.map(function (s) { return s.schritt.dauer_s; })).sichern();
  var ergebnisse = [99, 1.5, "2"].map(function (wert) {
    globalThis.localStorage.setItem(M.PRAEFIX + "koch:spaetzle",
      JSON.stringify({ stand: Date.now(), daten: { aktiv: wert, uhren: heileUhren } }));
    var probe = neu();
    var fehler = null;
    try { probe.starten(); } catch (e) { fehler = e.message; }
    var ergebnis;
    try {
      var titel = leiste() ? leiste().querySelector(".koch-titel").textContent : null;
      ergebnis = [fehler, probe.zustand().aktiv, titel];
    } catch (e) { ergebnis = [fehler || e.message]; }
    try { probe.beenden(); } catch (e) { /* zaehlt oben */ }
    return ergebnis;
  });
  var erwartet = [null, 0, km.stufen[0].schritt.titel];
  pruefe("Kochmodus: Stufe 99, 1.5 oder \"2\" im Merker faellt auf Stufe 1 zurueck",
    ergebnisse, [erwartet, erwartet, erwartet]);

  delete globalThis.localStorage;
  Date.now = echteUhr;
  globalThis.setInterval = echtInterval;
  globalThis.clearInterval = echtClear;
})();

// --- 5a5k. Zeitmass-Aussagen (T-0074) --------------------------------
(function () {
  function rezeptAus(schritte) {
    var zutaten = [];
    schritte.forEach(function (st) {
      st.zutaten.forEach(function (id) {
        zutaten.push({ id: id, name: id, menge: 100, einheit: "g", notiz: null });
      });
    });
    return { schema: 1, id: "probe", titel: "Probe", portionen: 2,
             zeit_aktiv_s: null, zeit_gesamt_s: null, quelle: null,
             zutaten: zutaten, schritte: schritte };
  }
  function stufe(id, dauer, zutaten, vorstufen, ruhe) {
    var st = { id: id, titel: id, anweisung: id, dauer_s: dauer, zutaten: zutaten, vorstufen: vorstufen };
    if (ruhe) st.unbeaufsichtigt = true;
    return st;
  }
  function rendern(r) {
    var ziel = DOM.knotenBauen("div");
    ziel.className = "rezept";
    var ablage = globalThis.localStorage;
    delete globalThis.localStorage;
    try { R.rezeptRendern(r, ziel); } finally { if (ablage) globalThis.localStorage = ablage; }
    return ziel;
  }

  // (b) Drei parallele Haende-Straenge zu je 10 Min, dann 1 Min
  // Zusammenfuehrung. Allein 31 Min, unbegrenzt viele Haende 11 Min —
  // ZU ZWEIT aber 21: zwei Straenge gleichzeitig, der dritte danach.
  var drei = [600, 600, 600, 60], dreiVor = [[], [], [], [0, 1, 2]];
  pruefe("Zu zweit: drei parallele Straenge brauchen zu zweit 21 Min, nicht den kritischen Pfad",
    [Z.realeGesamtdauer(drei, dreiVor), Z.zuZweit(drei, dreiVor), Z.gesamtdauer(drei, dreiVor)],
    [1860, 1260, 660]);
  pruefe("Zu zweit: mit einer Person ist der Plan unveraendert",
    Z.plan(drei, dreiVor, null, 1).gesamt, Z.plan(drei, dreiVor).gesamt);
  var warnung = rendern(rezeptAus([
    stufe("s-a", 600, ["z-a"], []), stufe("s-b", 600, ["z-b"], []),
    stufe("s-c", 600, ["z-c"], []), stufe("s-d", 60, ["z-d"], ["s-a", "s-b", "s-c"])
  ])).querySelector(".kennzahl-warnung");
  pruefe("Zu zweit: die Warnung im Kopf nennt den Zweipersonen-Plan",
    warnung ? /Zu zweit wären es 21 Min/.test(warnung.textContent) : "keine Warnung", true);

  // (c) Schmoren endet in Spalte 2, der Salat in Spalte 3 viel frueher:
  // das Planende gehoert an das Schmoren.
  var zwei = rendern(rezeptAus([
    stufe("s-braten", 600, ["z-fleisch"], []),
    stufe("s-schmoren", 3600, ["z-wein"], ["s-braten"], true),
    stufe("s-salat", 300, ["z-salat"], []),
    stufe("s-dressing", 300, ["z-essig"], ["s-salat"])
  ]));
  var marken = zwei.querySelectorAll(".zeitachse-marke");
  var mitEnde = marken.map(function (m, i) { return m.querySelector(".zeitachse-ende") ? i : -1; })
    .filter(function (i) { return i > -1; });
  var schmorSpalte = G.gridModellBauen(rezeptAus([
    stufe("s-braten", 600, ["z-fleisch"], []),
    stufe("s-schmoren", 3600, ["z-wein"], ["s-braten"], true),
    stufe("s-salat", 300, ["z-salat"], []),
    stufe("s-dressing", 300, ["z-essig"], ["s-salat"])
  ])).spalten.filter(function (sp) { return sp.schritt.id === "s-schmoren"; })[0].spalte;
  pruefe("Zeitachse: das Planende steht an der Spalte, die zuletzt endet",
    [mitEnde, marken.length - 1 !== schmorSpalte], [[schmorSpalte], true]);

  // (d) Kein darstellbarer Schritt: dasselbe Format wie sonst, und die
  // Seite zeigt ihre Problembox, statt in breitenAnwenden abzustuerzen.
  var leer = Z.spaltenbreiten([]);
  var geworfen = null, box = null;
  try {
    box = rendern(rezeptAus([stufe("s-ofen", 900, [], [])])).querySelector(".probleme");
  } catch (e) { geworfen = e.message; }
  pruefe("Breiten: ohne Stufen dasselbe Format, die Seite zeigt ihre Probleme",
    [Array.isArray(leer.zutatenPx) && leer.zutatenPx.length, Array.isArray(leer.achsenanteil), geworfen, !!box],
    [2, true, null, true]);
})();

// --- 5a5g. Kopplung, die stehen bleibt (T-0066) ----------------------
// Auf einem Tablet steht die Tabelle (ab 600 px), aber es gibt kein
// Ueberfahren — die Kopplung Stufe/Zutaten war dort nicht erreichbar und
// wurde von `@media (hover: none)` sogar sichtbar abgeschaltet. Der Tipp
// auf die Stufenzelle setzt sie jetzt fest. Keine neue Geste: derselbe
// Tipp springt seit T-0038 zum Wortlaut.
(function () {
  var mt = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, "maultaschen.json"), "utf8"));
  var ziel = DOM.knotenBauen("div");
  ziel.className = "rezept";
  var modell = R.rezeptRendern(mt, ziel);

  function fest() {
    return ziel.querySelectorAll(".gekoppelt-fest").map(function (n) {
      return n.dataset.schritt || ("zeile" + n.dataset.zeile);
    });
  }
  function tippen(id) {
    var td = ziel.querySelector('[data-schritt="' + id + '"]');
    (td.querySelector(".schritt-knopf") || td).ausloesen("click");
  }

  pruefe("Kopplung: vor dem Tippen ist nichts festgesetzt", fest(), []);

  // "Nudelteig kneten" bringt vier Zutaten mit — Zelle plus je Zeile die
  // Mengen- und die Zutatenzelle in beiden Ansichten.
  tippen("s-teig");
  var nachTipp = fest();
  // Die Zutatenzellen stehen im DOM VOR der Stufenzelle (die Zeile
  // beginnt links), deshalb wird gefiltert statt indiziert.
  pruefe("Kopplung: der Tipp setzt die Stufe fest",
    nachTipp.filter(function (x) { return x.indexOf("zeile") !== 0; }), ["s-teig"]);
  // Vier Zutaten, je Zeile vier Zellen: Menge und Zutat in der Tabelle
  // UND in der Stufenliste. Beide Ansichten stehen seit T-0040
  // gleichzeitig im DOM und tragen dieselben `data-zeile`-Marker; die
  // Marke wandert deshalb ueber beide, sichtbar ist sie (per CSS) nur in
  // der Tabelle. Dieselbe Mechanik wie beim Kochmodus.
  pruefe("Kopplung: und ihre Zutatenzeilen gleich mit, in beiden Ansichten",
    nachTipp.filter(function (x) { return x.indexOf("zeile") === 0; }).length, 16);

  // Eine andere Stufe uebernimmt die Marke, statt sie zu verdoppeln.
  tippen("s-fuellung");
  pruefe("Kopplung: eine andere Stufe uebernimmt, es bleibt bei einer",
    fest().filter(function (x) { return x.indexOf("zeile") !== 0; }), ["s-fuellung"]);

  // Zweiter Tipp auf dieselbe loest.
  tippen("s-fuellung");
  pruefe("Kopplung: der zweite Tipp auf dieselbe Stufe loest sie", fest(), []);

  // Im Kochmodus fuehrt die Stufennavigation. Eine stehengebliebene
  // Marke waere dort eine zweite, konkurrierende Hervorhebung.
  tippen("s-teig");
  pruefe("Kopplung: vor dem Kochmodus steht sie", fest().length > 0, true);
  var km = K.kochmodusBauen(modell, ziel);
  modell.kopplung().loesen();
  km.starten();
  pruefe("Kopplung: der Kochmodus raeumt sie weg", fest(), []);
  // Und waehrend er laeuft, faengt kein Tipp eine neue an.
  tippen("s-teig");
  pruefe("Kopplung: im Kochmodus setzt ein Tipp nichts fest", fest(), []);
  km.beenden();
})();

// --- 5a5f. Was die Seite sich merkt (T-0064) -------------------------
// Bis hierher lebte jeder Zustand nur als CSS-Klasse: ein Neuladen
// loeschte Haken, Portionswahl und Auswahl. Die Gegenrichtung waere
// genauso falsch — den Haken von gestern will beim Kochen niemand sehen.
// Der Unterschied ist die Zeit, also haengt alles an einem Verfallsdatum.
(function () {
  // Erst die Ablage allein, mit gestellter Uhr.
  var speicher = DOM.speicherBauen();
  var jetzt = 1700000000000;
  var merker = M.bauen(speicher, function () { return jetzt; });

  merker.schreiben("probe", { a: 1 });
  pruefe("Merker: was hineingeht, kommt heraus", merker.lesen("probe"), { a: 1 });

  jetzt += 23 * 60 * 60 * 1000;
  pruefe("Merker: nach 23 Stunden steht es noch", merker.lesen("probe"), { a: 1 });
  jetzt += 2 * 60 * 60 * 1000;
  pruefe("Merker: nach 25 Stunden ist es weg", merker.lesen("probe"), null);
  // Und zwar wirklich weg, nicht nur verschwiegen — sonst waechst die
  // Ablage mit jedem Rezept, das man einmal geoeffnet hat.
  pruefe("Merker: der abgelaufene Eintrag wird auch geloescht",
    speicher.getItem(M.PRAEFIX + "probe"), null);

  // Fremder oder kaputter Inhalt darf die Seite nicht aufhalten.
  speicher.setItem(M.PRAEFIX + "kaputt", "{kein json");
  pruefe("Merker: kaputter Eintrag liefert nichts", merker.lesen("kaputt"), null);
  speicher.setItem(M.PRAEFIX + "ohnestand", JSON.stringify({ daten: 1 }));
  pruefe("Merker: Eintrag ohne Zeitstempel liefert nichts", merker.lesen("ohnestand"), null);
  // Eine verstellte Uhr macht das Alter unbeurteilbar.
  merker.schreiben("zukunft", { a: 1 });
  jetzt -= 60 * 60 * 1000;
  pruefe("Merker: ein Stand aus der Zukunft gilt nicht", merker.lesen("zukunft"), null);

  // Ohne Ablage (privates Fenster, file://, voller Speicher) laeuft alles
  // weiter, nur ohne Gedaechtnis.
  var ohne = M.bauen({
    getItem: function () { throw new Error("SecurityError"); },
    setItem: function () { throw new Error("QuotaExceededError"); },
    removeItem: function () { throw new Error("SecurityError"); }
  }, function () { return jetzt; });
  var geworfen = null;
  try {
    ohne.schreiben("x", { a: 1 });
    ohne.lesen("x");
    ohne.vergessen("x");
  } catch (e) { geworfen = e.message; }
  pruefe("Merker: eine Ablage, die wirft, wirft nicht weiter", geworfen, null);
  pruefe("Merker: und meldet ehrlich, dass nichts gespeichert wurde",
    ohne.schreiben("x", { a: 1 }), false);

  // --- Jetzt am echten DOM ------------------------------------------
  globalThis.localStorage = DOM.speicherBauen();

  var sp = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, "spaetzle.json"), "utf8"));
  function zeigen() {
    var ziel = DOM.knotenBauen("div");
    ziel.className = "rezept";
    R.rezeptRendern(sp, ziel);
    return ziel;
  }

  var erst = zeigen();
  erst.querySelectorAll("td.zutat")[0].ausloesen("click");
  erst.querySelectorAll("td.zutat")[2].ausloesen("click");
  erst.querySelectorAll(".portionen-knopf")[3].ausloesen("click");   // 8 Portionen
  var hakenVorher = erst.querySelectorAll(".abgehakt").length;

  var wieder = zeigen();
  pruefe("Merker/DOM: die Portionszahl ueberlebt das Neuladen",
    wieder.querySelectorAll(".portionen-knopf.ist-aktiv").map(function (k) {
      return k.textContent;
    }), ["8"]);
  pruefe("Merker/DOM: und die Mengen stehen passend dazu",
    wieder.querySelectorAll(".menge")[0].textContent, "800 g");
  pruefe("Merker/DOM: die Haken ueberleben es auch, in beiden Ansichten",
    wieder.querySelectorAll(".abgehakt").length, hakenVorher);
  pruefe("Merker/DOM: und aria-checked geht mit",
    wieder.querySelectorAll("td.zutat")[0].getAttribute("aria-checked"), "true");

  // Abhaken zuruecknehmen wirkt auch auf die Ablage.
  wieder.querySelectorAll("td.zutat")[0].ausloesen("click");
  var drittes = zeigen();
  pruefe("Merker/DOM: ein zurueckgenommener Haken bleibt zurueckgenommen",
    drittes.querySelectorAll(".abgehakt").length, hakenVorher - 4);

  // Eine Portionszahl, die es nicht mehr gibt, wird verworfen statt
  // gezeigt — sonst steht im Kopf eine Zahl, die kein Knopf traegt.
  globalThis.localStorage.setItem(M.PRAEFIX + "rezept:spaetzle",
    JSON.stringify({ stand: Date.now(), daten: { portionen: 7, abgehakt: [] } }));
  pruefe("Merker/DOM: eine unmoegliche Portionszahl faellt auf die Basis zurueck",
    zeigen().querySelectorAll(".portionen-knopf.ist-aktiv").map(function (k) {
      return k.textContent;
    }), ["4"]);

  // Einkaufsliste: dieselbe Frage, andere Liste.
  globalThis.localStorage = DOM.speicherBauen();
  var mt = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, "maultaschen.json"), "utf8"));
  function einkauf() {
    var ziel = DOM.knotenBauen("div");
    R.einkaufRendern([{ rezept: sp, portionen: 4 }, { rezept: mt, portionen: 4 }], ziel);
    return ziel;
  }
  var liste1 = einkauf();
  liste1.querySelectorAll(".einkauf-posten")[1].ausloesen("click");
  liste1.querySelectorAll(".einkauf-posten")[3].ausloesen("click");
  var namenVorher = liste1.querySelectorAll(".einkauf-posten.abgehakt").map(function (li) {
    return li.querySelector(".posten-name").textContent;
  });
  pruefe("Merker/DOM: zwei Posten abgehakt", namenVorher.length, 2);
  pruefe("Merker/DOM: die Haken der Einkaufsliste ueberleben das Neuladen",
    einkauf().querySelectorAll(".einkauf-posten.abgehakt").map(function (li) {
      return li.querySelector(".posten-name").textContent;
    }), namenVorher);

  // Uebersicht: die Auswahl und die Leiste, die daran haengt.
  globalThis.localStorage = DOM.speicherBauen();
  var alle = dateien.map(function (d) {
    return JSON.parse(fs.readFileSync(path.join(rezeptOrdner, d), "utf8"));
  });
  var u1 = DOM.knotenBauen("div");
  R.uebersichtRendern(alle, u1);
  pruefe("Merker/DOM: ohne Auswahl bleibt die Leiste verborgen",
    u1.querySelector(".einkauf-leiste").hidden, true);
  u1.querySelectorAll(".karte-wahl input")[0].checked = true;
  u1.querySelectorAll(".karte-wahl input")[0].ausloesen("change");

  var u2 = DOM.knotenBauen("div");
  R.uebersichtRendern(alle, u2);
  pruefe("Merker/DOM: die Auswahl der Uebersicht ueberlebt",
    u2.querySelectorAll(".karte-wahl input:checked").length, 1);
  pruefe("Merker/DOM: und die Leiste kommt gleich mit",
    [u2.querySelector(".einkauf-leiste").hidden,
     u2.querySelector(".einkauf-zaehler").textContent],
    [false, "1 Rezept gewählt"]);

  delete globalThis.localStorage;
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

// --- 6b. Uebersicht und Einkaufsliste holen frisch (T-0061) ----------
// T-0047 hat den Ladeweg des EINZELNEN Rezepts geradegezogen, die Liste
// blieb am Manifest haengen. Wer eine JSON aenderte und build-manifest
// vergass, sah das Rezept mit neuen Mengen und die Einkaufsliste mit
// alten — zwei Zahlen fuer dieselbe Zutat, kein Hinweis.
function bestandLadewegPruefen() {
  var manifest = {
    spaetzle: { id: "spaetzle", titel: "alte Fassung", portionen: 4,
                zutaten: [{ id: "z-m", name: "Mehl", menge: 100, einheit: "g" }],
                schritte: [] },
    maultaschen: { id: "maultaschen", titel: "alte Fassung 2", portionen: 4,
                   zutaten: [{ id: "z-m", name: "Mehl", menge: 100, einheit: "g" }],
                   schritte: [] }
  };
  globalThis.REZEPTE = manifest;

  function frisch(id) {
    return { id: id, titel: "frisch vom Server", portionen: 4,
             zutaten: [{ id: "z-m", name: "Mehl", menge: 400, einheit: "g" }],
             schritte: [] };
  }

  // `kaputt` nennt die id, deren Datei sich nicht holen laesst.
  function fetchStellen(kaputt) {
    globalThis.fetch = function (pfad) {
      var id = String(pfad).replace("rezepte/", "").replace(".json", "");
      if (id === kaputt) return Promise.resolve({ ok: false, status: 404 });
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve(frisch(id)); } });
    };
  }

  fetchStellen(null);
  return A.alleRezepteLaden("http:").then(function (stand) {
    pruefe("Bestand: ueber http kommen die Dateien frisch, nicht aus dem Manifest",
      stand.rezepte.map(function (r) { return r.titel; }).sort(),
      ["frisch vom Server", "frisch vom Server"]);
    pruefe("Bestand: dann gibt es auch nichts zu melden", stand.ausManifest, []);

    // Die Namen kommen weiter aus dem Manifest — ohne Server gibt es kein
    // Verzeichnis-Listing, daran aendert sich nichts.
    pruefe("Bestand: das Manifest liefert weiter die Liste der Namen",
      stand.rezepte.map(function (r) { return r.id; }).sort(),
      ["maultaschen", "spaetzle"]);

    fetchStellen("maultaschen");
    return A.alleRezepteLaden("http:");
  }).then(function (stand) {
    pruefe("Bestand: was sich nicht laden laesst, faellt zurueck — und wird gemeldet",
      stand.ausManifest, ["maultaschen"]);
    pruefe("Bestand: die uebrigen bleiben frisch",
      stand.rezepte.filter(function (r) { return r.id === "spaetzle"; })[0].titel,
      "frisch vom Server");

    // Und der Hinweis landet sichtbar in der Uebersicht, nicht nur im
    // Rueckgabewert.
    var ziel = DOM.knotenBauen("div");
    R.uebersichtRendern(stand.rezepte, ziel, stand.ausManifest);
    var box = ziel.querySelector(".probleme");
    pruefe("Bestand: die Uebersicht sagt es dem Leser",
      [!!box, box ? box.textContent.indexOf("maultaschen") > -1 : false], [true, true]);

    // Ohne Beanstandung darf keine Box erscheinen — sonst steht sie immer da.
    var sauber = DOM.knotenBauen("div");
    R.uebersichtRendern(stand.rezepte, sauber, []);
    pruefe("Bestand: ohne Beanstandung keine Box",
      sauber.querySelector(".probleme"), null);

    // Ueber file:// ist das Manifest der regulaere Ladeweg — dort wird
    // nichts geholt und nichts gemeldet.
    globalThis.fetch = function () { return Promise.reject(new TypeError("Failed to fetch")); };
    return A.alleRezepteLaden("file:");
  }).then(function (stand) {
    pruefe("Bestand: ueber file:// ist das Manifest der Ladeweg, ohne Meldung",
      [stand.rezepte.map(function (r) { return r.titel; }).sort(), stand.ausManifest],
      [["alte Fassung", "alte Fassung 2"], []]);
  });
}

ladewegPruefen().then(bestandLadewegPruefen).then(function () {
  console.log(fehler === 0 ? "\nALLE PRUEFUNGEN GRUEN" : "\n" + fehler + " FEHLER");
  process.exit(fehler ? 1 : 0);
});
