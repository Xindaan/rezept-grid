// render.js — Grid-Modell -> DOM. Kennt kein Rezept-Schema ausser ueber
// das Modell aus grid.js.

(function (global) {
  "use strict";

  var G = global.RezeptGrid;

  function el(tag, klasse, text) {
    var n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (text !== undefined && text !== null && text !== "") n.textContent = text;
    return n;
  }

  // Baut die Chu-Tabelle. Links zwei Spalten (Menge, Zutat), rechts eine
  // Spalte je Schritt mit rowspan ueber seinen Zeilenblock.
  function tabelleBauen(modell) {
    var tabelle = el("table", "grid");
    var koerper = el("tbody");

    modell.zeilen.forEach(function (zeile, r) {
      var tr = el("tr");
      var zutat = zeile.zutat;

      var mengeText = G.mengeFormatieren(zutat);
      var tdMenge = el("td", "menge" + (mengeText ? "" : " menge-leer"), mengeText);
      tr.appendChild(tdMenge);

      var tdZutat = el("td", "zutat");
      tdZutat.appendChild(el("span", "zutat-name", zutat.name));
      if (zutat.notiz) tdZutat.appendChild(el("span", "zutat-notiz", zutat.notiz));
      tr.appendChild(tdZutat);

      modell.spalten.forEach(function (spalte) {
        if (spalte.von === r) {
          tr.appendChild(schrittZelleBauen(spalte));
        } else if (r > spalte.von && r <= spalte.bis) {
          // von der rowspan-Zelle darueber abgedeckt — nichts einfuegen
        } else {
          tr.appendChild(el("td", "leer"));
        }
      });

      koerper.appendChild(tr);
    });

    tabelle.appendChild(koerper);
    return tabelle;
  }

  function schrittZelleBauen(spalte) {
    var schritt = spalte.schritt;
    var klassen = "schritt";
    if (spalte.neueZutaten === 0) klassen += " schritt-ohne-zutaten";
    if (schritt.unbeaufsichtigt) klassen += " schritt-unbeaufsichtigt";

    var td = el("td", klassen);
    td.rowSpan = spalte.hoehe;
    td.title = schritt.anweisung || "";
    td.appendChild(el("span", "schritt-titel", schritt.titel));

    var dauer = G.dauerFormatieren(schritt.dauer_s);
    if (dauer) td.appendChild(el("span", "schritt-dauer", dauer));
    if (schritt.temperatur_c) {
      td.appendChild(el("span", "schritt-temperatur", schritt.temperatur_c + " °C"));
    }
    return td;
  }

  function kopfBauen(rezept) {
    var kopf = el("header", "rezept-kopf");
    kopf.appendChild(el("h1", null, rezept.titel));
    if (rezept.untertitel) kopf.appendChild(el("p", "untertitel", rezept.untertitel));

    var meta = el("dl", "meta");
    function metaZeile(begriff, wert) {
      if (!wert) return;
      meta.appendChild(el("dt", null, begriff));
      meta.appendChild(el("dd", null, wert));
    }
    metaZeile("Ergibt", rezept.portionen + " " + (rezept.portionen_einheit || "Portionen"));
    metaZeile("Arbeitszeit", G.dauerFormatieren(rezept.zeit_aktiv_s));
    metaZeile("Gesamtzeit", G.dauerFormatieren(rezept.zeit_gesamt_s));
    metaZeile("Gefäß", rezept.gefaess);
    kopf.appendChild(meta);

    if (rezept.tags && rezept.tags.length) {
      var tags = el("ul", "tags");
      rezept.tags.forEach(function (t) { tags.appendChild(el("li", null, t)); });
      kopf.appendChild(tags);
    }
    return kopf;
  }

  function schritteBauen(rezept) {
    var box = el("section", "anweisungen");
    box.appendChild(el("h2", null, "Schritte im Wortlaut"));
    var liste = el("ol");
    rezept.schritte.forEach(function (s) {
      var li = el("li");
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
    if (q.hinweis) p.appendChild(el("span", "quelle-hinweis", q.hinweis));
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

  // Rendert ein Rezept vollstaendig in `ziel`.
  function rezeptRendern(rezept, ziel) {
    var modell = G.gridModellBauen(rezept);
    ziel.textContent = "";

    var problemBox = problemeBauen(modell.probleme);
    if (problemBox) ziel.appendChild(problemBox);

    ziel.appendChild(kopfBauen(rezept));

    var rahmen = el("div", "grid-rahmen");
    rahmen.appendChild(tabelleBauen(modell));
    ziel.appendChild(rahmen);

    ziel.appendChild(schritteBauen(rezept));
    var hinweise = hinweiseBauen(rezept);
    if (hinweise) ziel.appendChild(hinweise);
    var quelle = quelleBauen(rezept);
    if (quelle) ziel.appendChild(quelle);

    return modell;
  }

  global.RezeptRender = { rezeptRendern: rezeptRendern, tabelleBauen: tabelleBauen };
})(window);
