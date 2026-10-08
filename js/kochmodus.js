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

  // Countdown-Rechnung (T-0045). DOM-frei, ohne eigenen Timer, mit
  // injizierbarer Uhr — damit sie sich pruefen laesst, ohne echte
  // Minuten zu warten.
  //
  // Bis T-0045 zaehlte der Timer Ticks: `verbleibend -= 1` je
  // setInterval-Lauf. Browser drosseln setInterval im Hintergrund-Tab auf
  // etwa einmal pro Minute (Chrome) oder halten es ganz an (iOS Safari) —
  // und genau dorthin gehoert dieses Geraet: Handy weglegen, kochen,
  // zurueckkommen. Gemessen mit dem echten Modul: nach 400 s Wanduhr auf
  // einer 360-s-Stufe standen noch 5:54 auf der Uhr, und sie lief weiter.
  //
  // Jetzt wird die Zeit abgelesen statt gezaehlt. `endeAt` ist der Anker
  // auf der Wanduhr, solange der Countdown laeuft; bei Pause wird der
  // Rest zurueckgerechnet und der Anker geloescht. Das Interval treibt
  // dann nur noch die Anzeige, nicht mehr die Rechnung — es darf
  // ausfallen, ohne dass die Uhr falsch geht.
  function countdownBauen(jetzt) {
    var uhr = jetzt || function () { return Date.now(); };
    var dauer = null;   // Sollzeit der aktuellen Stufe, null = ohne Zeit
    var rest = null;    // Rest im Ruhezustand (angehalten)
    var endeAt = null;  // Wanduhr-Anker, nur waehrend es laeuft

    function stand() {
      if (rest === null) return null;
      if (endeAt === null) return rest;
      return Math.max(0, Math.round((endeAt - uhr()) / 1000));
    }

    return {
      // Neue Stufe: Zeit setzen, angehalten.
      setzen: function (d) {
        dauer = (d === null || d === undefined) ? null : d;
        rest = dauer;
        endeAt = null;
      },
      starten: function () {
        if (rest === null) return;
        if (stand() <= 0) rest = dauer;  // abgelaufen -> wieder von vorn
        endeAt = uhr() + rest * 1000;
      },
      pausieren: function () {
        if (rest === null) return;
        rest = stand();
        endeAt = null;
      },
      // Abgelaufen zaehlt nicht mehr als laufend — die Anzeige schaltet
      // damit von selbst auf "Neu" um, auch wenn der Tick spaet kommt.
      laeuft: function () { return endeAt !== null && stand() > 0; },
      stand: stand
    };
  }

  // Der Alarm (T-0063).
  //
  // Bis hierher war der Countdown eine Zahl, die man ansehen muss. Genau
  // das kann man beim Kochen nicht: das Telefon liegt mit dem Display
  // nach unten neben dem Herd, oder der Bildschirm ist laengst aus. Ein
  // Timer, der nur zusieht, wie die Zeit ablaeuft, ist keiner.
  //
  // Drei Wege, alle bestenfalls vorhanden und keiner Voraussetzung:
  //   * Vibration — geht auf Android, auf iOS nicht.
  //   * ein kurzer Ton ueber die WebAudio-Schnittstelle. Der Kontext wird
  //     erst beim Druck auf "Start" gebaut, weil Browser Ton ohne
  //     Nutzergeste verweigern — der Knopfdruck IST die Geste.
  //   * die Bildschirmsperre (Wake Lock), damit der Schirm waehrend des
  //     Kochens anbleibt. Nur ueber https; per file:// gibt es sie nicht.
  //
  // Jeder Weg steckt in seinem eigenen try — faellt einer aus, laufen die
  // anderen weiter, und der Kochmodus laeuft in jedem Fall.
  function signalgeberBauen() {
    var klang = null;

    function tonKontext() {
      if (klang) return klang;
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      try { klang = new AC(); } catch (e) { klang = null; }
      return klang;
    }

    return {
      // Beim Start des Timers aufrufen: hier ist die Nutzergeste, mit der
      // sich der Tonkontext freischalten laesst.
      vorbereiten: function () {
        var k = tonKontext();
        if (k && k.state === "suspended") {
          try { k.resume(); } catch (e) { /* dann eben ohne Ton */ }
        }
      },

      abgelaufen: function () {
        try {
          if (global.navigator && global.navigator.vibrate) {
            global.navigator.vibrate([200, 120, 200, 120, 400]);
          }
        } catch (e) { /* Vibration ist Zugabe, kein Zweck */ }

        try {
          var k = tonKontext();
          if (!k) return;
          // Zwei kurze Toene statt eines langen: ein Piepen geht im
          // Kuechenlaerm unter, ein Muster faellt auf.
          [0, 0.35].forEach(function (versatz) {
            var ton = k.createOscillator();
            var lautstaerke = k.createGain();
            ton.type = "sine";
            ton.frequency.value = 880;
            lautstaerke.gain.value = 0.0001;
            ton.connect(lautstaerke);
            lautstaerke.connect(k.destination);
            var t = k.currentTime + versatz;
            // Sanft ein- und ausblenden, sonst knackt es.
            lautstaerke.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
            lautstaerke.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
            ton.start(t);
            ton.stop(t + 0.3);
          });
        } catch (e) { /* kein Ton, kein Beinbruch */ }
      }
    };
  }

  // Bildschirmsperre. Getrennt vom Signalgeber, weil sie am Kochmodus
  // haengt und nicht am Timer: der Schirm soll bleiben, solange gekocht
  // wird, nicht nur solange eine Uhr laeuft.
  function wachhalterBauen() {
    var sperre = null;
    return {
      an: function () {
        try {
          var nav = global.navigator;
          if (!nav || !nav.wakeLock || sperre) return;
          nav.wakeLock.request("screen").then(function (s) {
            sperre = s;
          }, function () { /* abgelehnt, etwa weil kein https */ });
        } catch (e) { /* dann geht der Schirm eben aus */ }
      },
      aus: function () {
        try {
          if (sperre) { sperre.release(); sperre = null; }
        } catch (e) { /* nichts zu tun */ }
      }
    };
  }

  // Alles ab hier braucht das DOM. countdownBauen steht bewusst davor:
  // die Rechnung ist DOM-frei und muss auch headless pruefbar sein.
  if (typeof document === "undefined") {
    global.RezeptKochmodus = {
      kochSchritteBauen: kochSchritteBauen,
      zeitFormatieren: zeitFormatieren,
      countdownBauen: countdownBauen,
      signalgeberBauen: signalgeberBauen,
      wachhalterBauen: wachhalterBauen
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
  // `geber` und `wachhalter` sind einsetzbar, damit die Pruefung zaehlen
  // kann, ob der Alarm genau einmal kommt — ohne Ton und ohne Wanduhr.
  function kochmodusBauen(modell, ziel, geber, wachhalter) {
    var stufen = kochSchritteBauen(modell);
    if (!stufen.length) return null;

    var aktiv = 0;
    var countdown = countdownBauen();
    var ticker = null;
    var leiste = null;
    var felder = {};
    var signal = geber || signalgeberBauen();
    var wach = wachhalter || wachhalterBauen();

    // --- Timer -------------------------------------------------------
    function tickerStoppen() {
      if (ticker !== null) { clearInterval(ticker); ticker = null; }
    }

    function timerSetzen() {
      tickerStoppen();
      countdown.setzen(stufen[aktiv].schritt.dauer_s);
      timerZeichnen();
    }

    function timerUmschalten() {
      if (countdown.stand() === null) return;
      if (countdown.laeuft()) {
        countdown.pausieren();
        tickerStoppen();
      } else {
        // Der Knopfdruck ist die Nutzergeste, ohne die kein Browser Ton
        // erlaubt. Danach darf der Alarm auch im Hintergrund kommen.
        signal.vorbereiten();
        countdown.starten();
        // Das Interval treibt nur die Anzeige. Faellt es aus oder wird
        // es gedrosselt, rechnet der naechste Tick den Stand wieder aus
        // der Wanduhr — er holt also auf, statt hinterherzuhinken.
        ticker = setInterval(function () {
          if (!countdown.laeuft()) tickerStoppen();
          timerZeichnen();
        }, 1000);
      }
      timerZeichnen();
    }

    function timerZeichnen() {
      if (!leiste) return;
      var verbleibend = countdown.stand();
      var laeuft = countdown.laeuft();
      if (verbleibend === null) {
        felder.uhr.textContent = "ohne Zeit";
        felder.uhr.classList.remove("laeuft", "abgelaufen");
        if (felder.alarm.textContent !== "") felder.alarm.textContent = "";
        felder.timerKnopf.hidden = true;
        felder.balken.hidden = true;
        return;
      }
      felder.timerKnopf.hidden = false;
      felder.uhr.textContent = zeitFormatieren(verbleibend);
      // Zeitbalken: aus einem Meter Abstand sieht man den Fortschritt,
      // bevor man die Ziffern liest.
      var gesamt = stufen[aktiv].schritt.dauer_s || 0;
      var anteil = gesamt > 0 ? 1 - verbleibend / gesamt : 0;
      felder.balken.hidden = false;
      felder.balkenFuellung.style.width = (Math.min(1, Math.max(0, anteil)) * 100) + "%";
      felder.uhr.classList.toggle("laeuft", laeuft);
      felder.uhr.classList.toggle("abgelaufen", verbleibend === 0);
      // Nur bei Wechsel schreiben, sonst wiederholt der Screenreader die
      // Ansage bei jedem Tick.
      var ansage = verbleibend === 0 ? "Zeit abgelaufen" : "";
      var wechsel = felder.alarm.textContent !== ansage;
      if (wechsel) felder.alarm.textContent = ansage;
      // Am selben Wechsel haengt der Alarm (T-0063): genau einmal, wenn
      // die Zeit ablaeuft. Ein Tick spaeter oder ein verschluckter Tick
      // aendert daran nichts — die Uhr rechnet aus der Wanduhr, und der
      // Wechsel passiert beim ersten Blick nach dem Ablauf.
      if (wechsel && verbleibend === 0) signal.abgelaufen();
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
        // Seit T-0040 tragen Tabellenzelle UND Listeneintrag die Stufe.
        Array.prototype.forEach.call(
          ziel.querySelectorAll('[data-schritt="' + s.schritt.id + '"]'),
          function (knoten) {
            knoten.classList.toggle("koch-aktiv", s.index === aktiv);
            knoten.classList.toggle("koch-erledigt", s.index < aktiv);
          }
        );
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

    // Die aktive Stufe ins Bild holen (T-0071). Bis hierher setzte der
    // Kochmodus nur Klassen: ab der zweiten, dritten Stufe lag sie unter
    // der Leiste oder unterhalb des Bildschirms, und am Telefon steht der
    // Wortlaut nur in der Stufenliste — die Leiste blendet ihn dort aus.
    //
    // Ziel ist, was man jetzt braucht, und zwar der SICHTBARE Traeger
    // (Tabelle und Stufenliste stehen beide im DOM, stil.css zeigt eine):
    //   Stufenliste — der Eintrag der Stufe: Titel, neue Zutaten, Wortlaut.
    //   Tabelle     — die erste neu dazukommende Zutat. Die Stufenzelle
    //                 selbst kann ueber die ganze Tabelle reichen
    //                 ("in Bruehe ziehen"), ihr Anfang zeigte dann das
    //                 Falsche. Titel und Wortlaut stehen in der Leiste.
    //                 Ohne neue Zutat bleibt die Zelle.
    // Ausrichtung, im Browser gemessen: eine Zutatenzeile mit `nearest` —
    // was schon frei steht, bleibt stehen, der scroll-margin in stil.css
    // haelt sie aus dem Schatten der Leiste. Eintrag und Zelle dagegen mit
    // `start`: sie sind oft hoeher als der Platz ueber der Leiste (Omelett
    // 670 px bei 650 frei), und `nearest` zeigte dann ihr ENDE.
    function sichtbar(knoten) {
      return knoten.getClientRects().length > 0;
    }

    function stufeZeigen() {
      var id = stufen[aktiv].schritt.id;
      var traeger = Array.prototype.slice.call(
        ziel.querySelectorAll('[data-schritt="' + id + '"]'));
      var neu = Array.prototype.slice.call(ziel.querySelectorAll(".koch-neu"))
        .filter(function (k) { return k.classList.contains("zutat"); });
      var kandidaten = traeger.filter(function (k) { return k.tagName === "ARTICLE"; })
        .concat(neu)
        .concat(traeger.filter(function (k) { return k.tagName === "TD"; }));
      var zielKnoten = kandidaten.filter(sichtbar)[0];
      if (!zielKnoten) return;
      var ruhig = global.matchMedia &&
        global.matchMedia("(prefers-reduced-motion: reduce)").matches;
      zielKnoten.scrollIntoView({
        block: zielKnoten.classList.contains("zutat") ? "nearest" : "start",
        behavior: ruhig ? "auto" : "smooth"
      });
    }

    function gehe(neu) {
      if (neu < 0 || neu >= stufen.length) return;
      aktiv = neu;
      timerSetzen();
      leisteZeichnen();
      stufeZeigen();
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

      // Live-Region (T-0051). Im Kochmodus ist das ganze Feedback reine
      // Textaenderung — Zaehler, Titel, Anweisung. Ohne aria-live sagt
      // ein Screenreader beim "Weiter" nichts, und man kocht blind an
      // einer Anweisung vorbei. `atomic`, weil die drei Teile zusammen
      // einen Satz ergeben und einzeln vorgelesen Unsinn waeren.
      var text = el("div", "koch-text");
      text.setAttribute("aria-live", "polite");
      text.setAttribute("aria-atomic", "true");
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

      felder.balken = el("div", "koch-zeitbalken");
      felder.balkenFuellung = el("div", "koch-zeitbalken-fuellung");
      felder.balken.appendChild(felder.balkenFuellung);
      text.appendChild(felder.balken);

      var uhrBox = el("div", "koch-uhr-box");
      felder.uhr = el("span", "koch-uhr");
      // `timer` beschreibt, was das Ding ist. Bewusst OHNE aria-live:
      // eine live geschaltete Uhr laesst den Screenreader jede Sekunde
      // sprechen, und der Kochmodus waere unbenutzbar.
      felder.uhr.setAttribute("role", "timer");
      felder.timerKnopf = el("button", "koch-knopf", "Start");
      felder.timerKnopf.type = "button";
      felder.timerKnopf.addEventListener("click", timerUmschalten);
      uhrBox.appendChild(felder.uhr);
      uhrBox.appendChild(felder.timerKnopf);

      // Angesagt wird deshalb nur das Ereignis, das zaehlt: dass die Zeit
      // um ist. Sichtbar traegt das die Farbe (.abgelaufen) — und Farbe
      // allein traegt nie.
      felder.alarm = el("p", "koch-alarm nur-vorlesen");
      felder.alarm.setAttribute("role", "status");
      uhrBox.appendChild(felder.alarm);

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
      wach.an();
      gehe(0);
    }

    function beenden() {
      tickerStoppen();
      wach.aus();
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
        return {
          aktiv: aktiv,
          laeuft: countdown.laeuft(),
          verbleibend: countdown.stand(),
          offen: !!leiste
        };
      }
    };
  }

  global.RezeptKochmodus = {
    kochSchritteBauen: kochSchritteBauen,
    zeitFormatieren: zeitFormatieren,
    countdownBauen: countdownBauen,
    signalgeberBauen: signalgeberBauen,
    wachhalterBauen: wachhalterBauen,
    kochmodusBauen: kochmodusBauen
  };
})(typeof window !== "undefined" ? window : globalThis);
