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
eval(fs.readFileSync(path.join(wurzel, "js/kochmodus.js"), "utf8"));
var G = globalThis.RezeptGrid;
var P = globalThis.RezeptPortionen;
var K = globalThis.RezeptKochmodus;

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

// --- 5. Alle Rezepte gegen die Schema-Regeln --------------------------
// Laeuft ueber rezepte/*.json, nicht nur ueber das Beispiel. Damit faellt
// auf, wenn ein neu konvertiertes Rezept das Schema verletzt (Teil von
// T-0011).
var rezeptOrdner = path.join(wurzel, "rezepte");
var dateien = fs.readdirSync(rezeptOrdner).filter(function (d) { return d.endsWith(".json"); }).sort();
pruefe("mindestens zwei Rezepte vorhanden", dateien.length >= 2, true);

dateien.forEach(function (datei) {
  var r = JSON.parse(fs.readFileSync(path.join(rezeptOrdner, datei), "utf8"));
  var name = datei.replace(".json", "");
  var maengel = [];

  if (r.id !== name) maengel.push('id "' + r.id + '" passt nicht zum Dateinamen');
  if (!r.portionen || r.portionen < 1) maengel.push("portionen fehlt oder ist < 1");

  var ids = {};
  r.zutaten.forEach(function (z) {
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

console.log(fehler === 0 ? "\nALLE PRUEFUNGEN GRUEN" : "\n" + fehler + " FEHLER");
process.exit(fehler ? 1 : 0);
