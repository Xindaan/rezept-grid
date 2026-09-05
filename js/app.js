// app.js — Laden des Rezepts und Seiten-Verdrahtung.
//
// Ladeweg: ueber http(s) wird die JSON-Datei direkt geholt (immer aktuell).
// Beim Oeffnen per file:// blockieren alle Browser fetch auf lokale
// Dateien; dann greift das vorgenerierte rezepte/manifest.js
// (siehe tools/build-manifest.js).

(function (global) {
  "use strict";

  function rezeptIdErmitteln() {
    var params = new URLSearchParams(global.location.search);
    return params.get("rezept");
  }

  // Welche Rezepte es gibt, weiss nur das Manifest: ohne Server gibt es
  // kein Verzeichnis-Listing. WAS in ihnen steht, ist ueber http dagegen
  // eine andere Frage (T-0061).
  //
  // Bis dahin nahm die Uebersicht — und mit ihr die Einkaufsliste — den
  // Inhalt ebenfalls aus dem Manifest. Das ist derselbe Fehler, den
  // T-0047 fuer das Einzelrezept behoben hat, nur eine Seite weiter: das
  // Manifest wird von Hand erzeugt, und wer eine JSON aendert und
  // `build-manifest` vergisst, sah das Rezept mit neuen Mengen, die
  // Einkaufsliste dazu aber mit alten. Zwei Zahlen fuer dieselbe Zutat,
  // kein Hinweis.
  //
  // Jetzt gilt auch hier: ueber http kommen die Dateien frisch, das
  // Manifest liefert nur noch die Liste der Namen. Was sich nicht laden
  // laesst, faellt auf die Manifest-Fassung zurueck — und wird gemeldet,
  // statt still einzuspringen.
  function rezeptNamen() {
    return Object.keys(global.REZEPTE || {});
  }

  function alleRezepteLaden(protokoll) {
    var prot = protokoll || global.location.protocol;
    var ausManifest = global.REZEPTE || {};
    var namen = rezeptNamen();

    if (fallbackErlaubt(prot)) {
      return Promise.resolve({
        rezepte: namen.map(function (id) { return ausManifest[id]; }),
        ausManifest: []
      });
    }

    return Promise.all(namen.map(function (id) {
      return rezeptLaden(id, prot).then(
        function (r) { return { id: id, rezept: r, alt: false }; },
        function () { return { id: id, rezept: ausManifest[id], alt: true }; }
      );
    })).then(function (teile) {
      return {
        rezepte: teile.map(function (t) { return t.rezept; }).filter(Boolean),
        ausManifest: teile.filter(function (t) { return t.alt; })
                          .map(function (t) { return t.id; })
      };
    });
  }

  // Der Fallback aufs Manifest ist der file://-Weg, kein Allzweck-Netz
  // (T-0047).
  //
  // Ueber file:// blockiert jeder Browser fetch auf lokale Dateien —
  // dort IST das Manifest der Ladeweg, und der Fallback ist richtig.
  // Ueber http(s) ist er falsch: bis T-0047 fing der Catch alles ab, was
  // schiefgehen kann — HTTP 500, Netzwerkabbruch, Syntaxfehler in der
  // JSON. Alle drei zeigten kommentarlos die Manifest-Kopie, und die
  // wird von Hand erzeugt (tools/build-manifest.js). Der Nutzer sah dann
  // alte Mengen ohne jeden Hinweis. Das ist die schlechteste Sorte
  // Fehler: er sieht aus wie ein Erfolg.
  function fallbackErlaubt(protokoll) {
    return protokoll === "file:";
  }

  function rezeptLaden(id, protokoll) {
    var prot = protokoll || global.location.protocol;
    return fetch("rezepte/" + id + ".json", { cache: "no-store" })
      .then(function (antwort) {
        if (!antwort.ok) throw new Error("HTTP " + antwort.status);
        return antwort.json();
      })
      .catch(function (fehler) {
        var eingebettet = (global.REZEPTE || {})[id];
        if (eingebettet && fallbackErlaubt(prot)) return eingebettet;
        if (eingebettet) {
          throw new Error('Rezept "' + id + '" konnte nicht geladen werden: ' +
            fehler.message + '. Im Manifest steht eine Fassung, sie wird ' +
            'aber nicht gezeigt — sie kann veraltet sein. Neu erzeugen mit: ' +
            'node tools/build-manifest.js');
        }
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
    var zurueck = document.createElement("a");
    zurueck.className = "zurueck-link";
    // Siehe render.js: "./" oeffnet per file:// den Finder.
    zurueck.href = "index.html";
    zurueck.textContent = "Alle Rezepte";
    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(zurueck);
    ziel.appendChild(box);
  }

  function start() {
    var ziel = document.getElementById("rezept");
    var id = rezeptIdErmitteln();

    // ?einkauf=<id>[:portionen],... zeigt die Einkaufsliste (T-0026).
    var einkauf = new URLSearchParams(global.location.search).get("einkauf");
    if (einkauf) {
      alleRezepteLaden().then(function (stand) {
        var nachId = {};
        stand.rezepte.forEach(function (r) { nachId[r.id] = r; });
        var auswahl = global.RezeptEinkauf.auswahlLesen(einkauf)
          .map(function (a) {
            var r = nachId[a.id];
            return r ? { rezept: r, portionen: a.portionen || r.portionen } : null;
          })
          .filter(Boolean);
        // Gemeldet wird nur, was auch auf der Liste steht — ein veraltetes
        // Rezept, das gar nicht gewaehlt wurde, geht niemanden an.
        var gewaehlt = {};
        auswahl.forEach(function (a) { gewaehlt[a.rezept.id] = true; });
        global.RezeptRender.einkaufRendern(auswahl, ziel,
          stand.ausManifest.filter(function (rid) { return gewaehlt[rid]; }));
        document.title = "Einkaufsliste — rezept-grid";
      }).catch(function (fehler) { fehlerZeigen(ziel, fehler); });
      return;
    }

    // Ohne ?rezept= zeigt die App die Uebersicht.
    if (!id) {
      alleRezepteLaden().then(function (stand) {
        global.RezeptRender.uebersichtRendern(stand.rezepte, ziel, stand.ausManifest);
        document.title = "Rezepte — rezept-grid";
      }).catch(function (fehler) { fehlerZeigen(ziel, fehler); });
      return;
    }

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

  // Fuer tools/pruefe-grid.js greifbar — der Ladeweg ist Logik und
  // gehoert geprueft, nicht nur im Browser durchgeklickt (T-0047).
  global.RezeptApp = {
    rezeptLaden: rezeptLaden,
    alleRezepteLaden: alleRezepteLaden,
    fallbackErlaubt: fallbackErlaubt
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window);
