// stufenliste.js — die Chu-Tabelle hochkant, fuer schmale Schirme (T-0040).
//
// Auf 375 px ist die Tabelle 493 px breit und scrollt quer. Diese Ansicht
// dreht die Kodierung um 90 Grad, statt sie zu opfern:
//
//   Tabelle                     Liste
//   Zeit laeuft nach rechts  -> Zeit laeuft nach unten
//   Klammer ueber Zeilen     -> Einrueckung plus linke Kante
//   Zutaten links als Achse  -> Zutaten IN ihrer Stufe
//   Zusammenlauf als Spalte  -> Gabel aus zwei Kanten
//
// Was die Tabelle mit Geometrie sagt und hier wegfaellt, wird zum Satz:
// das Zeitmass (Breite = Dauer) ist nur noch eine Zahl, und die
// Gleichzeitigkeit, die dort ein Nebeneinander war, wird zur Marke
// "laeuft waehrend ...". Beides ist ausgerechnet, nicht behauptet — die
// Quelle ist derselbe Einpersonen-Plan aus zeitmass.js, der auch die
// Spalten setzt (T-0032).
//
// Beide Ansichten stehen gleichzeitig im DOM, stil.css zeigt genau eine.
// Kein resize-Handler und kein matchMedia, aus demselben Grund wie bei
// den Spaltenbreiten in render.js: was der Browser selbst entscheiden
// kann, entscheidet der Browser. Nebeneffekt und Gewinn: Abhaken und
// Kochmodus arbeiten ueber data-zeile auf beiden Ansichten zugleich, ein
// Geraetewechsel oder Drehen verliert deshalb keinen Zustand.
//
// Die Rechnung steht oben und ist DOM-frei, damit pruefe-grid.js sie
// nachrechnen kann.

