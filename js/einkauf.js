// einkauf.js — Zutaten mehrerer Rezepte zu einer Einkaufsliste (T-0026).
//
// Reine Rechnung, kein DOM. Vier Regeln, alle aus dem Umstand, dass
// Mengen sich nicht beliebig addieren lassen:
//
//   1. Gleicher Name UND gleiche Einheit -> summiert.
//   2. Gleicher Name, VERSCHIEDENE Einheit -> zwei Posten. "200 g
//      Zwiebeln" und "1 Zwiebel" ist keine Rechnung, die ich raten
//      sollte; im Laden sieht man beides und weiss selbst Bescheid.
//   3. `skalieren: false` wird nicht summiert, sondern das Maximum
//      genommen. Zwei Rezepte mit je "1 Prise Salz" brauchen keine zwei
//      Prisen, und "4 l Kochwasser" zweimal ist Unsinn.
//   4. Mengenlose Zutaten ("nach Geschmack") stehen einmal ohne Menge da.
//
// Jeder Posten merkt sich, aus welchen Rezepten er kommt — sonst steht
// man im Laden vor "600 g Mehl" und weiss nicht mehr, wofuer.

(function (global) {
  "use strict";

  function schluessel(zutat) {
    if (zutat.menge === null || zutat.menge === undefined) return zutat.name + "|ohne";
    var art = zutat.skalieren === false ? "fix" : "skaliert";
    return zutat.name + "|" + (zutat.einheit || "") + "|" + art;
  }

  // auswahl: [{ rezept, portionen }]
  function listeBauen(auswahl) {
    var posten = new Map();

    auswahl.forEach(function (eintrag) {
      var r = eintrag.rezept;
      if (!r || !r.zutaten) return;
      var faktor = (eintrag.portionen || r.portionen) / r.portionen;

      r.zutaten.forEach(function (z) {
        var k = schluessel(z);
        var vorhanden = posten.get(k);
        var mengenlos = z.menge === null || z.menge === undefined;
        var fix = z.skalieren === false;

        if (!vorhanden) {
          vorhanden = {
            // Identitaet des Postens, auch fuer die Anzeige (T-0044):
            // was denselben Schluessel behaelt, behaelt seinen Haken.
            schluessel: k,
            name: z.name,
            einheit: mengenlos ? null : z.einheit,
            menge: mengenlos ? null : 0,
            menge_bis: null,
            mengenlos: mengenlos,
            fix: fix,
            quellen: []
          };
          posten.set(k, vorhanden);
        }

        if (!mengenlos) {
          var wert = fix ? z.menge : z.menge * faktor;
          // Feste Mengen summieren nicht — hier zaehlt der groesste Bedarf.
          vorhanden.menge = fix ? Math.max(vorhanden.menge, wert) : vorhanden.menge + wert;

          if (z.menge_bis !== null && z.menge_bis !== undefined) {
            var bis = fix ? z.menge_bis : z.menge_bis * faktor;
            if (vorhanden.menge_bis === null) vorhanden.menge_bis = 0;
            vorhanden.menge_bis = fix
              ? Math.max(vorhanden.menge_bis, bis)
              : vorhanden.menge_bis + bis;
          }
        }

        if (vorhanden.quellen.indexOf(r.titel) === -1) vorhanden.quellen.push(r.titel);
      });
    });

    return Array.from(posten.values()).sort(function (a, b) {
      return a.name.localeCompare(b.name, "de");
    });
  }

  // Auswahl aus der URL: "spaetzle:8,maultaschen" -> [{id, portionen}].
  // Fehlt die Portionszahl, gilt die Basis des Rezepts (null).
  function auswahlLesen(text) {
    if (!text) return [];
    return text.split(",").map(function (teil) {
      var stueck = teil.split(":");
      var id = (stueck[0] || "").trim();
      var p = parseInt(stueck[1], 10);
      return id ? { id: id, portionen: isNaN(p) ? null : p } : null;
    }).filter(Boolean);
  }

  function auswahlSchreiben(auswahl) {
    return auswahl.map(function (a) {
      return a.portionen ? a.id + ":" + a.portionen : a.id;
    }).join(",");
  }

  global.RezeptEinkauf = {
    listeBauen: listeBauen,
    auswahlLesen: auswahlLesen,
    auswahlSchreiben: auswahlSchreiben
  };
})(typeof window !== "undefined" ? window : globalThis);
