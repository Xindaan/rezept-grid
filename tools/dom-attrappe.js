// dom-attrappe.js — so viel DOM, wie die Pruefungen brauchen, und keins mehr.
//
// Warum das hier steht (T-0044): `js/render.js` ist die DOM-Schicht, und
// bis hierher gab es dafuer keine Pruefung — geprueft wurde nur die
// DOM-freie Rechnung darunter. Das hat einen Fehler durchgelassen, den man
// nur am Verhalten sieht: die Einkaufsliste warf beim Portionswechsel alle
// Haken weg, weil sie sich komplett neu zeichnete. Kein Test auf Zahlen
// haette das gefunden, weil die Zahlen stimmten.
//
// Bewusst KEIN jsdom: das Projekt hat kein Build-Tooling und keine
// Abhaengigkeiten (siehe CLAUDE.md, Architektur-Eckpfeiler 1). Diese
// Attrappe kann nur, was die Pruefungen anfassen — wer mehr braucht,
// erweitert sie hier und sieht dabei, was er voraussetzt.

"use strict";

function knotenBauen(tagName) {
  var klassen = {};
  var zuhoerer = {};
  var attribute = {};

  var n = {
    tagName: String(tagName).toUpperCase(),
    elternteil: null,
    kindKnoten: [],
    style: {},
    hidden: false,
    disabled: false,
    tabIndex: 0,

    classList: {
      add: function () {
        for (var i = 0; i < arguments.length; i++) klassen[arguments[i]] = true;
      },
      remove: function () {
        for (var i = 0; i < arguments.length; i++) delete klassen[arguments[i]];
      },
      toggle: function (k, an) {
        var soll = an === undefined ? !klassen[k] : !!an;
        if (soll) klassen[k] = true; else delete klassen[k];
        return soll;
      },
      contains: function (k) { return !!klassen[k]; }
    },

    setAttribute: function (name, wert) { attribute[name] = String(wert); },
    getAttribute: function (name) {
      return attribute[name] === undefined ? null : attribute[name];
    },

    addEventListener: function (art, fn) {
      (zuhoerer[art] = zuhoerer[art] || []).push(fn);
    },
    // Kein echtes Bubbling — die Pruefungen loesen direkt am Knoten aus.
    ausloesen: function (art, ereignis) {
      (zuhoerer[art] || []).forEach(function (fn) {
        fn(ereignis || { preventDefault: function () {} });
      });
    },

    appendChild: function (kind) {
      if (kind.elternteil) kind.elternteil.entfernen(kind);
      kind.elternteil = n;
      n.kindKnoten.push(kind);
      return kind;
    },
    insertBefore: function (kind, davor) {
      if (kind.elternteil) kind.elternteil.entfernen(kind);
      kind.elternteil = n;
      var i = davor ? n.kindKnoten.indexOf(davor) : -1;
      if (i === -1) n.kindKnoten.push(kind); else n.kindKnoten.splice(i, 0, kind);
      return kind;
    },
    entfernen: function (kind) {
      var i = n.kindKnoten.indexOf(kind);
      if (i > -1) { n.kindKnoten.splice(i, 1); kind.elternteil = null; }
    },
    remove: function () { if (n.elternteil) n.elternteil.entfernen(n); },

    querySelectorAll: function (auswahl) { return suchen(n, auswahl); },
    querySelector: function (auswahl) { return suchen(n, auswahl)[0] || null; },
    // render.js sucht damit den Rezept-Container ueber der Zelle.
    closest: function (auswahl) {
      var k = n;
      while (k) {
        if (k.tagName !== "#TEXT" && passt(k, auswahl)) return k;
        k = k.elternteil;
      }
      return null;
    }
  };

  // `dataset` und die `data-*`-Attribute sind im Browser DIESELBE Sache:
  // `el.dataset.zeile = 3` macht `[data-zeile="3"]` auffindbar. Genau das
  // nutzt render.js beim Abhaken — eine Attrappe mit losem Objekt daneben
  // wuerde dort gruen zeigen, wo der Browser nichts findet.
  var dataset = new Proxy({}, {
    get: function (_, schluessel) { return attribute["data-" + String(schluessel)]; },
    set: function (_, schluessel, wert) {
      attribute["data-" + String(schluessel)] = String(wert);
      return true;
    },
    has: function (_, schluessel) {
      return ("data-" + String(schluessel)) in attribute;
    }
  });
  Object.defineProperty(n, "dataset", { get: function () { return dataset; } });

  Object.defineProperty(n, "className", {
    get: function () { return Object.keys(klassen).join(" "); },
    set: function (wert) {
      klassen = {};
      String(wert).split(/\s+/).forEach(function (k) { if (k) klassen[k] = true; });
    }
  });

  // stufenliste.js fragt `childNodes.length`, um leere Marken-Container
  // wegzulassen — dort zaehlen Textknoten mit.
  Object.defineProperty(n, "childNodes", {
    get: function () { return n.kindKnoten; }
  });

  // `children` sind nur Elemente, `textContent = ""` leert den Knoten —
  // beides nutzt render.js.
  Object.defineProperty(n, "children", {
    get: function () {
      return n.kindKnoten.filter(function (k) { return k.tagName !== "#TEXT"; });
    }
  });

  Object.defineProperty(n, "textContent", {
    get: function () {
      if (n.tagName === "#TEXT") return n.text;
      return n.kindKnoten.map(function (k) { return k.textContent; }).join("");
    },
    set: function (wert) {
      n.kindKnoten.forEach(function (k) { k.elternteil = null; });
      n.kindKnoten = [];
      if (wert !== "" && wert !== null && wert !== undefined) {
        n.appendChild(textknotenBauen(wert));
      }
    }
  });

  return n;
}

