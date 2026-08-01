#!/usr/bin/env node
// build-manifest.js — buendelt alle rezepte/*.json zu rezepte/manifest.js.
//
// Warum es das gibt: Beim Oeffnen von index.html per file:// blockieren
// Chrome, Firefox und Safari fetch() auf lokale Dateien. Das Manifest ist
// die einzige Form, in der die App die Rezepte dann noch lesen kann.
// Ueber http(s) (GitHub Pages, T-0009) wird es nicht benutzt — dort holt
// app.js die JSON-Dateien direkt.
//
// Quelle der Wahrheit bleiben die .json-Dateien. Nach jeder Aenderung an
// rezepte/ neu laufen lassen:  node tools/build-manifest.js

"use strict";

var fs = require("fs");
var path = require("path");

var wurzel = path.resolve(__dirname, "..");
var rezeptOrdner = path.join(wurzel, "rezepte");
var ziel = path.join(rezeptOrdner, "manifest.js");

var dateien = fs.readdirSync(rezeptOrdner)
  .filter(function (d) { return d.endsWith(".json"); })
  .sort();

var teile = [
  "// GENERIERT von tools/build-manifest.js — nicht von Hand bearbeiten.",
  "// Quelle der Wahrheit sind die .json-Dateien in diesem Ordner.",
  "window.REZEPTE = window.REZEPTE || {};",
  ""
];

var fehler = 0;

dateien.forEach(function (datei) {
  var pfad = path.join(rezeptOrdner, datei);
  var rezept;
  try {
    rezept = JSON.parse(fs.readFileSync(pfad, "utf8"));
  } catch (e) {
    console.error("FEHLER  " + datei + ": kein gueltiges JSON — " + e.message);
    fehler++;
    return;
  }
  var erwarteteId = path.basename(datei, ".json");
  if (rezept.id !== erwarteteId) {
    console.error('FEHLER  ' + datei + ': id "' + rezept.id + '" passt nicht zum Dateinamen.');
    fehler++;
    return;
  }
  teile.push('window.REZEPTE[' + JSON.stringify(rezept.id) + '] = ' + JSON.stringify(rezept, null, 2) + ";");
  teile.push("");
  console.log("ok      " + datei);
});

if (fehler > 0) {
  console.error("\n" + fehler + " Datei(en) uebersprungen.");
  process.exit(1);
}

fs.writeFileSync(ziel, teile.join("\n"), "utf8");
console.log("\ngeschrieben: rezepte/manifest.js (" + dateien.length + " Rezept(e))");
