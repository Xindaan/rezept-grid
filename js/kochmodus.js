// kochmodus.js — Stufen-Navigation mit Countdown (T-0004).
//
// Beim Kochen steht man am Topf und braucht drei Dinge: was jetzt zu tun
// ist, welche Zutaten JETZT dazukommen, und wie lange es dauert. Das Grid
// bleibt sichtbar — es dimmt nur alles weg, was gerade nicht dran ist.
//
// Die Auswertung des Modells (welche Zeilen gehoeren zu welcher Stufe)
// steckt in kochSchritteBauen und ist DOM-frei, damit pruefbar.

(function (global) {
  "use strict";

  // Pro Stufe: die Zutaten, die hier neu dazukommen, und die, die schon
  // im Topf sind. Getrennt, weil sie unterschiedlich hervorgehoben werden.
  function kochSchritteBauen(modell) {
    return modell.spalten.map(function (spalte, index) {
      var eigene = spalte.eigeneZeilen || [];
      var imTopf = [];
      for (var r = spalte.von; r <= spalte.bis; r++) {
        if (eigene.indexOf(r) === -1) imTopf.push(r);
      }
      return {
        index: index,
        schritt: spalte.schritt,
        eigeneZeilen: eigene,
        imTopfZeilen: imTopf
      };
    });
  }

  // Sekunden -> "35:00" bzw. "1:05:00". Anders als dauerFormatieren in
  // grid.js, das eine Laengenangabe rendert ("35 Min") — hier laeuft eine
  // Uhr, und eine Uhr zeigt Sekunden.
  function zeitFormatieren(sekunden) {
    var s = Math.max(0, Math.round(sekunden));
    var stunden = Math.floor(s / 3600);
    var minuten = Math.floor((s % 3600) / 60);
    var rest = s % 60;
    function zwei(n) { return n < 10 ? "0" + n : String(n); }
    if (stunden > 0) return stunden + ":" + zwei(minuten) + ":" + zwei(rest);
    return minuten + ":" + zwei(rest);
  }

  if (typeof document === "undefined") {
    global.RezeptKochmodus = {
      kochSchritteBauen: kochSchritteBauen,
      zeitFormatieren: zeitFormatieren
    };
    return;
  }

  function el(tag, klasse, text) {
    var n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (text !== undefined && text !== null && text !== "") n.textContent = text;
    return n;
  }

  // Baut den Kochmodus fuer ein gerendertes Rezept. `ziel` ist der
  // Container, in dem das Grid steht.
  function kochmodusBauen(modell, ziel) {
    var stufen = kochSchritteBauen(modell);
    if (!stufen.length) return null;

    var aktiv = 0;
    var laeuft = false;
    var verbleibend = null;
    var ticker = null;
    var leiste = null;
    var felder = {};

    // --- Timer -------------------------------------------------------
    function tickerStoppen() {
      if (ticker !== null) { clearInterval(ticker); ticker = null; }
    }

    function timerSetzen() {
      tickerStoppen();
      laeuft = false;
      var dauer = stufen[aktiv].schritt.dauer_s;
      verbleibend = (dauer === null || dauer === undefined) ? null : dauer;
      timerZeichnen();
    }

    function timerUmschalten() {
      if (verbleibend === null) return;
      if (laeuft) {
        tickerStoppen();
        laeuft = false;
      } else {
        if (verbleibend <= 0) verbleibend = stufen[aktiv].schritt.dauer_s;
        laeuft = true;
        ticker = setInterval(function () {
          verbleibend -= 1;
          if (verbleibend <= 0) {
            verbleibend = 0;
            tickerStoppen();
            laeuft = false;
          }
          timerZeichnen();
        }, 1000);
      }
      timerZeichnen();
    }

    function timerZeichnen() {
      if (!leiste) return;
      if (verbleibend === null) {
        felder.uhr.textContent = "ohne Zeit";
        felder.uhr.classList.remove("laeuft", "abgelaufen");
        felder.timerKnopf.hidden = true;
        return;
      }
      felder.timerKnopf.hidden = false;
      felder.uhr.textContent = zeitFormatieren(verbleibend);
      felder.uhr.classList.toggle("laeuft", laeuft);
      felder.uhr.classList.toggle("abgelaufen", verbleibend === 0);
      felder.timerKnopf.textContent = laeuft ? "Pause" : (verbleibend === 0 ? "Neu" : "Start");
    }

    // --- Hervorhebung im Grid ----------------------------------------
    function gridZeichnen() {
      var stufe = stufen[aktiv];

      modell.zeilen.forEach(function (_, r) {
        var zellen = ziel.querySelectorAll('[data-zeile="' + r + '"]');
        var istNeu = stufe.eigeneZeilen.indexOf(r) > -1;
        var istImTopf = stufe.imTopfZeilen.indexOf(r) > -1;
        Array.prototype.forEach.call(zellen, function (zelle) {
          zelle.classList.toggle("koch-neu", istNeu);
          zelle.classList.toggle("koch-im-topf", istImTopf);
        });
      });

      stufen.forEach(function (s) {
        var td = ziel.querySelector('[data-schritt="' + s.schritt.id + '"]');
        if (!td) return;
        td.classList.toggle("koch-aktiv", s.index === aktiv);
        td.classList.toggle("koch-erledigt", s.index < aktiv);
      });
    }

    function leisteZeichnen() {
      var stufe = stufen[aktiv];
      var schritt = stufe.schritt;

      felder.zaehler.textContent = "Schritt " + (aktiv + 1) + " von " + stufen.length;
      felder.titel.textContent = schritt.titel;
      felder.anweisung.textContent = schritt.anweisung || "";

      felder.ruhe.hidden = !schritt.unbeaufsichtigt;
      felder.zurueck.disabled = aktiv === 0;
      felder.weiter.disabled = aktiv === stufen.length - 1;
      timerZeichnen();
      gridZeichnen();
    }

    function gehe(neu) {
      if (neu < 0 || neu >= stufen.length) return;
      aktiv = neu;
      timerSetzen();
      leisteZeichnen();
    }

    // --- Tastatur ----------------------------------------------------
    function tastatur(ereignis) {
      if (ereignis.key === "Escape") { beenden(); return; }
      if (ereignis.key === "ArrowRight") { ereignis.preventDefault(); gehe(aktiv + 1); }
      if (ereignis.key === "ArrowLeft") { ereignis.preventDefault(); gehe(aktiv - 1); }
    }

    // --- Auf-/Abbau --------------------------------------------------
    function leisteBauen() {
      var box = el("div", "koch-leiste");

      var text = el("div", "koch-text");
      felder.zaehler = el("span", "koch-zaehler");
      felder.titel = el("strong", "koch-titel");
      felder.anweisung = el("p", "koch-anweisung");
      felder.ruhe = el("span", "koch-ruhe", "läuft von allein");
      var kopfzeile = el("div", "koch-kopfzeile");
      kopfzeile.appendChild(felder.zaehler);
      kopfzeile.appendChild(felder.titel);
      kopfzeile.appendChild(felder.ruhe);
      text.appendChild(kopfzeile);
      text.appendChild(felder.anweisung);

      var uhrBox = el("div", "koch-uhr-box");
      felder.uhr = el("span", "koch-uhr");
      felder.timerKnopf = el("button", "koch-knopf", "Start");
      felder.timerKnopf.type = "button";
      felder.timerKnopf.addEventListener("click", timerUmschalten);
      uhrBox.appendChild(felder.uhr);
      uhrBox.appendChild(felder.timerKnopf);

      var steuerung = el("div", "koch-steuerung");
      felder.zurueck = el("button", "koch-knopf", "Zurück");
      felder.zurueck.type = "button";
      felder.zurueck.addEventListener("click", function () { gehe(aktiv - 1); });
      felder.weiter = el("button", "koch-knopf koch-knopf-haupt", "Weiter");
      felder.weiter.type = "button";
      felder.weiter.addEventListener("click", function () { gehe(aktiv + 1); });
      var raus = el("button", "koch-knopf koch-knopf-aus", "Beenden");
      raus.type = "button";
      raus.addEventListener("click", beenden);
      steuerung.appendChild(felder.zurueck);
      steuerung.appendChild(felder.weiter);
      steuerung.appendChild(raus);

      box.appendChild(text);
      box.appendChild(uhrBox);
      box.appendChild(steuerung);
      return box;
    }

    function starten() {
      if (leiste) return;
      leiste = leisteBauen();
      document.body.appendChild(leiste);
      document.body.classList.add("kochmodus");
      document.addEventListener("keydown", tastatur);
      gehe(0);
    }

    function beenden() {
      tickerStoppen();
      document.removeEventListener("keydown", tastatur);
      document.body.classList.remove("kochmodus");
      if (leiste) { leiste.remove(); leiste = null; }
      // Alle Markierungen im Grid zuruecksetzen.
      Array.prototype.forEach.call(
        ziel.querySelectorAll(".koch-neu, .koch-im-topf, .koch-aktiv, .koch-erledigt"),
        function (n) { n.classList.remove("koch-neu", "koch-im-topf", "koch-aktiv", "koch-erledigt"); }
      );
    }

    return {
      starten: starten,
      beenden: beenden,
      gehe: gehe,
      timerUmschalten: timerUmschalten,
      stufen: stufen,
      zustand: function () {
        return { aktiv: aktiv, laeuft: laeuft, verbleibend: verbleibend, offen: !!leiste };
      }
    };
  }

  global.RezeptKochmodus = {
    kochSchritteBauen: kochSchritteBauen,
    zeitFormatieren: zeitFormatieren,
    kochmodusBauen: kochmodusBauen
  };
})(typeof window !== "undefined" ? window : globalThis);
