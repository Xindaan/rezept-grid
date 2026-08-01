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
eval(fs.readFileSync(path.join(wurzel, "js/grid.js"), "utf8"));
eval(fs.readFileSync(path.join(wurzel, "js/portionen.js"), "utf8"));
var G = globalThis.RezeptGrid;
var P = globalThis.RezeptPortionen;

var fehler = 0;
function pruefe(name, ist, soll) {
  var ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok) { fehler++; console.log("FAIL  " + name + "\n      ist:  " + JSON.stringify(ist) + "\n      soll: " + JSON.stringify(soll)); }
  else console.log("ok    " + name);
}

// --- 1. Beispielrezept ------------------------------------------------
var rezept = JSON.parse(fs.readFileSync(path.join(wurzel, "rezepte/linsen-eintopf.json"), "utf8"));
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

console.log(fehler === 0 ? "\nALLE PRUEFUNGEN GRUEN" : "\n" + fehler + " FEHLER");
process.exit(fehler ? 1 : 0);
