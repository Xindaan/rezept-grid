// app.js — Laden des Rezepts und Seiten-Verdrahtung.
//
// Ladeweg: ueber http(s) wird die JSON-Datei direkt geholt (immer aktuell).
// Beim Oeffnen per file:// blockieren alle Browser fetch auf lokale
// Dateien; dann greift das vorgenerierte rezepte/manifest.js
// (siehe tools/build-manifest.js).

(function (global) {
  "use strict";

  var STANDARD_REZEPT = "linsen-eintopf";

  function rezeptIdErmitteln() {
    var params = new URLSearchParams(global.location.search);
    return params.get("rezept") || STANDARD_REZEPT;
  }

  function rezeptLaden(id) {
    return fetch("rezepte/" + id + ".json", { cache: "no-store" })
      .then(function (antwort) {
        if (!antwort.ok) throw new Error("HTTP " + antwort.status);
        return antwort.json();
      })
      .catch(function () {
        var eingebettet = (global.REZEPTE || {})[id];
        if (eingebettet) return eingebettet;
        throw new Error('Rezept "' + id + '" nicht gefunden — weder als rezepte/' + id + '.json erreichbar noch im Manifest.');
      });
  }

  function fehlerZeigen(ziel, fehler) {
    ziel.textContent = "";
    var box = document.createElement("section");
    box.className = "probleme";
    var h = document.createElement("h2");
    h.textContent = "Rezept konnte nicht geladen werden";
    var p = document.createElement("p");
    p.textContent = fehler.message;
    box.appendChild(h);
    box.appendChild(p);
    ziel.appendChild(box);
  }

  function start() {
    var ziel = document.getElementById("rezept");
    var id = rezeptIdErmitteln();

    rezeptLaden(id)
      .then(function (rezept) {
        var modell = global.RezeptRender.rezeptRendern(rezept, ziel);
        document.title = rezept.titel + " — rezept-grid";
        // Fuer den Smoke-Test von aussen greifbar.
        global.aktuellesModell = modell;
      })
      .catch(function (fehler) {
        fehlerZeigen(ziel, fehler);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window);
