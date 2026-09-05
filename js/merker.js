// merker.js — was die Seite sich merkt, und wie lange (T-0064).
//
// Bis hierher lebte jeder Zustand ausschliesslich als CSS-Klasse im DOM:
// abgehakte Zutaten, die gewaehlte Portionszahl, die Auswahl in der
// Uebersicht. Ein Neuladen loeschte alles. Beim Kochen ist das kein
// Randfall — man wischt mit fettigen Fingern, das Telefon sperrt und
// laedt neu, und die halbe Mise en place ist wieder unabgehakt.
//
// Die Gegenrichtung ist aber genauso falsch, und sie stand bisher als
// Begruendung im Code: "beim Kochen will man den Haken von gestern nicht
// wiedersehen". Beides stimmt. Der Unterschied ist die ZEIT, nicht die
// Sache — deshalb merkt sich diese Ablage alles mit Verfallsdatum und
// gibt nach 24 Stunden nichts mehr heraus.
//
// Drei Eigenschaften, die hier keine Kuer sind:
//
//   1. Jeder Zugriff ist eingepackt. localStorage wirft in privaten
//      Fenstern, bei vollem Speicher und je nach Einstellung auch per
//      file:// — und die App muss dann normal laufen, nur ohne Gedaechtnis.
//   2. Kaputte Eintraege werden weggeworfen, nicht repariert. Was hier
//      steht, ist Bequemlichkeit; nichts davon ist es wert, dass eine
//      Seite daran haengenbleibt.
//   3. Die Uhr ist einsetzbar, damit sich das Verfallen pruefen laesst,
//      ohne einen Tag zu warten — dieselbe Entscheidung wie beim
//      Countdown (T-0045).

(function (global) {
  "use strict";

  var PRAEFIX = "rezept-grid:";
  var MAX_ALTER_MS = 24 * 60 * 60 * 1000;

  function merkerBauen(speicher, uhr) {
    // Lazy: zur Bauzeit gibt es global.localStorage vielleicht noch nicht,
    // und in den Pruefungen wird es nachtraeglich gesetzt.
    function ablage() {
      if (speicher) return speicher;
      try { return global.localStorage || null; } catch (e) { return null; }
    }
    function jetzt() { return uhr ? uhr() : Date.now(); }

    function lesen(schluessel) {
      var a = ablage();
      if (!a) return null;
      var roh;
      try { roh = a.getItem(PRAEFIX + schluessel); } catch (e) { return null; }
      if (!roh) return null;
      var eintrag;
      try { eintrag = JSON.parse(roh); } catch (e) { vergessen(schluessel); return null; }
      if (!eintrag || typeof eintrag.stand !== "number") { vergessen(schluessel); return null; }
      // Auch ein Stand aus der Zukunft ist unbrauchbar — dann ist die
      // Uhr verstellt worden, und das Alter laesst sich nicht beurteilen.
      var alter = jetzt() - eintrag.stand;
      if (alter < 0 || alter > MAX_ALTER_MS) { vergessen(schluessel); return null; }
      return eintrag.daten;
    }

    function schreiben(schluessel, daten) {
      var a = ablage();
      if (!a) return false;
      try {
        a.setItem(PRAEFIX + schluessel, JSON.stringify({ stand: jetzt(), daten: daten }));
        return true;
      } catch (e) {
        return false;
      }
    }

    function vergessen(schluessel) {
      var a = ablage();
      if (!a) return;
      try { a.removeItem(PRAEFIX + schluessel); } catch (e) { /* dann bleibt es stehen */ }
    }

    return { lesen: lesen, schreiben: schreiben, vergessen: vergessen };
  }

  var standard = merkerBauen(null, null);

  global.RezeptMerker = {
    bauen: merkerBauen,
    lesen: standard.lesen,
    schreiben: standard.schreiben,
    vergessen: standard.vergessen,
    PRAEFIX: PRAEFIX,
    MAX_ALTER_MS: MAX_ALTER_MS
  };
})(typeof window !== "undefined" ? window : globalThis);
