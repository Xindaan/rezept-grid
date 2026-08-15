// render.js — Grid-Modell -> DOM. Kennt kein Rezept-Schema ausser ueber
// das Modell aus grid.js.

(function (global) {
  "use strict";

  var G = global.RezeptGrid;
  var P = global.RezeptPortionen;

  function el(tag, klasse, text) {
    var n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (text !== undefined && text !== null && text !== "") n.textContent = text;
    return n;
  }

  // Baut die Chu-Tabelle. Links zwei Spalten (Menge, Zutat), rechts eine
  // Spalte je Schritt mit rowspan ueber seinen Zeilenblock.
  function tabelleBauen(modell, portionen) {
    var tabelle = el("table", "grid");
    var koerper = el("tbody");
    var faktor = portionen / modell.rezept.portionen;

    // Welche Stufe laeuft neben einer anderen her? Start und Ende stehen
    // seit T-0032 im Modell — der Zeitplan aus grid.js, nicht der
    // Nachbarvergleich von vorher. Die Marke bekommen nur beaufsichtigte
    // Stufen: bei einer Ruhezeit sagt schon "laeuft von allein", dass
    // daneben Platz ist.
    var laeuftParallel = modell.spalten.map(function (s) {
      if (s.schritt.unbeaufsichtigt) return false;
      return modell.spalten.some(function (t) {
        return t !== s && t.start < s.ende && s.start < t.ende;
      });
    });

    var gruppen = nachSpalten(modell);

    // Fuehrungslinie: die Unterkante eines Blocks laeuft nach links bis
    // zur Zutatenachse durch. Die Strecke besteht aus den leeren Zellen
    // der Spalten links davon — endet dort eine fruehere Stufe in
    // derselben Zeile, zeichnet deren eigene Unterkante das Stueck.
    // Spalte 0 braucht keine (sie grenzt an die Zutaten), die letzte auch
    // nicht (ihre Unterkante ist der Tabellenschluss).
    var letzteSpalte = modell.spaltenAnzahl - 1;
    var blockEnde = new Map(); // Zeile -> hoechster Spaltenindex, der dort endet
    modell.spalten.forEach(function (spalte) {
      if (spalte.spalte === 0 || spalte.spalte === letzteSpalte) return;
      var bisher = blockEnde.get(spalte.bis);
      if (bisher === undefined || spalte.spalte > bisher) blockEnde.set(spalte.bis, spalte.spalte);
    });

    modell.zeilen.forEach(function (zeile, r) {
      var tr = el("tr");
      var zutat = zeile.zutat;

      var mengeText = P.mengeFormatieren(zutat, faktor);
      var tdMenge = el("td", "menge" + (mengeText ? "" : " menge-leer"), mengeText);
      // Marker fuer die spaetere Aktualisierung beim Portionswechsel.
      tdMenge.dataset.zutat = zutat.id;
      // Zeilenindex fuer die Hervorhebung im Kochmodus (T-0004).
      tdMenge.dataset.zeile = r;
      if (zutat.skalieren === false && zutat.menge !== null) {
        tdMenge.classList.add("menge-fix");
        tdMenge.title = "wird nicht mit den Portionen skaliert";
      }
      zeile.festeMenge = zutat.skalieren === false && zutat.menge !== null;
      tr.appendChild(tdMenge);

      var tdZutat = el("td", "zutat");
      tdZutat.dataset.zeile = r;
      tdZutat.appendChild(el("span", "zutat-name", zutat.name));
      // Zweiter Traeger neben der gedaempften Schrift: eine sichtbare
      // Marke. Wer Farbunterschiede nicht wahrnimmt, sieht sonst nicht,
      // dass diese Menge beim Portionswechsel stehen bleibt.
      if (zeile.festeMenge) tdZutat.appendChild(el("span", "marke-fix", "fix"));
      if (zutat.notiz) tdZutat.appendChild(el("span", "zutat-notiz", zutat.notiz));
      abhakenVerdrahten(tdMenge, tdZutat);
      tr.appendChild(tdZutat);

      gruppen.forEach(function (stufen, c) {
        var beginnt = null, verdeckt = false;
        stufen.forEach(function (s) {
          if (s.von === r) beginnt = s;
          else if (r > s.von && r <= s.bis) verdeckt = true;
        });

        if (beginnt) {
          tr.appendChild(schrittZelleBauen(beginnt, laeuftParallel[modell.spalten.indexOf(beginnt)]));
        } else if (verdeckt) {
          // von der rowspan-Zelle darueber abgedeckt — nichts einfuegen
        } else {
          var leer = el("td", "leer");
          // Liegt rechts von dieser leeren Zelle ein Block, der genau in
          // dieser Zeile endet? Dann traegt sie ein Stueck seiner
          // Fuehrungslinie.
          var endetHier = blockEnde.get(r);
          if (endetHier !== undefined && endetHier > c) leer.classList.add("fuehrungslinie");
          tr.appendChild(leer);
        }
      });

      koerper.appendChild(tr);
    });

    // Spaltengruppe: unter table-layout: fixed liest der Browser die
    // Breiten NUR aus der ersten Zeile. Ausser der ersten beginnt jede
    // Stufenzelle wegen der rowspans spaeter — eine Breite auf der Zelle
    // wuerde still verworfen. Das colgroup gilt dagegen fuer die Spalte.
    var gruppe = document.createElement("colgroup");
    for (var c = 0; c < modell.spaltenAnzahl + 2; c++) {
      gruppe.appendChild(document.createElement("col"));
    }
    // Reihenfolge im Markup: colgroup, thead, tbody.
    tabelle.appendChild(gruppe);
    tabelle.appendChild(zeitachseBauen(modell));
    tabelle.appendChild(koerper);
    return tabelle;
  }

  // Stufen nach Spalte gruppiert. Eine Spalte kann mehrere Stufen tragen,
  // wenn sie verschiedene Zeilen belegen (paralleler Strang).
  function nachSpalten(modell) {
    var gruppen = [];
    for (var c = 0; c < modell.spaltenAnzahl; c++) gruppen[c] = [];
    modell.spalten.forEach(function (s) { gruppen[s.spalte].push(s); });
    return gruppen;
  }

  // Start und Dauer je SPALTE: Beginn ist der frueheste Start ihrer
  // Stufen, Dauer die Spanne bis zum spaetesten Ende. Bei einer Spalte
  // mit nur einer Stufe ist das genau deren Dauer.
  function spaltenZeiten(modell) {
    var starts = [], dauern = [];
    nachSpalten(modell).forEach(function (stufen, c) {
      var von = Infinity, bis = 0;
      stufen.forEach(function (s) {
        von = Math.min(von, s.start);
        bis = Math.max(bis, s.ende);
      });
      starts[c] = von === Infinity ? 0 : von;
      dauern[c] = Math.max(0, bis - starts[c]);
    });
    return { starts: starts, dauern: dauern };
  }

  // Kopfzeile mit den Startzeitpunkten der Stufen.
  function zeitachseBauen(modell) {
    var kopf = el("thead", "zeitachse");
    var tr = el("tr");
    var beschriftung = el("th", "zeitachse-label", "Zeitachse ▸");
    beschriftung.colSpan = 2;
    beschriftung.scope = "row";
    tr.appendChild(beschriftung);

    var zeiten = spaltenZeiten(modell);
    zeiten.starts.forEach(function (sekunden, c) {
      var minuten = Math.round(sekunden / 60);
      var letzte = c === zeiten.starts.length - 1;
      var th = el("th", "zeitachse-marke", letzte ? minuten + " Min" : String(minuten));
      th.scope = "col";
      tr.appendChild(th);
    });
    kopf.appendChild(tr);
    return kopf;
  }

  // Setzt die Spaltenbreiten aus den Dauern. Muss nach dem Einhaengen
  // laufen, weil erst dann die Containerbreite feststeht, und erneut bei
  // Groessenaenderung.
  function breitenAnwenden(tabelle, modell) {
    var Z = global.RezeptZeitmass;
    var rahmen = tabelle.parentElement;
    if (!rahmen) return;

    var zeiten = spaltenZeiten(modell);
    var dauern = zeiten.dauern;
    var noetig = Z.noetigeBreite(dauern.length);

    // Bewusst an der MINDESTbreite gerechnet, nicht an der verfuegbaren.
    // Prozentwerte, die bei 1000 px eine Untergrenze von 72 px ergeben,
    // unterschreiten sie bei 740 px — die Untergrenze haelt nur, wenn sie
    // am schmalsten Fall haengt. Nebeneffekt und Gewinn: die Verhaeltnisse
    // sind damit bei jeder Fensterbreite dieselben, das Bild springt beim
    // Groesserziehen nicht, und es braucht keine Neuberechnung.
    var mass = Z.spaltenbreiten(dauern, noetig);

    // Untergrenze per CSS statt per JavaScript. Im Vorschau-Pane feuert
    // ResizeObserver nachweislich nie; eine Untergrenze, die daran haengt,
    // waere dort einfach weg.
    tabelle.style.minWidth = noetig + "px";
    tabelle.style.width = "100%";

    // Linker Rand der Zutatenspalte fuer position: sticky (T-0023).
    // Waagerecht gescrollt wird nur, wenn die Tabelle auf ihrer
    // Mindestbreite steht — genau dort stimmt dieser Wert exakt.
    // Die tatsaechliche Breite, nicht der nominale Anteil: auf schmalen
    // Geraeten steht die Mengenspalte auf ihrer Pixelgrenze, und ein
    // Versatz aus dem Anteil wuerde die Zutatenspalte darueberschieben.
    tabelle.style.setProperty("--zutat-links", Math.round(mass.zutatenPx[0]) + "px");

    // Nominale Anteile wie bisher. Die Pixeluntergrenze der beiden
    // Zutatenspalten setzt stil.css nur fuer schmale Schirme (T-0039) —
    // `max(6%, 56px)` waere der naheliegende Weg und funktioniert NICHT:
    // im Browser gemessen verwirft eine <col> jede min()/max()-Breite und
    // faellt auf gleichmaessige Verteilung zurueck (beide Spalten 80 px
    // statt 56 und 104). Reine Prozent- und reine Pixelwerte gelten.
    var spalten = tabelle.querySelectorAll("colgroup col");
    spalten[0].style.width = (mass.zutaten[0] * 100).toFixed(3) + "%";
    spalten[1].style.width = (mass.zutaten[1] * 100).toFixed(3) + "%";
    mass.stufen.forEach(function (anteil, i) {
      if (spalten[i + 2]) spalten[i + 2].style.width = (anteil * 100).toFixed(3) + "%";
    });

    // Gedeckelte Stufen sagen, dass ihre Achse gekuerzt wurde — sonst
    // liest man eine Breite ab, die nicht der Dauer entspricht.
    modell.spalten.forEach(function (spalte) {
      var c = spalte.spalte;
      var td = tabelle.querySelector('[data-schritt="' + spalte.schritt.id + '"]');
      if (!td) return;
      var alt = td.querySelector(".kuerzung");
      if (alt) alt.remove();
      td.classList.toggle("ist-gekuerzt", !!mass.gekuerzt[c]);
      if (mass.gekuerzt[c]) {
        var zeit = Math.round(mass.zeitanteil[c] * 100);
        var breit = Math.round(mass.stufen[c] * 100);
        td.appendChild(el("span", "kuerzung", "∕∕ Achse gekürzt, " + zeit + " % → " + breit + " %"));
      }
    });
  }

  // Tippen oder Enter auf einer Stufenzelle rollt zum Wortlaut und hebt
  // ihn kurz hervor. Bewusst kein neues Fenster und keine Sprechblase:
  // der Text steht bereits auf der Seite, es fehlte nur der Weg dorthin.
  function anweisungSprungVerdrahten(td, schrittId) {
    function springen() {
      var ziel = document.getElementById("anweisung-" + schrittId);
      if (!ziel) return;
      ziel.scrollIntoView({ behavior: "smooth", block: "center" });
      ziel.classList.remove("ist-angesprungen");
      // Reflow erzwingen, sonst startet die Animation beim zweiten Tippen
      // auf dieselbe Stufe nicht neu.
      void ziel.offsetWidth;
      ziel.classList.add("ist-angesprungen");
    }
    td.addEventListener("click", springen);
    td.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); springen(); }
    });
  }

  function schrittZelleBauen(spalte, parallel) {
    var schritt = spalte.schritt;
    var klassen = "schritt";
    if (parallel) klassen += " laeuft-parallel";
    if (spalte.neueZutaten === 0) klassen += " schritt-ohne-zutaten";
    if (schritt.unbeaufsichtigt) klassen += " schritt-unbeaufsichtigt";

    var td = el("td", klassen);
    td.rowSpan = spalte.hoehe;
    // title bleibt fuer die Maus — aber es darf nicht der einzige Weg
    // zur Anweisung sein. Auf einem Telefon gibt es keine Geste dafuer,
    // und ein Screenreader liest es je nach Einstellung nicht vor. Die
    // Zelle springt deshalb zum Wortlaut weiter unten (T-0038).
    td.title = schritt.anweisung || "";
    td.dataset.schritt = schritt.id;
    if (schritt.anweisung) {
      td.tabIndex = 0;
      td.setAttribute("role", "button");
      td.setAttribute("aria-label", schritt.titel + " — Anweisung anzeigen");
      td.classList.add("schritt-tippbar");
      anweisungSprungVerdrahten(td, schritt.id);
    }
    td.appendChild(el("span", "schritt-titel", schritt.titel));

    var dauer = G.dauerFormatieren(schritt.dauer_s);
    if (dauer) td.appendChild(el("span", "schritt-dauer", dauer));
    if (schritt.temperatur_c) {
      td.appendChild(el("span", "schritt-temperatur", schritt.temperatur_c + " °C"));
    }
    // Wartezeit wird nicht nur eingefaerbt, sondern benannt.
    if (schritt.unbeaufsichtigt) {
      td.appendChild(el("span", "stufen-marke", "⧗ läuft von allein"));
    }
    // Und eine Stufe, die nebenher laeuft, sagt es auch — sonst liest man
    // die Tabelle als Reihenfolge, obwohl sie hier Gleichzeitigkeit meint.
    if (parallel) {
      td.appendChild(el("span", "stufen-marke marke-parallel", "∥ nebenher möglich"));
    }
    return td;
  }

  // Umschaltung der Portionszahl. `beiWechsel` bekommt den neuen Wert.
  function portionsWahlBauen(rezept, portionen, beiWechsel) {
    // Segmentiert statt vier Einzelknoepfe: eine Rille, in der genau eine
    // Zahl gewaehlt ist. Das liest sich als "eine Groesse von mehreren"
    // statt als vier unabhaengige Schalter.
    var wahl = el("div", "portionen-wahl portionen-segment");
    var knoepfe = [];

    P.portionsOptionen(rezept.portionen).forEach(function (wert) {
      var knopf = el("button", "portionen-knopf", String(wert));
      knopf.type = "button";
      knopf.setAttribute("aria-pressed", String(wert === portionen));
      if (wert === portionen) knopf.classList.add("ist-aktiv");
      knopf.addEventListener("click", function () {
        knoepfe.forEach(function (k) {
          var aktiv = k === knopf;
          k.classList.toggle("ist-aktiv", aktiv);
          k.setAttribute("aria-pressed", String(aktiv));
        });
        beiWechsel(wert);
      });
      knoepfe.push(knopf);
      wahl.appendChild(knopf);
    });

    wahl.appendChild(el("span", "portionen-einheit", rezept.portionen_einheit || "Portionen"));
    return wahl;
  }

  // Drei Kennzahlen: was man selbst am Topf steht, was von allein laeuft,
  // und was das zusammen bedeutet. "ohne Zutun" ist neu und rechnet sich
  // aus den Stufen mit unbeaufsichtigt: true — die Zahl beantwortet die
  // Frage "kann ich nebenher etwas anderes machen".
  // Vorstufen eines Rezepts als Schritt-Indizes. Wie in grid.js: fehlt
  // das Feld, gilt der unmittelbare Vorgaenger.
  function vorstufenAusRezept(rezept) {
    var idx = {};
    rezept.schritte.forEach(function (s, i) { idx[s.id] = i; });
    return rezept.schritte.map(function (s, i) {
      if (s.vorstufen === undefined || s.vorstufen === null) return i > 0 ? [i - 1] : [];
      return s.vorstufen.map(function (v) { return idx[v]; })
                        .filter(function (j) { return j !== undefined; });
    });
  }

  function kennzahlenBauen(rezept) {
    var Z = global.RezeptZeitmass;
    var dauern = rezept.schritte.map(function (s) { return s.dauer_s; });
    var unbeauf = rezept.schritte.map(function (s) { return !!s.unbeaufsichtigt; });
    var vorstufen = vorstufenAusRezept(rezept);

    // NICHT die Summe der unbeaufsichtigten Stufen: waehrend der Teig
    // ruht, mischt man die Fuellung — diese Zeit ist nicht frei. Frei
    // bleibt die Gesamtdauer minus der eigenen Arbeit.
    var ohneZutun = Z.freieZeit(dauern, vorstufen, unbeauf);

    var streifen = el("div", "kennzahlen");
    [
      ["Arbeit", rezept.zeit_aktiv_s],
      ["ohne Zutun", ohneZutun],
      ["gesamt", rezept.zeit_gesamt_s]
    ].forEach(function (paar) {
      if (!paar[1]) return;
      var kachel = el("div", "kennzahl");
      kachel.appendChild(el("span", "kennzahl-wert", G.dauerFormatieren(paar[1])));
      kachel.appendChild(el("span", "kennzahl-label", paar[0]));
      streifen.appendChild(kachel);
    });

    // Passt das Rezept nicht fuer eine Person, ist das eine Aussage ueber
    // die Planung und keine Nebensaechlichkeit.
    if (Z.braucht2Haende(dauern, vorstufen, unbeauf)) {
      streifen.appendChild(el("p", "kennzahl-warnung",
        "Die Zeitachse zeigt den Weg für eine Person: " +
        G.dauerFormatieren(Z.realeGesamtdauer(dauern, vorstufen, unbeauf)) +
        ". Zu zweit wären es " + G.dauerFormatieren(Z.gesamtdauer(dauern, vorstufen)) +
        " — zwei Schritte fallen zusammen, die allein nacheinander gehen."));
    }
    return streifen;
  }

  function kopfBauen(rezept, portionen, beiWechsel, beiKochstart) {
    var kopf = el("header", "rezept-kopf");
    kopf.appendChild(el("h1", null, rezept.titel));
    if (rezept.untertitel) kopf.appendChild(el("p", "untertitel", rezept.untertitel));

    // Ausstattung und Merkmale stehen seit T-0039.3 unter dem Grid,
    // siehe anhangBauen. Der Kopf traegt nur noch, was man braucht, um
    // das Grid zu lesen: Titel, Einordnung, Zeiten, Portionen, Start.

    kopf.appendChild(kennzahlenBauen(rezept));

    var ergibt = el("div", "ergibt");
    ergibt.appendChild(el("span", "ergibt-label", "Ergibt"));
    ergibt.appendChild(portionsWahlBauen(rezept, portionen, beiWechsel));
    kopf.appendChild(ergibt);

    var leiste = el("div", "kopf-leiste");

    if (beiKochstart) {
      var kochen = el("button", "koch-start", "Kochmodus starten");
      kochen.type = "button";
      kochen.addEventListener("click", beiKochstart);
      leiste.appendChild(kochen);
    }

    kopf.appendChild(leiste);
    return kopf;
  }

  // Ausstattung und Merkmale (T-0039.3). Beides sind Angaben, die man
  // einmal vor dem Kochen liest — sie standen zwischen dem Titel und der
  // Sache selbst und haben auf 375 px den ersten Bildschirm mit gefuellt.
  // Unter dem Grid stehen sie dort, wo man sie sucht: beim Nachschlagen,
  // nicht beim Kochen.
  //
  // Das Leerzeichen gehoert weiter in den Text und nicht in die
  // CSS-Marge, sonst klebt beim Kopieren "AusstattungRuehrschuessel"
  // (T-0037).
  function anhangBauen(rezept) {
    var hatGefaess = !!rezept.gefaess;
    var hatTags = !!(rezept.tags && rezept.tags.length);
    if (!hatGefaess && !hatTags) return null;

    var box = el("section", "rezept-anhang");

    if (hatGefaess) {
      var geraet = el("p", "gefaess");
      geraet.appendChild(el("span", "gefaess-label", "Ausstattung"));
      geraet.appendChild(document.createTextNode(" " + rezept.gefaess));
      box.appendChild(geraet);
    }

    if (hatTags) {
      var tags = el("ul", "tags");
      rezept.tags.forEach(function (t) { tags.appendChild(el("li", null, t)); });
      box.appendChild(tags);
    }

    return box;
  }

  function schritteBauen(rezept) {
    var box = el("section", "anweisungen");
    box.appendChild(el("h2", null, "Schritte im Wortlaut"));
    var liste = el("ol");
    rezept.schritte.forEach(function (s) {
      var li = el("li");
      // Sprungziel fuer die Stufenzelle im Grid (T-0038).
      li.id = "anweisung-" + s.id;
      li.appendChild(el("strong", null, s.titel));
      li.appendChild(el("span", "anweisung-text", s.anweisung));
      liste.appendChild(li);
    });
    box.appendChild(liste);
    return box;
  }

  function hinweiseBauen(rezept) {
    if (!rezept.hinweise || !rezept.hinweise.length) return null;
    var box = el("section", "hinweise");
    box.appendChild(el("h2", null, "Hinweise"));
    var liste = el("ul");
    rezept.hinweise.forEach(function (h) { liste.appendChild(el("li", null, h)); });
    box.appendChild(liste);
    return box;
  }

  function quelleBauen(rezept) {
    if (!rezept.quelle) return null;
    var q = rezept.quelle;
    var p = el("p", "quelle");
    p.appendChild(el("span", null, "Quelle: "));
    var bezeichnung = [q.titel, q.autor].filter(Boolean).join(" — ") || q.url;
    if (q.url) {
      var a = el("a", null, bezeichnung);
      a.href = q.url;
      a.rel = "noopener noreferrer";
      p.appendChild(a);
    } else {
      p.appendChild(el("span", null, bezeichnung));
    }
    // Trennzeichen als echter Text, nicht als CSS-Marge oder ::before —
    // sonst klebt beim Kopieren "einfachkochen.deMengen und Zeiten".
    // Derselbe Fehler wie bei der Ausstattung (T-0037); dort habe ich ihn
    // behoben und nicht geprueft, wer ihn sonst noch hat. Sichtbar wurde
    // er erst, als mit dem Omelett das erste Rezept eine `quelle` bekam.
    if (q.hinweis) {
      p.appendChild(document.createTextNode(" — "));
      p.appendChild(el("span", "quelle-hinweis", q.hinweis));
    }
    return p;
  }

  function problemeBauen(probleme) {
    if (!probleme.length) return null;
    var box = el("section", "probleme");
    box.appendChild(el("h2", null, "Probleme im Rezept"));
    var liste = el("ul");
    probleme.forEach(function (p) { liste.appendChild(el("li", null, p)); });
    box.appendChild(liste);
    return box;
  }

  // Schreibt die Mengenzellen fuer eine neue Portionszahl neu. Das Grid
  // selbst bleibt stehen — die Zeilen und Bloecke aendern sich nicht.
  function mengenAktualisieren(ziel, modell, portionen) {
    var faktor = portionen / modell.rezept.portionen;
    // querySelectorAll, nicht querySelector: seit T-0040 stehen Tabelle
    // und Stufenliste gleichzeitig im DOM, und beide tragen die Menge.
    modell.zeilen.forEach(function (zeile) {
      var text = P.mengeFormatieren(zeile.zutat, faktor);
      Array.prototype.forEach.call(
        ziel.querySelectorAll('.menge[data-zutat="' + zeile.zutat.id + '"]'),
        function (zelle) {
          zelle.textContent = text;
          zelle.classList.toggle("menge-leer", !text);
        }
      );
    });
  }

  // Zutaten abhaken (T-0005), fuer Mise en place: ein Klick auf die Zeile
  // streicht sie durch. Der Zustand lebt nur in der Sitzung — beim Kochen
  // will man den Haken von gestern nicht wiedersehen.
  //
  // Die Zutatenzelle wird dafuer bedienbar gemacht statt einer eigenen
  // Kontrollkaestchen-Spalte: eine dritte Spalte kostet Breite, die im
  // Zeitmass fehlt, und die ganze Zeile ist das groessere Ziel fuer
  // fettige Finger.
  function abhakenVerdrahten(tdMenge, tdZutat) {
    tdZutat.setAttribute("role", "button");
    tdZutat.tabIndex = 0;
    tdZutat.setAttribute("aria-pressed", "false");

    // Abgehakt wird die ZEILE, nicht die Zelle: seit T-0040 zeigt dieselbe
    // Zutat in zwei Ansichten, und ein Haken, der nur in einer sitzt, ist
    // beim Drehen des Telefons wieder weg. Ohne data-zeile (Einkaufsliste)
    // bleibt es beim Paar.
    function umschalten() {
      var an = !tdZutat.classList.contains("abgehakt");
      var r = tdZutat.dataset ? tdZutat.dataset.zeile : undefined;
      var wurzel = tdZutat.closest(".rezept") || document;
      var zellen = (r === undefined)
        ? [tdMenge, tdZutat]
        : wurzel.querySelectorAll('[data-zeile="' + r + '"]');
      Array.prototype.forEach.call(zellen, function (zelle) {
        zelle.classList.toggle("abgehakt", an);
        if (zelle.getAttribute("role") === "button") {
          zelle.setAttribute("aria-pressed", String(an));
        }
      });
    }

    tdZutat.addEventListener("click", umschalten);
    tdZutat.addEventListener("keydown", function (ereignis) {
      if (ereignis.key === "Enter" || ereignis.key === " ") {
        ereignis.preventDefault();
        umschalten();
      }
    });
  }

  // Koppelt Schrittzelle und zugehoerige Zutaten beim Ueberfahren.
  // Das Grid behauptet, dass diese Zutaten zu dieser Stufe gehoeren —
  // die Hervorhebung macht die Behauptung nachpruefbar, ohne dass man
  // die Treppenform mit dem Auge verfolgen muss.
  function kopplungVerdrahten(modell, ziel) {
    var schrittVonZeile = new Map();
    modell.spalten.forEach(function (spalte) {
      (spalte.eigeneZeilen || []).forEach(function (r) {
        schrittVonZeile.set(r, spalte);
      });
    });

    function umschalten(spalte, an) {
      if (!spalte) return;
      var td = ziel.querySelector('[data-schritt="' + spalte.schritt.id + '"]');
      if (td) td.classList.toggle("gekoppelt", an);
      (spalte.eigeneZeilen || []).forEach(function (r) {
        Array.prototype.forEach.call(
          ziel.querySelectorAll('[data-zeile="' + r + '"]'),
          function (zelle) { zelle.classList.toggle("gekoppelt", an); }
        );
      });
    }

    // Im Kochmodus fuehrt die Stufennavigation, nicht der Mauszeiger.
    function erlaubt() { return !document.body.classList.contains("kochmodus"); }

    function koppeln(element, spalte) {
      if (!element || !spalte) return;
      element.addEventListener("mouseenter", function () {
        if (erlaubt()) umschalten(spalte, true);
      });
      element.addEventListener("mouseleave", function () { umschalten(spalte, false); });
    }

    modell.spalten.forEach(function (spalte) {
      koppeln(ziel.querySelector('[data-schritt="' + spalte.schritt.id + '"]'), spalte);
    });

    modell.zeilen.forEach(function (_, r) {
      var spalte = schrittVonZeile.get(r);
      Array.prototype.forEach.call(
        ziel.querySelectorAll('[data-zeile="' + r + '"]'),
        function (zelle) { koppeln(zelle, spalte); }
      );
    });
  }

  // Einkaufsliste (T-0026). `auswahl` ist [{rezept, portionen}].
  function einkaufRendern(auswahl, ziel) {
    var E = global.RezeptEinkauf;
    ziel.textContent = "";

    var zurueck = el("a", "zurueck-link", "Alle Rezepte");
    zurueck.href = "index.html";
    ziel.appendChild(zurueck);

    var kopf = el("header", "rezept-kopf");
    kopf.appendChild(el("h1", null, "Einkaufsliste"));
    kopf.appendChild(el("p", "untertitel",
      auswahl.length === 1 ? "Für ein Rezept" : "Für " + auswahl.length + " Rezepte"));
    ziel.appendChild(kopf);

    if (!auswahl.length) {
      var leer = el("section", "probleme");
      leer.appendChild(el("h2", null, "Kein Rezept gewählt"));
      leer.appendChild(el("p", null,
        "In der Übersicht auswählen, welche Rezepte auf die Liste sollen."));
      ziel.appendChild(leer);
      return;
    }

    // Je Rezept die Portionszahl einstellbar — die Liste soll das
    // abbilden, was tatsaechlich gekocht wird, nicht die Basisgroesse.
    var quellen = el("section", "einkauf-quellen");
    auswahl.forEach(function (eintrag) {
      var zeile = el("div", "einkauf-quelle");
      var name = el("a", "einkauf-quelle-name", eintrag.rezept.titel);
      name.href = "index.html?rezept=" + encodeURIComponent(eintrag.rezept.id);
      zeile.appendChild(name);
      zeile.appendChild(portionsWahlBauen(eintrag.rezept, eintrag.portionen, function (neu) {
        eintrag.portionen = neu;
        // Die Auswahl steht in der URL, damit die Liste teilbar bleibt
        // und ein Neuladen sie nicht verliert.
        var text = E.auswahlSchreiben(auswahl.map(function (a) {
          return { id: a.rezept.id, portionen: a.portionen };
        }));
        global.history.replaceState(null, "", "index.html?einkauf=" + text);
        einkaufRendern(auswahl, ziel);
      }));
      quellen.appendChild(zeile);
    });
    ziel.appendChild(quellen);

    var posten = E.listeBauen(auswahl);
    var liste = el("ul", "einkauf-liste");
    posten.forEach(function (p) {
      var eintrag = el("li", "einkauf-posten");
      eintrag.setAttribute("role", "button");
      eintrag.tabIndex = 0;
      eintrag.setAttribute("aria-pressed", "false");

      var menge = p.mengenlos ? "" : P.mengeFormatieren({
        menge: p.menge, menge_bis: p.menge_bis, einheit: p.einheit
      }, 1);
      eintrag.appendChild(el("span", "posten-menge" + (menge ? "" : " menge-leer"), menge));

      var text = el("span", "posten-text");
      text.appendChild(el("span", "posten-name", p.name));
      if (p.fix) text.appendChild(el("span", "marke-fix", "fix"));
      text.appendChild(el("span", "posten-quellen", p.quellen.join(" · ")));
      eintrag.appendChild(text);

      function umschalten() {
        var an = !eintrag.classList.contains("abgehakt");
        eintrag.classList.toggle("abgehakt", an);
        eintrag.setAttribute("aria-pressed", String(an));
      }
      eintrag.addEventListener("click", umschalten);
      eintrag.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); umschalten(); }
      });

      liste.appendChild(eintrag);
    });
    ziel.appendChild(liste);

    var hinweis = el("p", "einkauf-hinweis",
      "Gleicher Name und gleiche Einheit werden addiert. Feste Mengen (fix) " +
      "wachsen nicht mit der Portionszahl und werden nicht summiert — dort " +
      "steht der größte Bedarf.");
    ziel.appendChild(hinweis);
  }

  // Rezept-Uebersicht (T-0006). Quelle ist das Manifest, weil es ohne
  // Server kein Verzeichnis-Listing gibt — dieselbe Liste, die auch der
  // file://-Ladeweg benutzt.
  function uebersichtRendern(rezepte, ziel) {
    ziel.textContent = "";

    var kopf = el("header", "rezept-kopf");
    kopf.appendChild(el("h1", null, "Rezepte"));
    kopf.appendChild(el("p", "untertitel",
      rezepte.length === 1 ? "Ein Rezept" : rezepte.length + " Rezepte"));
    ziel.appendChild(kopf);

    if (!rezepte.length) {
      var leer = el("section", "probleme");
      leer.appendChild(el("h2", null, "Keine Rezepte gefunden"));
      leer.appendChild(el("p", null,
        "rezepte/manifest.js ist leer oder wurde nicht geladen. Erzeugen mit: node tools/build-manifest.js"));
      ziel.appendChild(leer);
      return;
    }

    var liste = el("ul", "rezept-liste");
    rezepte.slice().sort(function (a, b) {
      return a.titel.localeCompare(b.titel, "de");
    }).forEach(function (r) {
      var eintrag = el("li");
      var link = el("a", "rezept-karte");
      link.href = "?rezept=" + encodeURIComponent(r.id);

      link.appendChild(el("span", "karte-titel", r.titel));
      if (r.untertitel) link.appendChild(el("span", "karte-untertitel", r.untertitel));

      var fakten = [];
      if (r.zeit_gesamt_s) fakten.push(G.dauerFormatieren(r.zeit_gesamt_s));
      fakten.push(r.portionen + " " + (r.portionen_einheit || "Portionen"));
      fakten.push(r.schritte.length + " Schritte");
      link.appendChild(el("span", "karte-fakten", fakten.join(" · ")));

      if (r.tags && r.tags.length) {
        var tags = el("span", "karte-tags", r.tags.join(", "));
        link.appendChild(tags);
      }

      eintrag.appendChild(link);

      // Auswahl fuer die Einkaufsliste. Bewusst NEBEN dem Link statt
      // darin — ein Kontrollkaestchen in einem Link ist weder bedienbar
      // noch vorlesbar.
      var wahl = el("label", "karte-wahl");
      var kasten = document.createElement("input");
      kasten.type = "checkbox";
      kasten.value = r.id;
      kasten.addEventListener("change", auswahlAktualisieren);
      wahl.appendChild(kasten);
      wahl.appendChild(el("span", null, "Für die Einkaufsliste"));
      eintrag.appendChild(wahl);

      liste.appendChild(eintrag);
    });
    ziel.appendChild(liste);

    // Leiste, die erst erscheint, wenn etwas gewaehlt ist.
    var leiste = el("div", "einkauf-leiste");
    leiste.hidden = true;
    var zaehler = el("span", "einkauf-zaehler");
    var knopf = el("a", "koch-start", "Einkaufsliste öffnen");
    leiste.appendChild(zaehler);
    leiste.appendChild(knopf);
    ziel.appendChild(leiste);

    function auswahlAktualisieren() {
      var gewaehlt = [].slice.call(ziel.querySelectorAll(".karte-wahl input:checked"))
                       .map(function (k) { return k.value; });
      leiste.hidden = gewaehlt.length === 0;
      zaehler.textContent = gewaehlt.length === 1
        ? "1 Rezept gewählt"
        : gewaehlt.length + " Rezepte gewählt";
      knopf.href = "index.html?einkauf=" + gewaehlt.join(",");
    }
  }

  // Rendert ein Rezept vollstaendig in `ziel`.
  function rezeptRendern(rezept, ziel) {
    var modell = G.gridModellBauen(rezept);
    var portionen = rezept.portionen;
    modell.portionen = function () { return portionen; };

    ziel.textContent = "";

    var problemBox = problemeBauen(modell.probleme);
    if (problemBox) ziel.appendChild(problemBox);

    var zurueck = el("a", "zurueck-link", "Alle Rezepte");
    // Nicht "./": das ist ein Verzeichnis-URL, und den reicht macOS beim
    // Oeffnen per file:// an den Finder weiter statt die Seite zu laden.
    // Ueber http faellt das nicht auf, weil der Server dort die
    // index.html ausliefert.
    zurueck.href = "index.html";
    ziel.appendChild(zurueck);

    // Der Kochmodus wird erst beim ersten Start gebaut — vorher steht das
    // Grid, auf das er sich bezieht, noch gar nicht im DOM.
    var kochmodus = null;
    var beiKochstart = global.RezeptKochmodus ? function () {
      if (!kochmodus) kochmodus = global.RezeptKochmodus.kochmodusBauen(modell, ziel);
      if (kochmodus) kochmodus.starten();
    } : null;
    modell.kochmodus = function () { return kochmodus; };

    ziel.appendChild(kopfBauen(rezept, portionen, function (neu) {
      portionen = neu;
      mengenAktualisieren(ziel, modell, portionen);
    }, beiKochstart));

    var rahmen = el("div", "grid-rahmen");
    var tabelle = tabelleBauen(modell, portionen);
    rahmen.appendChild(tabelle);
    ziel.appendChild(rahmen);
    kopplungVerdrahten(modell, ziel);

    // Einmal genuegt: die Breiten sind Prozentwerte an einer festen
    // Mindestbreite, der Browser rechnet den Rest bei jeder Fenstergroesse
    // selbst. Kein ResizeObserver, kein resize-Handler.
    breitenAnwenden(tabelle, modell);

    // Dieselbe Rechnung, andere Kodierung: die Liste kommt aus demselben
    // Modell wie die Tabelle (T-0040). Welche von beiden sichtbar ist,
    // entscheidet stil.css — deshalb stehen beide im DOM und es gibt
    // keinen resize-Handler.
    if (global.RezeptStufenliste && global.RezeptStufenliste.stufenlisteBauen) {
      ziel.appendChild(global.RezeptStufenliste.stufenlisteBauen(modell, portionen));
    }

    var anhang = anhangBauen(rezept);
    if (anhang) ziel.appendChild(anhang);

    ziel.appendChild(schritteBauen(rezept));
    var hinweise = hinweiseBauen(rezept);
    if (hinweise) ziel.appendChild(hinweise);
    var quelle = quelleBauen(rezept);
    if (quelle) ziel.appendChild(quelle);

    return modell;
  }

  global.RezeptRender = {
    rezeptRendern: rezeptRendern,
    uebersichtRendern: uebersichtRendern,
    einkaufRendern: einkaufRendern,
    tabelleBauen: tabelleBauen,
    abhakenVerdrahten: abhakenVerdrahten,
    mengenAktualisieren: mengenAktualisieren
  };
})(window);
