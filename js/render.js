// render.js — Grid-Modell -> DOM. Kennt kein Rezept-Schema ausser ueber
// das Modell aus grid.js.

(function (global) {
  "use strict";

  var G = global.RezeptGrid;
  var P = global.RezeptPortionen;
  var M = global.RezeptMerker;

  // Was das gerade gezeigte Rezept sichern soll (T-0064). Eine
  // Modulvariable, weil `abhakenVerdrahten` von zwei Erzeugern benutzt
  // wird — Tabelle und Stufenliste — und keiner von beiden das Rezept
  // kennt. Zulaessig ist das, weil pro Seite genau ein Rezept steht;
  // `rezeptRendern` setzt sie und die Uebersicht loescht sie wieder.
  var sichernNachHaken = null;

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
      // Trennzeichen als echter Text, dieselbe Begruendung wie in der
      // Stufenliste (T-0042): die Marke ist inline-block, ohne Leerzeichen
      // kopiert man "Salzfix". Die Notiz ist hier ein Block und braeuchte
      // es nicht — sie bekommt es trotzdem, damit beide Erzeuger dieselbe
      // Regel befolgen und der naechste Umbau sie nicht auseinanderlaufen
      // laesst. Vor einem Block faellt das Leerzeichen ohnehin weg.
      if (zeile.festeMenge) {
        tdZutat.appendChild(document.createTextNode(" "));
        tdZutat.appendChild(el("span", "marke-fix", "fix"));
      }
      if (zutat.notiz) {
        tdZutat.appendChild(document.createTextNode(" "));
        tdZutat.appendChild(el("span", "zutat-notiz", zutat.notiz));
      }
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

    // Jede Marke ist der START ihrer Spalte, linksbuendig genau dort, wo
    // die Spalte beginnt. Bis T-0052 trug nur die letzte eine Einheit und
    // las sich dadurch als Gesamtdauer — beim Eierkuchen stand "35 Min",
    // waehrend das Rezept 60 Minuten braucht.
    //
    // Die Einheit allein wegzulassen haette die Luege beseitigt, aber die
    // Frage offen gelassen, die der Leser stellt. Deshalb traegt die
    // letzte Zelle beides: links weiter ihren Start, rechts an der
    // Spaltenkante das Ende des Plans — dort, wo die Zeit wirklich
    // ausgeht, und passend zur Kennzahl "gesamt".
    // Dieselbe Rechnung wie im Kopf und in der Uebersicht — der dritte
    // und letzte Ort, an dem die Gesamtzeit vorkommt (T-0070). Die lokale
    // Kopie, die hier stand, hatte die gemeinsame Funktion sogar
    // ueberdeckt: `var planende` im Funktionsrumpf schattiert den Namen,
    // und wer den Helfer spaeter hier benutzen wollte, haette eine Zahl
    // statt einer Funktion vorgefunden.
    var planEndeS = planende(modell);

    var zeiten = spaltenZeiten(modell);
    zeiten.starts.forEach(function (sekunden, c) {
      var th = el("th", "zeitachse-marke");
      th.scope = "col";
      var start = Math.round(sekunden / 60);
      th.appendChild(el("span", "zeitachse-start", String(start)));
      // Vorgelesen, nicht gelesen — deshalb ausgeschriebene Einheit mit
      // richtigem Numerus ("ab 1 Minute", nicht "ab 1 Minuten").
      function minuten(n) { return n + (n === 1 ? " Minute" : " Minuten"); }
      var vorgelesen = "ab " + minuten(start);

      if (c === zeiten.starts.length - 1) {
        th.classList.add("zeitachse-marke-letzte");
        var ende = Math.round(planEndeS / 60);
        th.appendChild(el("span", "zeitachse-ende", ende + " Min"));
        vorgelesen += ", Planende " + minuten(ende);
      }

      // Der Zusatz fuer Hilfsmittel steht als `aria-label`, NICHT als
      // versteckter Text. Eine per .nur-vorlesen weggeklappte Spanne
      // waere hier falsch: sie wird beim Kopieren mitgenommen. Gemessen
      // am 23.08.2026 mit `Selection.toString()` auf dieser Zelle —
      // heraus kam "35\nPlanende60 Min", also genau die Klebestelle aus
      // T-0037/T-0042. Attribute landen dagegen nie in der Ablage.
      //
      // Alle Marken bekommen ihn, nicht nur die letzte: sonst spricht
      // eine Spaltenueberschrift anders als ihre Nachbarn, und die
      // blanken Zahlen haetten vorgelesen ueberhaupt keine Einheit.
      th.setAttribute("aria-label", vorgelesen);

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
    //
    // Gerechnet wird je STUFE, nicht je Spalte (T-0056). Teilen sich
    // zwei Stufen eine Spalte, spannt die laengere sie auf; die kuerzere
    // bekaeme sonst deren Zahlen angeheftet. Nenner bleibt die Summe der
    // Spaltenspannen — dieselbe Skala, auf der die Breiten stehen.
    var spannenSumme = dauern.reduce(function (a, d) { return a + (d || 0); }, 0);

    modell.spalten.forEach(function (spalte) {
      var c = spalte.spalte;
      var td = tabelle.querySelector('[data-schritt="' + spalte.schritt.id + '"]');
      if (!td) return;
      var alt = td.querySelector(".kuerzung");
      if (alt) alt.remove();

      var eigenAnteil = spannenSumme > 0
        ? (spalte.schritt.dauer_s || 0) / spannenSumme
        : 0;
      var breitenAnteil = mass.stufen[c];
      var gekuerzt = Z.istGekuerzt(eigenAnteil, breitenAnteil);

      td.classList.toggle("ist-gekuerzt", gekuerzt);
      if (gekuerzt) {
        var zeit = Math.round(eigenAnteil * 100);
        var breit = Math.round(breitenAnteil * 100);
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
    // Ein echter <button> loest bei Enter und Leertaste von selbst aus —
    // die eigene Tastaturbehandlung von T-0038 entfaellt damit (T-0060).
    td.addEventListener("click", springen);
  }

  // Die Zelle bleibt eine Zelle (T-0060).
  //
  // Bis dahin trug das <td> selbst `role="button"` und ein `aria-label`
  // aus Titel plus "Anweisung anzeigen". Zwei Verluste auf einmal:
  //
  //   * Ein aria-label ERSETZT den Namen des Elements. Dauer, Temperatur,
  //     "laeuft von allein" und "nebenher moeglich" standen zwar in der
  //     Zelle, wurden aber nicht mehr vorgelesen — genau die Angaben, um
  //     derentwillen die Marken ueberhaupt eingefuehrt wurden.
  //   * `role="button"` auf einem <td> nimmt der Zelle ihre Rolle im
  //     Tabellenraster. Die Tabelle ist die Kodierung des Rezepts; wer
  //     sie mit Hilfsmitteln Zelle fuer Zelle liest, verliert sie hier.
  //
  // Jetzt sitzt ein echter Knopf IN der Zelle. Er fuellt sie ganz aus
  // (stil.css), das Tippziel bleibt also gleich gross, und sein Name wird
  // aus denselben Teilen gebaut, die auch sichtbar dastehen — die
  // Aufzaehlung unten ist deshalb bewusst dieselbe Reihenfolge wie die
  // Anhaenge darunter.
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

    var dauer = G.dauerFormatieren(schritt.dauer_s);
    var teile = [schritt.titel];
    if (dauer) teile.push(dauer);
    if (schritt.temperatur_c) teile.push(schritt.temperatur_c + " °C");
    if (schritt.unbeaufsichtigt) teile.push("läuft von allein");
    if (parallel) teile.push("nebenher möglich");

    // Ohne Anweisung gibt es nichts anzuspringen — dann bleibt die Zelle
    // eine reine Zelle und bekommt keinen Knopf, den man ins Leere
    // druecken kann.
    var inhalt = td;
    if (schritt.anweisung) {
      inhalt = el("button", "schritt-knopf schritt-tippbar");
      inhalt.type = "button";
      inhalt.setAttribute("aria-label", teile.join(", ") + " — Anweisung anzeigen");
      anweisungSprungVerdrahten(inhalt, schritt.id);
      td.appendChild(inhalt);
    }

    inhalt.appendChild(el("span", "schritt-titel", schritt.titel));
    if (dauer) inhalt.appendChild(el("span", "schritt-dauer", dauer));
    if (schritt.temperatur_c) {
      inhalt.appendChild(el("span", "schritt-temperatur", schritt.temperatur_c + " °C"));
    }
    // Wartezeit wird nicht nur eingefaerbt, sondern benannt.
    if (schritt.unbeaufsichtigt) {
      inhalt.appendChild(el("span", "stufen-marke", "⧗ läuft von allein"));
    }
    // Und eine Stufe, die nebenher laeuft, sagt es auch — sonst liest man
    // die Tabelle als Reihenfolge, obwohl sie hier Gleichzeitigkeit meint.
    if (parallel) {
      inhalt.appendChild(el("span", "stufen-marke marke-parallel", "∥ nebenher möglich"));
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
  // und was das zusammen bedeutet.
  //
  // Alle drei kommen aus DEMSELBEN Plan wie die Zeitachse und das Grid
  // (T-0059). Vorher hatte der Kopf drei Quellen: "Arbeit" aus dem
  // JSON-Feld, "ohne Zutun" gerechnet, "gesamt" wieder aus dem JSON. Drei
  // Quellen fuer eine Sache koennen auseinanderlaufen, und sie taten es
  // auf zwei Wegen:
  //
  //   * Ein Schritt, den das Grid nicht darstellen kann — zutatenlos und
  //     ohne gueltige Vorstufe, etwa "Ofen vorheizen" als eigener Strang
  //     — faellt aus dem Modell (grid.js meldet ihn), zaehlte aber weiter
  //     in den Kennzahlen. Kopf und Achse sagten dann Verschiedenes.
  //   * Die Doku erlaubt zeit_gesamt_s zehn Prozent Puffer ueber dem
  //     Plan. Sobald ein Rezept den nutzt, widersprachen sich Kachel und
  //     Achse — und zwei Pruefungen schlugen an, obwohl die Datei der
  //     dokumentierten Regel folgte.
  //
  // Jetzt gilt: gesamt = Ende des Plans, Arbeit = Summe der
  // beaufsichtigten Stufen, ohne Zutun = die Differenz. Damit geht die
  // Rechnung im Kopf nicht mehr zufaellig auf, sondern zwangslaeufig, und
  // sie deckt sich mit dem Planende auf der Achse.
  //
  // Die Felder zeit_aktiv_s und zeit_gesamt_s bleiben im Schema: sie sind
  // die ANGABE des Autors, und pruefe-grid.js haelt sie gegen den Plan.
  // Genau so sind T-0046 und T-0053 gefunden worden.
  // Ende des Einpersonen-Plans aus einem gerechneten Modell (T-0070).
  //
  // Steht als eigene Funktion da, weil ZWEI Stellen die Gesamtzeit
  // zeigen: der Kennzahlenstreifen im Rezeptkopf und die Karte in der
  // Uebersicht. Die Karte las bis T-0070 stattdessen `zeit_gesamt_s`
  // aus der Datei — dieselbe Zahl, solange sie sich decken, und ein
  // Widerspruch, sobald ein Rezept den erlaubten 10-%-Puffer nutzt
  // (Karte "1 Std", Kopf "55 Min"). Genau die Fehlerklasse aus T-0053,
  // eine Ebene hoeher: zwei Quellen fuer eine Aussage.
  //
  // Jetzt ist es eine Rechnung an einer Stelle. Dass beide dasselbe
  // zeigen, ist damit keine Zusage mehr, die jemand einhalten muss,
  // sondern eine Eigenschaft des Codes.
  function planende(modell) {
    var ende = 0;
    modell.spalten.forEach(function (s) { if (s.ende > ende) ende = s.ende; });
    return ende;
  }

  function kennzahlenBauen(rezept, modell) {
    var Z = global.RezeptZeitmass;
    var dauern = modell.spalten.map(function (s) { return s.schritt.dauer_s; });
    var unbeauf = modell.spalten.map(function (s) { return !!s.schritt.unbeaufsichtigt; });

    var nachId = {};
    modell.spalten.forEach(function (s, i) { nachId[s.schritt.id] = i; });
    var vorstufen = modell.spalten.map(function (s) {
      return (s.vorstufen || []).map(function (v) { return nachId[v]; })
                                .filter(function (j) { return j !== undefined; });
    });

    var gesamt = planende(modell);

    // NICHT die Summe der unbeaufsichtigten Stufen: waehrend der Teig
    // ruht, mischt man die Fuellung — diese Zeit ist nicht frei. Frei
    // bleibt die Gesamtdauer minus der eigenen Arbeit.
    var arbeit = Z.arbeitszeit(dauern, unbeauf);
    var ohneZutun = Math.max(0, gesamt - arbeit);

    var streifen = el("div", "kennzahlen");
    [
      ["Arbeit", arbeit],
      ["ohne Zutun", ohneZutun],
      ["gesamt", gesamt]
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
        G.dauerFormatieren(gesamt) +
        ". Zu zweit wären es " + G.dauerFormatieren(Z.gesamtdauer(dauern, vorstufen)) +
        " — zwei Schritte fallen zusammen, die allein nacheinander gehen."));
    }
    return streifen;
  }

  function kopfBauen(rezept, modell, portionen, beiWechsel, beiKochstart) {
    var kopf = el("header", "rezept-kopf");
    kopf.appendChild(el("h1", null, rezept.titel));
    if (rezept.untertitel) kopf.appendChild(el("p", "untertitel", rezept.untertitel));

    // Ausstattung und Merkmale stehen seit T-0039.3 unter dem Grid,
    // siehe anhangBauen. Der Kopf traegt nur noch, was man braucht, um
    // das Grid zu lesen: Titel, Einordnung, Zeiten, Portionen, Start.

    kopf.appendChild(kennzahlenBauen(rezept, modell));

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
  // Abgehakt oder nicht ist ein ZUSTAND, kein Knopfdruck — deshalb
  // `checkbox` und `aria-checked` statt `button` und `aria-pressed`
  // (T-0060). Vorgelesen wird daraus "Kontrollkaestchen, nicht
  // angekreuzt", und das ist genau, was die Zeile tut.
  //
  // Die Rolle sitzt weiter auf der Zutatenzelle und nicht auf einem
  // eigenen Kaestchen: eine dritte Spalte kostet Breite, die im Zeitmass
  // fehlt (siehe unten). Dass die Zelle damit ihre Rasterrolle abgibt,
  // ist der bewusst gezahlte Preis — anders als bei der Stufenzelle gibt
  // es hier keine Angabe, die dabei verlorenginge.
  // Setzt den Haken-Zustand auf einer Menge von Zellen. `aria-checked`
  // geht mit, sonst stimmt die Anzeige fuer Hilfsmittel nicht mehr.
  function markieren(zellen, an) {
    Array.prototype.forEach.call(zellen, function (zelle) {
      zelle.classList.toggle("abgehakt", an);
      if (zelle.getAttribute("role") === "checkbox") {
        zelle.setAttribute("aria-checked", String(an));
      }
    });
  }

  // Abgehakt wird die ZEILE — sie steht seit T-0040 in zwei Ansichten.
  function zeileMarkieren(wurzel, r, an) {
    markieren(wurzel.querySelectorAll('[data-zeile="' + r + '"]'), an);
  }

  function abhakenVerdrahten(tdMenge, tdZutat) {
    tdZutat.setAttribute("role", "checkbox");
    tdZutat.tabIndex = 0;
    tdZutat.setAttribute("aria-checked", "false");

    // Abgehakt wird die ZEILE, nicht die Zelle: seit T-0040 zeigt dieselbe
    // Zutat in zwei Ansichten, und ein Haken, der nur in einer sitzt, ist
    // beim Drehen des Telefons wieder weg. Ohne data-zeile (Einkaufsliste)
    // bleibt es beim Paar.
    function umschalten() {
      var an = !tdZutat.classList.contains("abgehakt");
      var r = tdZutat.dataset ? tdZutat.dataset.zeile : undefined;
      var wurzel = tdZutat.closest(".rezept") || document;
      if (r === undefined) markieren([tdMenge, tdZutat], an);
      else zeileMarkieren(wurzel, r, an);
      if (sichernNachHaken) sichernNachHaken();
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

    // `klasse` unterscheidet die beiden Kopplungen: `gekoppelt` haengt am
    // Mauszeiger und verschwindet mit ihm, `gekoppelt-fest` bleibt stehen,
    // bis man sie wieder loest (T-0066).
    function umschalten(spalte, an, klasse) {
      if (!spalte) return;
      var k = klasse || "gekoppelt";
      var td = ziel.querySelector('[data-schritt="' + spalte.schritt.id + '"]');
      if (td) td.classList.toggle(k, an);
      (spalte.eigeneZeilen || []).forEach(function (r) {
        Array.prototype.forEach.call(
          ziel.querySelectorAll('[data-zeile="' + r + '"]'),
          function (zelle) { zelle.classList.toggle(k, an); }
        );
      });
    }

    // Im Kochmodus fuehrt die Stufennavigation, nicht der Mauszeiger.
    function erlaubt() { return !document.body.classList.contains("kochmodus"); }

    // --- Festgesetzte Kopplung (T-0066) -------------------------------
    //
    // Auf einem Tablet gibt es kein Ueberfahren: die Tabelle steht dort
    // (ab 600 px zeigt stil.css sie statt der Stufenliste), aber die
    // Kopplung war nicht erreichbar — `@media (hover: none)` schaltete
    // sie sogar sichtbar ab. Damit fehlte auf genau dem Geraet, auf dem
    // man ein Rezept aufschlaegt und liest, die Antwort auf "welche
    // Zutaten gehoeren zu dieser Stufe".
    //
    // Die Design-Uebergabe sah dafuer einen Klick vor. Gebaut ist er
    // jetzt — aber OHNE eine neue Geste zu erfinden: der Tipp auf die
    // Stufenzelle springt seit T-0038 zum Wortlaut, und dieselbe
    // Bewegung heisst jetzt zusaetzlich "das ist die Stufe, die mich
    // interessiert". Eine Geste, zwei Wirkungen, beide sagen dasselbe.
    //
    // Abweichung von der Uebergabe: dort loeste "Tippen daneben". Das
    // hiesse ein Zuhoerer auf dem ganzen Dokument, der bei jedem Abhaken
    // mitfeuert. Stattdessen loest der zweite Tipp auf dieselbe Stufe,
    // und eine andere Stufe uebernimmt die Marke.
    var fest = null;

    function loesen() {
      if (fest) { umschalten(fest, false, "gekoppelt-fest"); fest = null; }
    }

    function festsetzen(spalte) {
      if (!erlaubt()) return;
      var war = fest;
      loesen();
      if (war === spalte) return;   // zweiter Tipp auf dieselbe Stufe
      fest = spalte;
      umschalten(fest, true, "gekoppelt-fest");
    }

    function koppeln(element, spalte) {
      if (!element || !spalte) return;
      element.addEventListener("mouseenter", function () {
        if (erlaubt()) umschalten(spalte, true);
      });
      element.addEventListener("mouseleave", function () { umschalten(spalte, false); });
    }

    modell.spalten.forEach(function (spalte) {
      var td = ziel.querySelector('[data-schritt="' + spalte.schritt.id + '"]');
      koppeln(td, spalte);
      // Der Knopf traegt den Tipp, wenn es einen gibt; sonst die Zelle.
      var ziehl = td && (td.querySelector(".schritt-knopf") || td);
      if (ziehl) {
        ziehl.addEventListener("click", function () { festsetzen(spalte); });
      }
    });

    modell.zeilen.forEach(function (_, r) {
      var spalte = schrittVonZeile.get(r);
      Array.prototype.forEach.call(
        ziel.querySelectorAll('[data-zeile="' + r + '"]'),
        function (zelle) { koppeln(zelle, spalte); }
      );
    });

    return { loesen: loesen, festgesetzt: function () { return fest; } };
  }

  // Baut einen Posten-Eintrag. Alles, was der Schluessel festlegt (Name,
  // Einheit, fix/mengenlos), steht damit fest — beim Portionswechsel
  // aendert sich nur die Menge.
  function postenBauen(p) {
    var eintrag = el("li", "einkauf-posten");
    eintrag.dataset.schluessel = p.schluessel;
    eintrag.setAttribute("role", "button");
    eintrag.tabIndex = 0;
    eintrag.setAttribute("aria-pressed", "false");

    eintrag.appendChild(el("span", "posten-menge"));

    var text = el("span", "posten-text");
    text.appendChild(el("span", "posten-name", p.name));
    if (p.fix) text.appendChild(el("span", "marke-fix", "fix"));
    text.appendChild(el("span", "posten-quellen", p.quellen.join(" · ")));
    eintrag.appendChild(text);

    function umschalten() {
      var an = !eintrag.classList.contains("abgehakt");
      eintrag.classList.toggle("abgehakt", an);
      eintrag.setAttribute("aria-pressed", String(an));
      if (eintrag.parentElement) einkaufSichern(eintrag.parentElement);
    }
    eintrag.addEventListener("click", umschalten);
    eintrag.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); umschalten(); }
    });

    return eintrag;
  }

  // Die Einkaufsliste merkt sich ihre Haken (T-0064) — im Laden legt man
  // das Telefon weg, und die Liste ueberlebt das Sperren des Schirms
  // nicht von selbst. Der Schluessel des Postens ist dabei dieselbe
  // Identitaet, die schon der Portionswechsel benutzt (T-0044).
  function einkaufSichern(liste) {
    if (!M) return;
    var haken = [];
    Array.prototype.forEach.call(liste.children, function (li) {
      if (li.classList.contains("abgehakt")) haken.push(li.dataset.schluessel);
    });
    M.schreiben("einkauf", { abgehakt: haken });
  }

  function mengeSchreiben(eintrag, p) {
    var menge = p.mengenlos ? "" : P.mengeFormatieren({
      menge: p.menge, menge_bis: p.menge_bis, einheit: p.einheit
    }, 1);
    var zelle = eintrag.querySelector(".posten-menge");
    zelle.textContent = menge;
    zelle.className = "posten-menge" + (menge ? "" : " menge-leer");
  }

  // Schreibt die Posten in `liste`, ohne bestehende Knoten wegzuwerfen
  // (T-0044).
  //
  // Der Abhak-Zustand lebt ausschliesslich in der Klasse `abgehakt` am
  // Listeneintrag — es gibt kein Modell daneben. Bis T-0044 rief der
  // Portionswechsel `einkaufRendern` komplett neu auf, und das beginnt
  // mit `ziel.textContent = ""`: mit den Knoten waren alle Haken weg,
  // dazu Scrollposition und Fokus. Gemessen: drei Haken vor dem Klick,
  // null danach.
  //
  // Deshalb wird abgeglichen statt neu gebaut. Der Schluessel aus
  // einkauf.js (Name, Einheit, fix/mengenlos) ist die Identitaet des
  // Postens; wer ihn behaelt, behaelt seinen Knoten und damit seinen
  // Haken. Nur die Menge wird nachgeschrieben.
  function postenSchreiben(liste, posten) {
    var alt = {};
    Array.prototype.forEach.call(liste.children, function (li) {
      alt[li.dataset.schluessel] = li;
    });

    // Nur fuer NEU gebaute Posten: wer schon dasteht, traegt seinen
    // Haken bereits, und der gilt vor dem, was gespeichert war.
    var gemerkt = {};
    var stand = M ? M.lesen("einkauf") : null;
    if (stand && stand.abgehakt) {
      stand.abgehakt.forEach(function (k) { gemerkt[k] = true; });
    }

    posten.forEach(function (p, i) {
      var eintrag = alt[p.schluessel];
      if (eintrag) delete alt[p.schluessel];
      else {
        eintrag = postenBauen(p);
        if (gemerkt[p.schluessel]) {
          eintrag.classList.add("abgehakt");
          eintrag.setAttribute("aria-pressed", "true");
        }
      }
      mengeSchreiben(eintrag, p);
      // Steht er schon an der richtigen Stelle, passiert nichts; sonst
      // wandert er dorthin. Was uebrig bleibt, ist weggefallen.
      if (liste.children[i] !== eintrag) {
        liste.insertBefore(eintrag, liste.children[i] || null);
      }
    });

    Object.keys(alt).forEach(function (k) { alt[k].remove(); });
  }

  // Hinweis auf Rezepte, die nur noch aus dem Manifest kommen konnten
  // (T-0061). Ueber http ist das ein Fehler, kein Ladeweg: die Datei
  // liess sich nicht holen, gezeigt wird die von Hand erzeugte Kopie —
  // sie kann alte Mengen tragen. Genau diese Sorte Fehler sieht sonst wie
  // ein Erfolg aus.
  function veraltetHinweisBauen(ids) {
    if (!ids || !ids.length) return null;
    var box = el("section", "probleme");
    box.appendChild(el("h2", null, ids.length === 1
      ? "Ein Rezept konnte nicht frisch geladen werden"
      : ids.length + " Rezepte konnten nicht frisch geladen werden"));
    box.appendChild(el("p", null,
      "Gezeigt wird die Fassung aus rezepte/manifest.js — sie kann veraltet " +
      "sein: " + ids.join(", ") + ". Neu erzeugen mit: node tools/build-manifest.js"));
    return box;
  }

  // Einkaufsliste (T-0026). `auswahl` ist [{rezept, portionen}].
  // `ausManifest` sind die ids, die nur aus dem Manifest kamen (T-0061).
  function einkaufRendern(auswahl, ziel, ausManifest) {
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

    var veraltet = veraltetHinweisBauen(ausManifest);
    if (veraltet) ziel.appendChild(veraltet);

    if (!auswahl.length) {
      var leer = el("section", "probleme");
      leer.appendChild(el("h2", null, "Kein Rezept gewählt"));
      leer.appendChild(el("p", null,
        "In der Übersicht auswählen, welche Rezepte auf die Liste sollen."));
      ziel.appendChild(leer);
      return;
    }

    // Steht vor der Portionswahl, weil deren Callback sie fortschreibt
    // statt die Seite neu zu zeichnen (T-0044).
    var liste = el("ul", "einkauf-liste");

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
        // Erst die sichtbare Liste, dann die URL (T-0057). Die Reihenfolge
        // ist kein Geschmack: `replaceState` ist der Teil, der scheitern
        // kann — ueber file:// wirft es in manchen Browsern. Stand es
        // davor, blieb bei einem Wurf die Portionsumschaltung wirkungslos,
        // und der einzige Hinweis war ein Fehler in der Konsole.
        // Nur die Mengen fortschreiben — Haken, Scrollposition und Fokus
        // bleiben, wo sie sind.
        postenSchreiben(liste, E.listeBauen(auswahl));
        // Die Auswahl steht in der URL, damit die Liste teilbar bleibt
        // und ein Neuladen sie nicht verliert.
        var text = E.auswahlSchreiben(auswahl.map(function (a) {
          return { id: a.rezept.id, portionen: a.portionen };
        }));
        global.history.replaceState(null, "", "index.html?einkauf=" + text);
      }));
      quellen.appendChild(zeile);
    });
    ziel.appendChild(quellen);

    postenSchreiben(liste, E.listeBauen(auswahl));
    ziel.appendChild(liste);

    var hinweis = el("p", "einkauf-hinweis",
      "Gleicher Name und gleiche Einheit werden addiert. Feste Mengen (fix) " +
      "wachsen nicht mit der Portionszahl und werden nicht summiert — dort " +
      "steht der größte Bedarf.");
    ziel.appendChild(hinweis);
  }

  // Rezept-Uebersicht (T-0006). WELCHE Rezepte es gibt, sagt das Manifest
  // — ohne Server gibt es kein Verzeichnis-Listing. Was in ihnen steht,
  // holt app.js ueber http frisch aus den JSON-Dateien (T-0061);
  // `ausManifest` nennt die, bei denen das nicht ging.
  function uebersichtRendern(rezepte, ziel, ausManifest) {
    ziel.textContent = "";
    // Die Uebersicht zeigt kein Rezept — was das letzte gesichert hat,
    // geht sie nichts an.
    sichernNachHaken = null;

    // Angekreuztes ueberlebt den Weg zur Einkaufsliste und zurueck
    // (T-0064). Ohne das faengt man nach jedem Zurueck von vorn an.
    var gemerkteAuswahl = {};
    var standAuswahl = M ? M.lesen("auswahl") : null;
    if (standAuswahl && standAuswahl.ids) {
      standAuswahl.ids.forEach(function (id) { gemerkteAuswahl[id] = true; });
    }

    var kopf = el("header", "rezept-kopf");
    kopf.appendChild(el("h1", null, "Rezepte"));
    kopf.appendChild(el("p", "untertitel",
      rezepte.length === 1 ? "Ein Rezept" : rezepte.length + " Rezepte"));
    ziel.appendChild(kopf);

    var veraltet = veraltetHinweisBauen(ausManifest);
    if (veraltet) ziel.appendChild(veraltet);

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
      // Dieselbe Rechnung wie im Rezeptkopf, nicht das JSON-Feld daneben
      // (T-0070). Fuenf Modelle je Uebersicht sind reine Rechnung ohne
      // DOM — bei den Groessenordnungen hier nicht messbar.
      var ende = planende(G.gridModellBauen(r));
      if (ende) fakten.push(G.dauerFormatieren(ende));
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
      if (gemerkteAuswahl[r.id]) kasten.checked = true;
      kasten.addEventListener("change", function () { auswahlAktualisieren(true); });
      wahl.appendChild(kasten);
      wahl.appendChild(el("span", null, "Für die Einkaufsliste"));
      eintrag.appendChild(wahl);

      liste.appendChild(eintrag);
    });
    ziel.appendChild(liste);

    // Leiste, die erst erscheint, wenn etwas gewaehlt ist.
    var leiste = el("div", "einkauf-leiste");
    leiste.hidden = true;
    // Isomorphie zu T-0051: hier aendert sich ebenfalls nur Text, und die
    // ganze Leiste taucht auf. Das Kontrollkaestchen meldet seinen eigenen
    // Zustand, aber nicht, dass daraufhin ein Weg zur Einkaufsliste
    // entstanden ist. Die Zahl ist die kuerzeste Ansage, die das sagt.
    var zaehler = el("span", "einkauf-zaehler");
    zaehler.setAttribute("aria-live", "polite");
    var knopf = el("a", "koch-start", "Einkaufsliste öffnen");
    leiste.appendChild(zaehler);
    leiste.appendChild(knopf);
    ziel.appendChild(leiste);

    // `sichern` ist beim ersten Lauf falsch: der stellt nur her, was
    // ohnehin in der Ablage steht. Ohne die Unterscheidung schriebe jeder
    // Aufruf der Uebersicht eine leere Auswahl — und ueberschriebe damit
    // die, die man gerade wiederherstellen wollte.
    function auswahlAktualisieren(sichern) {
      var gewaehlt = [].slice.call(ziel.querySelectorAll(".karte-wahl input:checked"))
                       .map(function (k) { return k.value; });
      leiste.hidden = gewaehlt.length === 0;
      zaehler.textContent = gewaehlt.length === 1
        ? "1 Rezept gewählt"
        : gewaehlt.length + " Rezepte gewählt";
      knopf.href = "index.html?einkauf=" + gewaehlt.join(",");
      if (M && sichern) M.schreiben("auswahl", { ids: gewaehlt });
    }

    // Einmal von Hand, damit eine wiederhergestellte Auswahl auch die
    // Leiste zeigt — sonst stehen Haken da, aber kein Weg zur Liste.
    auswahlAktualisieren(false);
  }

  // Rendert ein Rezept vollstaendig in `ziel`.
  function rezeptRendern(rezept, ziel) {
    var modell = G.gridModellBauen(rezept);

    // Portionszahl und Haken aus der letzten Sitzung (T-0064). Die
    // gespeicherte Zahl wird geprueft, bevor sie gilt: sie steht in einer
    // Ablage, die auch von Hand oder von einer aelteren Fassung des
    // Rezepts beschrieben sein kann. Was nicht mehr zur Auswahl steht,
    // wird verworfen — sonst zeigt der Kopf eine Zahl, die kein Knopf
    // traegt, und keiner ist aktiv.
    var gemerkt = M ? M.lesen("rezept:" + rezept.id) : null;
    var portionen = rezept.portionen;
    if (gemerkt && P.portionsOptionen(rezept.portionen).indexOf(gemerkt.portionen) > -1) {
      portionen = gemerkt.portionen;
    }
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
    var kopplung = null;
    var beiKochstart = global.RezeptKochmodus ? function () {
      // Im Kochmodus fuehrt die Stufennavigation. Eine festgesetzte
      // Kopplung von vorher wuerde daneben eine zweite Stufe markieren.
      if (kopplung) kopplung.loesen();
      if (!kochmodus) kochmodus = global.RezeptKochmodus.kochmodusBauen(modell, ziel);
      if (kochmodus) kochmodus.starten();
    } : null;
    modell.kochmodus = function () { return kochmodus; };

    // Sichern, was sich am Rezept aendern kann. Die Funktion liest den
    // Zustand aus dem DOM statt ihn nebenher mitzufuehren — ein zweites
    // Modell neben den Klassen waere genau die Doppelquelle, die T-0044
    // schon einmal Haken gekostet hat.
    function sichern() {
      if (!M) return;
      var haken = [];
      modell.zeilen.forEach(function (zeile, r) {
        var zelle = ziel.querySelector('.zutat[data-zeile="' + r + '"]');
        if (zelle && zelle.classList.contains("abgehakt")) haken.push(zeile.zutat.id);
      });
      M.schreiben("rezept:" + rezept.id, { portionen: portionen, abgehakt: haken });
    }
    sichernNachHaken = sichern;

    ziel.appendChild(kopfBauen(rezept, modell, portionen, function (neu) {
      portionen = neu;
      mengenAktualisieren(ziel, modell, portionen);
      sichern();
    }, beiKochstart));

    var rahmen = el("div", "grid-rahmen");
    var tabelle = tabelleBauen(modell, portionen);
    rahmen.appendChild(tabelle);
    ziel.appendChild(rahmen);
    kopplung = kopplungVerdrahten(modell, ziel);
    modell.kopplung = function () { return kopplung; };

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

    // Erst jetzt die Haken setzen: beide Ansichten muessen stehen, sonst
    // bekommt nur eine von beiden sie (T-0040).
    if (gemerkt && gemerkt.abgehakt && gemerkt.abgehakt.length) {
      var zeileVonZutat = {};
      modell.zeilen.forEach(function (zeile, r) { zeileVonZutat[zeile.zutat.id] = r; });
      gemerkt.abgehakt.forEach(function (zid) {
        var r = zeileVonZutat[zid];
        if (r !== undefined) zeileMarkieren(ziel, r, true);
      });
    }

    // Lief beim letzten Mal der Kochmodus, geht es dort weiter (T-0072):
    // Stufe und Uhren stehen im Merker, und das Telefon laedt beim
    // Entsperren gern neu. Beenden loescht den Eintrag.
    if (M && beiKochstart && M.lesen("koch:" + rezept.id)) beiKochstart();

    return modell;
  }

  global.RezeptRender = {
    rezeptRendern: rezeptRendern,
    uebersichtRendern: uebersichtRendern,
    einkaufRendern: einkaufRendern,
    postenSchreiben: postenSchreiben,
    tabelleBauen: tabelleBauen,
    abhakenVerdrahten: abhakenVerdrahten,
    mengenAktualisieren: mengenAktualisieren
  };
})(window);