(function (global) {
  "use strict";

  var EINZUG_PX = 14;   // eine Ebene Einrueckung
  var MAX_EBENEN = 5;   // danach wird nicht weiter eingerueckt, siehe unten

  // Index der Stufen nach Schritt-ID. Vorstufen stehen in `spalten` immer
  // vor ihrer Stufe (grid.js meldet Verstoesse), deshalb reicht ein
  // Vorwaertslauf ueberall in dieser Datei.
  function indexNachId(modell) {
    var idx = {};
    modell.spalten.forEach(function (s, i) { idx[s.schritt.id] = i; });
    return idx;
  }

  function vorstufenIndizes(modell, idx, i) {
    var s = modell.spalten[i];
    return (s.vorstufen || [])
      .map(function (vid) { return idx[vid]; })
      .filter(function (j) { return j !== undefined && j < i; });
  }

  // Einrueckungstiefe: 0 ohne Vorstufe, sonst eins mehr als die tiefste
  // Vorstufe. Das ist genau die Verschachtelung, die in der Tabelle die
  // Klammer zeichnet — ein Strang, der frisch anfaengt, beginnt wieder
  // links, so wie er dort einen eigenen Zeilenblock beginnt.
  function tiefen(modell) {
    var idx = indexNachId(modell);
    var t = [];
    modell.spalten.forEach(function (s, i) {
      var tief = 0;
      vorstufenIndizes(modell, idx, i).forEach(function (j) {
        if (t[j] + 1 > tief) tief = t[j] + 1;
      });
      t[i] = tief;
    });
    return t;
  }

  // Beaufsichtigte Stufen, die vollstaendig in die Zeit einer
  // unbeaufsichtigten fallen. Bei den Maultaschen liegt "Fuellung
  // mischen" (Minute 10 bis 25) in der Teigruhe (10 bis 40).
  //
  // In der Tabelle sagt das die geteilte Spalte: beide stehen am selben
  // Zeitpunkt. Untereinander ist diese Aussage weg, und ohne sie liest
  // man eine Reihenfolge, wo Gleichzeitigkeit gemeint ist. Deshalb der
  // Titel der tragenden Stufe als Rueckgabe, oder null.
  function ruhefenster(modell) {
    return modell.spalten.map(function (s) {
      if (s.schritt.unbeaufsichtigt) return null;
      var traeger = null;
      modell.spalten.forEach(function (t) {
        if (t === s || !t.schritt.unbeaufsichtigt) return;
        if (t.start <= s.start && s.ende <= t.ende) traeger = t.schritt.titel;
      });
      return traeger;
    });
  }

  // Stufen mit mehr als einer Vorstufe: hier laufen Straenge zusammen.
  // Geliefert werden die Tiefen der eingehenden Straenge (damit die Gabel
  // an den richtigen Stellen ansetzt) und je Strang Titel und Groesse
  // seines Zeilenblocks — `hoehe` ist die Zahl der Zutaten, die er
  // mitbringt, denn eine Zeile ist eine Zutat.
  function gabeln(modell) {
    var idx = indexNachId(modell);
    var tiefe = tiefen(modell);
    return modell.spalten.map(function (s, i) {
      var vs = vorstufenIndizes(modell, idx, i);
      if (vs.length < 2) return null;
      return {
        tiefen: vs.map(function (j) { return tiefe[j]; }),
        teile: vs.map(function (j) {
          return { titel: modell.spalten[j].schritt.titel, zutaten: modell.spalten[j].hoehe };
        })
      };
    });
  }

  // Einrueckung in Pixeln. Ab MAX_EBENEN wird nicht weiter eingerueckt,
  // sonst laeuft ein tiefes Rezept auf 375 px in den rechten Rand. Die
  // Information geht dabei nicht verloren: die Stufe bekommt dann die
  // Marke "Ebene N" (siehe stufeBauen).
  function einzug(tiefe) {
    return Math.min(tiefe, MAX_EBENEN) * EINZUG_PX;
  }

  var rechnung = {
    tiefen: tiefen,
    ruhefenster: ruhefenster,
    gabeln: gabeln,
    einzug: einzug,
    EINZUG_PX: EINZUG_PX,
    MAX_EBENEN: MAX_EBENEN
  };

  if (typeof document === "undefined") {
    global.RezeptStufenliste = rechnung;
    return;
  }

  function el(tag, klasse, text) {
    var n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (text !== undefined && text !== null && text !== "") n.textContent = text;
    return n;
  }

  function minuten(sekunden) {
    return Math.round((sekunden || 0) / 60);
  }

  // Die Gabel: zwei Kanten laufen herunter, treffen sich auf einer
  // Waagerechten und gehen als eine weiter. Dieselbe Figur wie in der
  // Tabelle, nur um 90 Grad gedreht — dort laufen zwei Zeilenbloecke in
  // eine Zelle, hier zwei Kanten in eine.
  //
  // Die Positionen sind gerechnet, nicht gesetzt: jede eingehende Kante
  // sitzt am Einzug ihres Stranges, die Waagerechte reicht von der
  // linkesten bis zur Kante der neuen Stufe.
  function gabelBauen(gabel, tiefeKind) {
    var box = el("div", "stufen-gabel");
    var ziel = einzug(tiefeKind);
    var links = Math.min.apply(null, gabel.tiefen.map(einzug));

    gabel.tiefen.forEach(function (t) {
      var kante = el("span", "gabel-kante");
      kante.style.left = einzug(t) + "px";
      box.appendChild(kante);
    });

    var quer = el("span", "gabel-quer");
    quer.style.left = links + "px";
    quer.style.width = Math.max(0, ziel - links) + 2 + "px";
    box.appendChild(quer);

    var weiter = el("span", "gabel-weiter");
    weiter.style.left = ziel + "px";
    box.appendChild(weiter);

    return box;
  }

  function zutatZeileBauen(zeile, r, faktor) {
    var P = global.RezeptPortionen;
    var zutat = zeile.zutat;

    var box = el("div", "stufe-zutat");

    var mengeText = P.mengeFormatieren(zutat, faktor);
    var menge = el("span", "menge" + (mengeText ? "" : " menge-leer"), mengeText);
    // Dieselben Marker wie in der Tabelle: der Portionswechsel und der
    // Kochmodus finden beide Ansichten ueber sie.
    menge.dataset.zutat = zutat.id;
    menge.dataset.zeile = r;
    var fest = zutat.skalieren === false && zutat.menge !== null;
    if (fest) {
      menge.classList.add("menge-fix");
      menge.title = "wird nicht mit den Portionen skaliert";
    }
    box.appendChild(menge);

    var name = el("span", "zutat");
    name.dataset.zeile = r;
    name.appendChild(el("span", "zutat-name", zutat.name));
    // Zweiter Traeger neben der gedaempften Schrift, wie in der Tabelle.
    if (fest) name.appendChild(el("span", "marke-fix", "fix"));
    if (zutat.notiz) name.appendChild(el("span", "zutat-notiz", zutat.notiz));
    box.appendChild(name);

    global.RezeptRender.abhakenVerdrahten(menge, name);
    return box;
  }

  function stufeBauen(modell, i, werte, portionen) {
    var G = global.RezeptGrid;
    var spalte = modell.spalten[i];
    var schritt = spalte.schritt;
    var tiefe = werte.tiefen[i];

    var klassen = "stufe";
    if (schritt.unbeaufsichtigt) klassen += " schritt-unbeaufsichtigt";

    var stufe = el("article", klassen);
    stufe.style.marginLeft = einzug(tiefe) + "px";
    stufe.dataset.schritt = schritt.id;

    var kopf = el("div", "stufe-kopf");
    kopf.appendChild(el("span", "schritt-titel", schritt.titel));

    var dauer = G.dauerFormatieren(schritt.dauer_s);
    var ab = "ab " + minuten(spalte.start) + " Min";
    kopf.appendChild(el("span", "schritt-dauer", dauer ? dauer + " · " + ab : ab));
    if (schritt.temperatur_c) {
      kopf.appendChild(el("span", "schritt-temperatur", schritt.temperatur_c + " °C"));
    }
    stufe.appendChild(kopf);

    var marken = el("div", "stufe-marken");

    if (schritt.unbeaufsichtigt) {
      marken.appendChild(el("span", "stufen-marke", "⧗ läuft von allein"));
    }
    if (werte.ruhefenster[i]) {
      marken.appendChild(el("span", "stufen-marke",
        "⧗ läuft während »" + werte.ruhefenster[i] + "«"));
    }
    // Ein Strang, der wieder links anfaengt, faengt wirklich neu an. Ohne
    // den Satz liest man die Einrueckung als Ausrutscher.
    if (tiefe === 0 && i > 0) {
      marken.appendChild(el("span", "stufen-marke marke-strang", "┌ neuer Strang"));
    }
    // Jenseits der Einrueckungsgrenze traegt die Position die Tiefe nicht
    // mehr, also traegt sie ein Text.
    if (tiefe > MAX_EBENEN) {
      marken.appendChild(el("span", "stufen-marke marke-strang", "Ebene " + (tiefe + 1)));
    }
    if (marken.childNodes.length) stufe.appendChild(marken);

    var gabel = werte.gabeln[i];
    if (gabel) {
      var zulauf = el("p", "stufe-zulauf");
      zulauf.appendChild(el("span", "zulauf-label", "⤙ Zusammenlauf"));
      zulauf.appendChild(document.createTextNode(" " + gabel.teile.map(function (t) {
        return t.titel + " (" + t.zutaten + (t.zutaten === 1 ? " Zutat)" : " Zutaten)");
      }).join(" + ")));
      stufe.appendChild(zulauf);
    }

    var eigene = spalte.eigeneZeilen || [];
    if (eigene.length) {
      var faktor = portionen / modell.rezept.portionen;
      var liste = el("div", "stufe-zutaten");
      eigene.forEach(function (r) {
        liste.appendChild(zutatZeileBauen(modell.zeilen[r], r, faktor));
      });
      stufe.appendChild(liste);
    } else {
      stufe.appendChild(el("p", "stufe-ohne-zutaten", "keine neuen Zutaten"));
    }

    // Der Wortlaut steht hier, wo die Stufe steht. Auf dem Telefon war er
    // nur ueber td.title erreichbar, also gar nicht (T-0038 hat den
    // Sprung nach unten gebaut, diese Ansicht braucht ihn nicht mehr).
    if (schritt.anweisung) {
      stufe.appendChild(el("p", "anweisung-text", schritt.anweisung));
    }

    return stufe;
  }

  // Baut die Liste fuer ein bereits gerechnetes Modell aus grid.js.
  function stufenlisteBauen(modell, portionen) {
    var werte = {
      tiefen: tiefen(modell),
      ruhefenster: ruhefenster(modell),
      gabeln: gabeln(modell)
    };

    var box = el("section", "stufenliste");
    box.setAttribute("aria-label", "Stufen der Reihe nach");

    modell.spalten.forEach(function (spalte, i) {
      if (werte.gabeln[i]) box.appendChild(gabelBauen(werte.gabeln[i], werte.tiefen[i]));
      box.appendChild(stufeBauen(modell, i, werte, portionen));
    });

    return box;
  }

  global.RezeptStufenliste = {
    tiefen: rechnung.tiefen,
    ruhefenster: rechnung.ruhefenster,
    gabeln: rechnung.gabeln,
    einzug: rechnung.einzug,
    EINZUG_PX: EINZUG_PX,
    MAX_EBENEN: MAX_EBENEN,
    stufenlisteBauen: stufenlisteBauen
  };
})(typeof window !== "undefined" ? window : globalThis);
