// zeitmass.js — Spaltenbreiten aus den Schrittdauern (T-0020).
//
// Die Breite einer Stufenspalte zeigt, wie lange sie dauert. Drei Regeln
// halten das lesbar:
//   1. Untergrenze: keine Spalte faellt unter MIN_PX, sonst verschwindet
//      der Titel. Stufen ohne Dauer (dauer_s: null) bekommen genau diese
//      Untergrenze — die Uebergabe laesst den Fall offen.
//   2. Deckel: keine Spalte nimmt mehr als DECKEL der Tabellenbreite.
//      Ohne ihn belegt "koecheln, 35 Min" siebzig Prozent und die fuenf
//      kurzen Stufen werden unlesbar. Die Breiten sind qualitativ —
//      niemand misst sie nach (Entscheidung 02.08.2026).
//   3. Der gedeckelte Ueberschuss geht proportional an die uebrigen.
//
// Reine Rechnung, kein DOM — damit in pruefe-grid.js nachrechenbar.

(function (global) {
  "use strict";

  var MIN_PX = 72;          // 4,5 rem bei 16 px Basis
  var DECKEL = 0.24;        // Anteil der Tabellenbreite
  var ZUTATEN = [0.06, 0.16]; // Anteile der beiden Zutatenspalten

  // Untergrenze der Zutatenspalten in Pixeln (T-0039).
  //
  // Die Anteile oben waren geraeteblind: die Tabellenbreite richtet sich
  // nach der Stufenzahl, nicht nach dem Bildschirm. Auf dem Desktop sind
  // 6 % rund 72 px, auf einem 375-px-Telefon dagegen 30 px — "400 g"
  // braucht 48 und wurde sichtbar gekappt.
  //
  // Das ist dieselbe Fehlerklasse, gegen die MIN_PX die Stufenspalten
  // schuetzt: eine Groesse als Anteil definiert, die eine absolute
  // Untergrenze braucht. Fuer die Stufen gab es sie, fuer die Zutaten
  // nicht.
  //
  // Die Werte sind AUSSENMASSE und muessen den Innenabstand mittragen —
  // daran war die erste Fassung mit 56 / 104 px zu knapp. Nachgemessen an
  // der Live-Seite: die Mengenzelle hat 24 px Polster, es blieben 32 px
  // fuer den Text; "150 ml" braucht 42,7 px, "4 Stiel" 38,5 px, "400 g"
  // 36,1 px. Sechs von vierzehn Mengen liefen aus ihrer Zelle heraus.
  //
  // Warum das die erste Pruefung nicht gefunden hat: `.menge` ist
  // `white-space: nowrap` bei `overflow: visible`. Der Text bricht also
  // nicht um und wird nicht abgeschnitten, sondern laeuft ueber — und
  // genau dabei bleibt `scrollWidth` gleich `clientWidth`. Der Test auf
  // Ueberlauf war blind fuer den einzigen Fall, der hier vorkommt.
  // Richtig misst man die Textbreite per Range gegen die Innenbreite.
  //
  // 64 px, und stil.css nimmt im gepinnten Fall zusaetzlich Polster weg:
  // 64 - 17,6 = 46,4 px fuer die Menge. Bei der Zutat lassen 120 px minus
  // 21,6 px genug fuer "Bratwurstbraet" (89,1 px) in einer Zeile.
  var ZUTATEN_MIN_PX = [64, 120];

  // Schmalste Tabelle, in der jede Stufe MIN_PX bekommt UND danach noch
  // RESERVE des Stufenbereichs frei bleibt, um die Dauern abzubilden.
  //
  // Ohne die Reserve reicht n * MIN_PX rechnerisch aus, aber dann sind
  // alle Spalten exakt gleich breit und das Zeitmass ist tot — genau bei
  // den langen Rezepten, wo es am meisten hergaebe. Ist der Container
  // schmaler, waechst die Tabelle darueber hinaus und scrollt horizontal.
  var RESERVE = 0.25;

  // Zwei Forderungen, es gewinnt die groessere.
  //
  // Die erste ist die alte: jede Stufe MIN_PX, dazu RESERVE, damit die
  // Dauern sich in den Breiten ueberhaupt abbilden koennen.
  //
  // Die zweite kam mit T-0039 dazu. Auf schmalen Schirmen pinnt stil.css
  // die Zutatenspalten auf feste Pixel und holt sich den Platz bei den
  // Stufen — danach muessen die immer noch MIN_PX haben. Bewusst so
  // formuliert, dass die erste Forderung fast immer gewinnt: bei vier
  // Stufen bleibt es bei 493 px wie vor T-0039, das Bild auf breiten
  // Schirmen aendert sich dadurch um keinen Pixel. Nur bei sehr wenigen
  // Stufen greift die zweite.
  function noetigeBreite(anzahlStufen) {
    var stufenAnteil = 1 - ZUTATEN[0] - ZUTATEN[1];
    var ausZeitmass = (anzahlStufen * MIN_PX) / (stufenAnteil * (1 - RESERVE));
    var ausUntergrenze = anzahlStufen * MIN_PX + ZUTATEN_MIN_PX[0] + ZUTATEN_MIN_PX[1];
    return Math.ceil(Math.max(ausZeitmass, ausUntergrenze));
  }

  // Liefert { zutaten: [a,b], stufen: [...], gedeckelt: [bool], roh: [...] }
  // Alle Werte als Anteil der Tabellenbreite (0..1).
  function spaltenbreiten(dauern, tabelleBreitePx) {
    var n = dauern.length;
    if (!n) return { zutaten: ZUTATEN.slice(), stufen: [], gedeckelt: [], roh: [] };

    // Nie schmaler rechnen als noetig — der Aufrufer setzt die Tabelle
    // entsprechend breit und laesst sie scrollen.
    var breite = Math.max(noetigeBreite(n), tabelleBreitePx || 0);

    // Die Stufen behalten ihren festen Anteil — auf breiten Schirmen ist
    // das Bild damit exakt wie vor T-0039. Auf schmalen setzt stil.css
    // die beiden Zutatenspalten auf feste Pixel; der Browser skaliert
    // dann nur die Prozentspalten und laesst die festen in Ruhe (im
    // Browser gemessen). Deshalb steht die Untergrenze dort und nicht
    // hier: sie darf das Desktop-Bild nicht anfassen.
    var stufenPx = breite * (1 - ZUTATEN[0] - ZUTATEN[1]);
    var zutatenPx = [
      Math.max(ZUTATEN[0] * breite, ZUTATEN_MIN_PX[0]),
      Math.max(ZUTATEN[1] * breite, ZUTATEN_MIN_PX[1])
    ];

    var minPx = MIN_PX;

    // Der Deckel schuetzt die kurzen Stufen davor, von einer langen
    // erdrueckt zu werden. Bei wenigen Stufen wollen aber alle mehr als
    // DECKEL — dann gibt es nichts zu schuetzen, und ein starrer Deckel
    // wuerde nur Breite vernichten (bei drei Stufen kaeme die Tabelle auf
    // 72 statt 78 Prozent). Deshalb nie unter den Gleichanteil deckeln.
    var deckelPx = Math.max(breite * DECKEL, stufenPx / n);

    var summe = dauern.reduce(function (a, d) { return a + (d || 0); }, 0);
    var frei = Math.max(0, stufenPx - minPx * n);

    // Rohverteilung: Untergrenze fuer alle, Rest proportional zur Dauer.
    var px = dauern.map(function (d) {
      if (frei === 0) return minPx;
      if (summe === 0) return minPx + frei / n;
      return minPx + frei * ((d || 0) / summe);
    });
    var roh = px.slice();

    // Deckeln und den Ueberschuss auf die ungedeckelten verteilen.
    // Mehrere Runden, weil das Verteilen neue Ueberschreitungen erzeugen kann.
    var gedeckelt = new Array(n).fill(false);
    for (var runde = 0; runde < n + 1; runde++) {
      var ueberschuss = 0;
      for (var i = 0; i < n; i++) {
        if (!gedeckelt[i] && px[i] > deckelPx) {
          ueberschuss += px[i] - deckelPx;
          px[i] = deckelPx;
          gedeckelt[i] = true;
        }
      }
      if (ueberschuss <= 0.01) break;

      var offen = [];
      for (var j = 0; j < n; j++) if (!gedeckelt[j]) offen.push(j);
      if (!offen.length) break;

      var offenSumme = offen.reduce(function (a, k) { return a + (dauern[k] || 0); }, 0);
      offen.forEach(function (k) {
        px[k] += offenSumme > 0
          ? ueberschuss * ((dauern[k] || 0) / offenSumme)
          : ueberschuss / offen.length;
      });
    }

    // Der Vermerk "Achse gekuerzt" meint nicht die interne Deckelung —
    // die greift durch die Untergrenze fast nie. Er meint die Aussage,
    // die den Leser angeht: diese Stufe ist X Prozent der Gesamtzeit,
    // bekommt aber nur Y Prozent der Breite. Ohne den Hinweis liest man
    // eine Breite als Dauer, die es nicht ist.
    var anteile = px.map(function (p) { return p / breite; });
    var zeitanteil = dauern.map(function (d) {
      return summe > 0 ? (d || 0) / summe : 0;
    });
    var gekuerzt = zeitanteil.map(function (z, i) {
      return z > DECKEL && z > anteile[i] * 1.2;
    });

    return {
      // Nominale Anteile — render.js schreibt sie als max(Anteil, Grenze)
      // ins CSS, damit auf breiten Schirmen wieder der Anteil zaehlt.
      zutaten: ZUTATEN.slice(),
      // Und die tatsaechlichen Pixel an der Mindestbreite, fuer den
      // sticky-Versatz der Zutatenspalte.
      zutatenPx: zutatenPx,
      stufen: anteile,
      gedeckelt: gedeckelt,     // interne Deckelung, fuer Pruefungen
      gekuerzt: gekuerzt,       // sichtbarer Vermerk
      zeitanteil: zeitanteil,
      roh: roh.map(function (p) { return p / breite; })
    };
  }

  // Startzeitpunkt jeder Stufe in Sekunden. NICHT einfach aufaddiert:
  // eine Stufe beginnt, sobald ihre Vorstufen fertig sind, und eine ohne
  // Vorstufen beginnt bei null. Bei den Maultaschen laeuft "Fuellung
  // mischen" waehrend der Teig ruht — stumpf addiert kaeme die Tabelle
  // auf 90 Minuten statt der tatsaechlichen 75.
  //
  // --- Vorstufen normalisieren (T-0049) --------------------------------
  //
  // Die Regel "fehlendes `vorstufen` = unmittelbarer Vorgaenger" stand bis
  // T-0049 in vier Dateien: grid.js (ueber IDs), render.js, pruefe-grid.js
  // (ueber Indizes) und hier zweimal als Argument-Default. Vier Kopien
  // einer Semantik heisst: wer sie aendert, muss vier Stellen finden.
  // Findet er drei, rechnen Grid, Kennzahlen und Pruefskript gegeneinander
  // — und zwar lautlos, weil jede fuer sich plausibel bleibt.
  //
  // Jetzt steht sie hier, in zwei Formen fuer zwei Aufgaben:
  //
  //   vorstufenIds     — Rohform mit IDs, OHNE Filter. grid.js braucht
  //                      auch die unbekannten IDs, weil es sie meldet.
  //   vorstufenIndizes — Indexform, unbekannte IDs fallen weg. Fuer alle,
  //                      die rechnen statt pruefen.
  //   vorOder          — derselbe Default fuer ein bereits uebergebenes
  //                      Index-Feld mit Luecken.
  //
  // Wer die Semantik aendert, aendert vorstufenIds und vorOder — und
  // sonst nichts.
  function vorstufenIds(schritte) {
    return schritte.map(function (s, i) {
      if (s.vorstufen === undefined || s.vorstufen === null) {
        return i > 0 ? [schritte[i - 1].id] : [];
      }
      return s.vorstufen.slice();
    });
  }

  function vorstufenIndizes(schritte) {
    var nachId = {};
    schritte.forEach(function (s, i) { nachId[s.id] = i; });
    return vorstufenIds(schritte).map(function (ids) {
      return ids.map(function (v) { return nachId[v]; })
                .filter(function (j) { return j !== undefined; });
    });
  }

  function vorOder(vorstufen, i) {
    return (vorstufen && vorstufen[i]) ? vorstufen[i] : (i > 0 ? [i - 1] : []);
  }

  // `vorstufen` ist ein Feld von Index-Feldern. Fehlt es, gilt die lineare
  // Kette (jede Stufe wartet auf die vorherige) — siehe vorOder().
  function startzeiten(dauern, vorstufen) {
    var start = [], ende = [];
    dauern.forEach(function (d, i) {
      var vs = vorOder(vorstufen, i);
      var t = 0;
      vs.forEach(function (j) {
        if (j >= 0 && j < i) t = Math.max(t, ende[j]);
      });
      start[i] = t;
      ende[i] = t + (d || 0);
    });
    return start;
  }

  // Zeitplan fuer EINE Person (T-0032).
  //
  // `startzeiten` oben kennt nur Abhaengigkeiten und laesst deshalb zwei
  // beaufsichtigte Stufen gleichzeitig laufen. Das kann niemand: bei den
  // Maultaschen stand "Fuellung mischen, 15 Min" neben "Nudelteig kneten,
  // 10 Min" — beides mit den Haenden, beides ab Minute 0. Richtig ist,
  // dass die Fuellung in die Ruhezeit des Teigs faellt.
  //
  // Also zwei Regeln statt einer:
  //   1. Eine Stufe beginnt fruehestens, wenn ihre Vorstufen fertig sind.
  //   2. Beaufsichtigte Stufen ueberlappen sich nie. Unbeaufsichtigte
  //      belegen die Haende nicht und starten immer sofort.
  //
  // Die Reihenfolge unter den beaufsichtigten ist eine Heuristik, keine
  // Optimierung: es kommt dran, hinter wem noch am meisten haengt
  // (laengster Restpfad). Bei den Maultaschen waehlt das den Teig vor der
  // Fuellung — richtig, weil danach 30 Minuten Ruhe von allein laufen.
  // Ein echtes Optimum waere Scheduling-Theorie fuer fuenf Stufen.
  function plan(dauern, vorstufen, unbeaufsichtigt) {
    var n = dauern.length;

    function vor(i) { return vorOder(vorstufen, i); }
    function betreut(i) { return !(unbeaufsichtigt && unbeaufsichtigt[i]); }

    // Restpfad HINTER der Stufe: wie lange es nach ihrem Ende mindestens
    // noch weitergeht. Vorstufen haben kleinere Indizes (grid.js meldet
    // Verstoesse), deshalb reicht ein Rueckwaertslauf.
    var rest = new Array(n).fill(0);
    for (var i = n - 1; i >= 0; i--) {
      var dahinter = rest[i] + (dauern[i] || 0);
      vor(i).forEach(function (j) {
        if (j >= 0 && j < i && dahinter > rest[j]) rest[j] = dahinter;
      });
    }

    var start = [], ende = [], geplant = new Array(n).fill(false);
    var handFrei = 0;

    // Frueheste Zeit aus den Abhaengigkeiten, oder null solange eine
    // Vorstufe noch ungeplant ist.
    function bereitAb(k) {
      var t = 0, ok = true;
      vor(k).forEach(function (j) {
        if (j < 0 || j >= n) return;
        if (!geplant[j]) ok = false;
        else if (ende[j] > t) t = ende[j];
      });
      return ok ? t : null;
    }

    for (var runde = 0; runde < n; runde++) {
      // Erst alles, was von allein laeuft — es konkurriert mit niemandem
      // und darf keine Sekunde spaeter anfangen als noetig.
      var nachgelegt = true;
      while (nachgelegt) {
        nachgelegt = false;
        for (var u = 0; u < n; u++) {
          if (geplant[u] || betreut(u)) continue;
          var tu = bereitAb(u);
          if (tu === null) continue;
          start[u] = tu;
          ende[u] = tu + (dauern[u] || 0);
          geplant[u] = true;
          nachgelegt = true;
        }
      }

      var beste = -1;
      for (var k = 0; k < n; k++) {
        if (geplant[k] || !betreut(k) || bereitAb(k) === null) continue;
        if (beste < 0 || rest[k] > rest[beste] ||
            (rest[k] === rest[beste] && (dauern[k] || 0) < (dauern[beste] || 0))) {
          beste = k;
        }
      }
      if (beste < 0) break;

      var t = Math.max(bereitAb(beste), handFrei);
      start[beste] = t;
      ende[beste] = t + (dauern[beste] || 0);
      handFrei = ende[beste];
      geplant[beste] = true;
    }

    // Zyklische oder kaputte Vorstufen: grid.js meldet das bereits, hier
    // bekommen die Reste wenigstens einen brauchbaren Wert.
    for (var m = 0; m < n; m++) {
      if (!geplant[m]) { start[m] = 0; ende[m] = dauern[m] || 0; }
    }

    var gesamt = 0;
    for (var e = 0; e < n; e++) if (ende[e] > gesamt) gesamt = ende[e];
    return { starts: start, enden: ende, gesamt: gesamt };
  }

  // Ende der letzten Stufe auf dem kritischen Pfad — die Gesamtdauer,
  // wenn beliebig viel gleichzeitig laufen darf.
  function gesamtdauer(dauern, vorstufen) {
    var start = startzeiten(dauern, vorstufen);
    return dauern.reduce(function (max, d, i) {
      return Math.max(max, start[i] + (d || 0));
    }, 0);
  }

  // Summe der Stufen, an denen man selbst steht.
  function arbeitszeit(dauern, unbeaufsichtigt) {
    return dauern.reduce(function (summe, d, i) {
      return summe + ((unbeaufsichtigt && unbeaufsichtigt[i]) ? 0 : (d || 0));
    }, 0);
  }

  // Gesamtdauer fuer EINE Person: das Ende des Einpersonen-Plans. Der
  // kritische Pfad allein reicht nicht, er laesst zwei beaufsichtigte
  // Stufen gleichzeitig laufen. Auch max(Pfad, Arbeit) reicht nicht: es
  // uebersieht den Leerlauf, der entsteht, wenn man auf eine Ruhezeit
  // wartet und in der Zwischenzeit nichts anfangen kann.
  function realeGesamtdauer(dauern, vorstufen, unbeaufsichtigt) {
    return plan(dauern, vorstufen, unbeaufsichtigt).gesamt;
  }

  // Zeit, in der man tatsaechlich nichts zu tun hat. NICHT die Summe der
  // unbeaufsichtigten Stufen: waehrend der Teig ruht, mischt man die
  // Fuellung — diese 15 Minuten sind nicht frei. Uebrig bleibt die
  // Gesamtdauer minus der Arbeit.
  function freieZeit(dauern, vorstufen, unbeaufsichtigt) {
    var arbeit = arbeitszeit(dauern, unbeaufsichtigt);
    return Math.max(0, realeGesamtdauer(dauern, vorstufen, unbeaufsichtigt) - arbeit);
  }

  // Passt das Rezept ueberhaupt fuer eine Person? Dauert der
  // Einpersonen-Plan laenger als der kritische Pfad, mussten Stufen
  // auseinandergezogen werden, die eigentlich gleichzeitig laufen
  // koennten — zu zweit ginge es schneller.
  function braucht2Haende(dauern, vorstufen, unbeaufsichtigt) {
    return realeGesamtdauer(dauern, vorstufen, unbeaufsichtigt)
         > gesamtdauer(dauern, vorstufen) + 0.5;
  }

  global.RezeptZeitmass = {
    spaltenbreiten: spaltenbreiten,
    noetigeBreite: noetigeBreite,
    startzeiten: startzeiten,
    plan: plan,
    gesamtdauer: gesamtdauer,
    arbeitszeit: arbeitszeit,
    realeGesamtdauer: realeGesamtdauer,
    freieZeit: freieZeit,
    braucht2Haende: braucht2Haende,
    MIN_PX: MIN_PX,
    DECKEL: DECKEL,
    ZUTATEN: ZUTATEN,
    ZUTATEN_MIN_PX: ZUTATEN_MIN_PX,
    vorstufenIds: vorstufenIds,
    vorstufenIndizes: vorstufenIndizes
  };
})(typeof window !== "undefined" ? window : globalThis);