function textknotenBauen(text) {
  var t = knotenBauen("#text");
  t.tagName = "#TEXT";
  t.text = String(text);
  return t;
}

// Deckt genau die Selektoren ab, die js/*.js wirklich benutzt:
//
//   ".koch-neu, .koch-im-topf, ..."       Komma-Liste
//   ".menge[data-zutat=\"z-mehl\"]"        Klasse UND Attribut am selben Knoten
//   "[data-zeile=\"3\"]"                   nur Attribut
//   "colgroup col"                        Nachfahre
//   ".karte-wahl input:checked"           Nachfahre mit Pseudoklasse
//
// Absichtlich keine allgemeine CSS-Engine. Bei einem Selektor, den sie
// nicht versteht, wirft sie — lieber ein lauter Abbruch als eine leere
// Trefferliste, die wie "kein Problem" aussieht. Genau daran waere ich
// bei T-0044 fast haengengeblieben: `.menge[data-zutat="..."]` lieferte
// still nichts, und die Mengen sahen deshalb aus, als wuerden sie nicht
// fortgeschrieben.
function passtEinzeln(knoten, teil) {
  var rest = teil;

  var attrRe = /\[([^=\]]+)="([^"]*)"\]/g, m;
  while ((m = attrRe.exec(teil)) !== null) {
    if (knoten.getAttribute(m[1]) !== m[2]) return false;
  }
  rest = rest.replace(/\[[^\]]*\]/g, "");

  // :checked ist der einzige Pseudo-Zustand im Projekt.
  if (rest.indexOf(":checked") > -1) {
    if (!knoten.checked) return false;
    rest = rest.replace(":checked", "");
  }
  if (rest.indexOf(":") > -1) {
    throw new Error("dom-attrappe: Selektor nicht unterstuetzt: " + teil);
  }

  var teile = rest.split(".");
  var tag = teile.shift();
  if (tag && knoten.tagName !== tag.toUpperCase()) return false;
  return teile.every(function (k) { return !k || knoten.classList.contains(k); });
}

// Ein Selektor mit Leerzeichen ist ein Nachfahren-Selektor: der letzte
// Teil muss auf den Knoten passen, die davor auf Vorfahren in derselben
// Reihenfolge.
function passt(knoten, auswahl) {
  var teile = auswahl.trim().split(/\s+/);
  if (!passtEinzeln(knoten, teile.pop())) return false;
  var k = knoten.elternteil;
  while (teile.length) {
    var gesucht = teile.pop();
    while (k && !passtEinzeln(k, gesucht)) k = k.elternteil;
    if (!k) return false;
    k = k.elternteil;
  }
  return true;
}

function suchen(wurzel, auswahl) {
  var gruppen = String(auswahl).split(",").map(function (a) { return a.trim(); })
    .filter(Boolean);
  var treffer = [];
  (function lauf(k) {
    k.kindKnoten.forEach(function (kind) {
      if (kind.tagName !== "#TEXT" && gruppen.some(function (g) { return passt(kind, g); })) {
        treffer.push(kind);
      }
      lauf(kind);
    });
  })(wurzel);
  return treffer;
}

// Setzt document/window global, wie es die Browser-Module erwarten.
function anmelden(ziel) {
  var g = ziel || globalThis;
  var body = knotenBauen("body");
  var nachId = {};
  g.document = {
    createElement: knotenBauen,
    createTextNode: textknotenBauen,
    body: body,
    // app.js startet selbst, sobald das Dokument steht. "loading" haelt
    // es an, damit das Laden im Test gesteuert werden kann.
    readyState: "loading",
    title: "",
    getElementById: function (id) {
      if (!nachId[id]) { nachId[id] = knotenBauen("div"); nachId[id].id = id; }
      return nachId[id];
    },
    addEventListener: function () {},
    removeEventListener: function () {},
    querySelectorAll: function (a) { return suchen(body, a); }
  };
  g.window = g;
  g.history = { replaceState: function () {} };
  g.location = { protocol: "http:", search: "" };
  return g.document;
}

module.exports = {
  knotenBauen: knotenBauen,
  textknotenBauen: textknotenBauen,
  anmelden: anmelden
};
