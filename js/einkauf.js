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
//   5. Spannen ("1-2 EL") addieren sich als Spanne: die Untergrenzen zur
//      Untergrenze, die Obergrenzen zur Obergrenze. Eine Zutat OHNE
//      Spanne zaehlt dabei mit ihrer Menge auf beiden Seiten (T-0057) —
//      sie ist die Spanne [menge, menge]. Vorher trug sie zur Obergrenze
//      gar nichts bei: aus "1 EL" plus "1-2 EL" wurde "2-2 EL" statt
//      "2-3 EL", und der Fehler wuchs mit jedem mengenlos addierten
//      Rezept.
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
            quellen: [],
            // Obergrenze wird IMMER mitgefuehrt, auch ohne Spanne — sonst
            // haengt sie davon ab, welches Rezept zuerst kam (T-0057).
            // Sichtbar wird sie nur, wenn wenigstens eine Zutat wirklich
            // eine Spanne hatte; sonst waere jeder Posten "2-2 EL".
            obergrenze: mengenlos ? null : 0,
            hatSpanne: false
          };
          posten.set(k, vorhanden);
        }

        if (!mengenlos) {
          var hatBis = z.menge_bis !== null && z.menge_bis !== undefined;
          var wert = fix ? z.menge : z.menge * faktor;
          var bis = hatBis ? (fix ? z.menge_bis : z.menge_bis * faktor) : wert;
          // Feste Mengen summieren nicht — hier zaehlt der groesste Bedarf.
          vorhanden.menge = fix ? Math.max(vorhanden.menge, wert) : vorhanden.menge + wert;
          vorhanden.obergrenze = fix
            ? Math.max(vorhanden.obergrenze, bis)
            : vorhanden.obergrenze + bis;
          if (hatBis) vorhanden.hatSpanne = true;
        }

        if (vorhanden.quellen.indexOf(r.titel) === -1) vorhanden.quellen.push(r.titel);
      });
    });

    return Array.from(posten.values()).map(function (p) {
      p.menge_bis = p.hatSpanne ? p.obergrenze : null;
      delete p.obergrenze;
      delete p.hatSpanne;
      return p;
    }).sort(function (a, b) {
      return a.name.localeCompare(b.name, "de");
    });
  }

  // Auswahl aus der URL: "spaetzle:8,maultaschen" -> [{id, portionen}].
  // Fehlt die Portionszahl oder ist sie unbrauchbar, gilt die Basis des
  // Rezepts (null).
  //
  // Die URL ist Eingabe von aussen — sie ist teilbar, also kommt sie auch
  // aus fremder Hand oder aus einem Tippfehler. `parseInt` allein liess
  // alles durch, was mit einer Ziffer beginnt: bei "?einkauf=spaetzle:-4"
  // stand "-400 g Mehl" auf der Liste, bei ":0" verschwanden alle Mengen.
  // Brauchbar ist genau eine ganze Zahl ab 1 (T-0057).
  function auswahlLesen(text) {
    if (!text) return [];
    return text.split(",").map(function (teil) {
      var stueck = teil.split(":");
      var id = (stueck[0] || "").trim();
      var p = parseInt(stueck[1], 10);
      var brauchbar = !isNaN(p) && isFinite(p) && p >= 1;
      return id ? { id: id, portionen: brauchbar ? p : null } : null;
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
