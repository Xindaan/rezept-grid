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

// Eigenschaften, die gelesen werden duerfen, ohne dass die Attrappe sie
// kennt. Jede steht hier mit Grund — die Liste ist die Liste der
// Annahmen, die diese Attrappe ueber ihre Umgebung macht.
// Knoten mit einer id, damit getElementById sie findet — auch wenn der
// Baum (wie in den Pruefungen) gar nicht am body haengt. Im Browser macht
// das der Dokumentbaum selbst.
var nachIdRegister = {};

var ERLAUBT_UNBEKANNT = {
  // JS- und Node-Interna: JSON.stringify fragt toJSON ab, die
  // Promise-Aufloesung fragt then, console.log/util.inspect fragt den
  // Rest. Alle duerfen undefined sein.
  toJSON: true, then: true, nodeType: true, length: true, name: true,
  // Kontrollkaestchen. passtEinzeln fragt `.checked` fuer den
  // :checked-Selektor ab, auch an Knoten, die nie eines waren.
  checked: true
};

function knotenBauen(tagName) {
  var klassen = {};
  var zuhoerer = {};
  var attribute = {};
  // Der Knoten wird als Proxy nach aussen gegeben (siehe unten). Die
  // Methoden unten muessen den Proxy weiterreichen, nicht das rohe
  // Objekt — sonst haengen Elternketten und Trefferlisten an Knoten
  // ohne Waechter. Die Variable wird nach dem Bau gesetzt; die
  // Funktionen laufen erst danach.
  var knoten;

  // `style` kann mehr als ein leeres Objekt: render.js setzt eigene
  // CSS-Variablen ueber setProperty (T-0055). Ohne die Methode wirft
  // breitenAnwenden — und weil es vorher schon an parentElement
  // aussteigt, ist das nie aufgefallen.
  var stil = {};
  Object.defineProperty(stil, "setProperty", {
    value: function (name, wert) { stil[name] = String(wert); },
    enumerable: false
  });
  Object.defineProperty(stil, "getPropertyValue", {
    value: function (name) { return stil[name] === undefined ? "" : stil[name]; },
    enumerable: false
  });

  var n = {
    tagName: String(tagName).toUpperCase(),
    elternteil: null,
    kindKnoten: [],
    style: stil,
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
      kind.elternteil = knoten;
      n.kindKnoten.push(kind);
      return kind;
    },
    insertBefore: function (kind, davor) {
      if (kind.elternteil) kind.elternteil.entfernen(kind);
      kind.elternteil = knoten;
      var i = davor ? n.kindKnoten.indexOf(davor) : -1;
      if (i === -1) n.kindKnoten.push(kind); else n.kindKnoten.splice(i, 0, kind);
      return kind;
    },
    entfernen: function (kind) {
      var i = n.kindKnoten.indexOf(kind);
      if (i > -1) { n.kindKnoten.splice(i, 1); kind.elternteil = null; }
    },
    remove: function () { if (n.elternteil) n.elternteil.entfernen(knoten); },

    // Rollt im Browser den Knoten ins Bild. Headless gibt es nichts zu
    // rollen; gemerkt wird nur, DASS es passiert ist.
    scrollIntoView: function (optionen) {
      n.wurdeAngesprungen = true;
      n.angesprungenMit = optionen || null;
    },
    wurdeAngesprungen: false,
    angesprungenMit: null,
    // Ohne Layout weiss die Attrappe nicht, was CSS ausblendet. Sichtbar
    // ist alles, solange eine Pruefung es nicht mit `unsichtbar = true`
    // ausdruecklich verbirgt — so laesst sich "Telefon" (Tabelle weg)
    // und "Tablet" (Stufenliste weg) nachstellen (T-0071).
    getClientRects: function () { return n.unsichtbar ? [] : [{}]; },
    unsichtbar: false,

    querySelectorAll: function (auswahl) { return suchen(knoten, auswahl); },
    querySelector: function (auswahl) { return suchen(knoten, auswahl)[0] || null; },
    // render.js sucht damit den Rezept-Container ueber der Zelle.
    closest: function (auswahl) {
      var k = knoten;
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

  // Der Browser-Name fuer den Elternknoten. render.js benutzt ihn in
  // breitenAnwenden als Waechter (`if (!rahmen) return;`) — und genau
  // dort ist die Funktion in JEDER Pruefung stumm ausgestiegen, weil die
  // Attrappe den Namen nicht kannte (T-0055). Kein Fehler, keine Meldung,
  // nur eine ungeprueft gebliebene Funktion.
  // `id` als echte Eigenschaft mit Nebenwirkung: render.js setzt sie am
  // Sprungziel (li.id = "anweisung-<schritt>"), und der Sprung sucht es
  // spaeter ueber getElementById. Ohne Register lieferte die Attrappe
  // dort einen frisch erfundenen Knoten, und die Hervorhebung landete im
  // Nichts — pruefbar war der Sprung damit nicht.
  var eigeneId = null;
  Object.defineProperty(n, "id", {
    get: function () { return eigeneId === null ? "" : eigeneId; },
    set: function (wert) {
      eigeneId = String(wert);
      nachIdRegister[eigeneId] = knoten;
    }
  });

  // Der Browser liefert hier Pixel. Gebraucht wird der Wert nur, um einen
  // Reflow zu erzwingen (render.js, `void ziel.offsetWidth`) — null ist
  // dafuer so gut wie jede andere Zahl.
  Object.defineProperty(n, "offsetWidth", { get: function () { return 0; } });

  Object.defineProperty(n, "parentElement", {
    get: function () { return n.elternteil; }
  });

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

  // Der Waechter (T-0055). Eine Attrappe, die auf alles Unbekannte
  // still `undefined` antwortet, macht genau die Fehler unsichtbar, fuer
  // die sie gebaut wurde: `tabelle.parentElement` gab undefined, die
  // Breitenrechnung stieg an ihrem eigenen Waechter aus, und 197
  // Pruefungen blieben gruen, waehrend die Funktion nie lief.
  //
  // Dieselbe Haltung wie beim Selektor-Parser weiter unten: lieber ein
  // lauter Abbruch als eine Antwort, die wie "kein Problem" aussieht.
  // Wer eine neue DOM-Eigenschaft braucht, baut sie hier ein oder traegt
  // sie in ERLAUBT_UNBEKANNT ein — und sieht dabei, was er voraussetzt.
  knoten = new Proxy(n, {
    get: function (ziel, schluessel) {
      if (typeof schluessel === "symbol") return Reflect.get(ziel, schluessel);
      if (Reflect.has(ziel, schluessel)) return Reflect.get(ziel, schluessel);
      if (ERLAUBT_UNBEKANNT[schluessel]) return undefined;
      throw new Error('dom-attrappe: <' + n.tagName.toLowerCase() +
        '> kennt die Eigenschaft "' + schluessel + '" nicht. Entweder in ' +
        'tools/dom-attrappe.js nachbauen oder, wenn undefined richtig ist, ' +
        'in ERLAUBT_UNBEKANNT eintragen.');
    }
  });
  return knoten;
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
    // Erst im Register der wirklich vergebenen ids nachsehen. Nur wenn
    // dort nichts steht, einen leeren Knoten erfinden — sonst wuerde ein
    // Sprung ins Leere wie ein gelungener aussehen.
    getElementById: function (id) {
      if (nachIdRegister[id]) return nachIdRegister[id];
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

// Eine Ablage nach Art von localStorage, im Speicher. Bewusst NICHT in
// anmelden() eingehaengt: die Pruefungen sollen sie dort einsetzen, wo
// sie geprueft wird, und sonst ohne Gedaechtnis laufen — sonst traegt ein
// Block den Zustand in den naechsten.
function speicherBauen() {
  var inhalt = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(inhalt, k) ? inhalt[k] : null; },
    setItem: function (k, v) { inhalt[k] = String(v); },
    removeItem: function (k) { delete inhalt[k]; },
    schluessel: function () { return Object.keys(inhalt); }
  };
}

module.exports = {
  knotenBauen: knotenBauen,
  textknotenBauen: textknotenBauen,
  speicherBauen: speicherBauen,
  anmelden: anmelden
};
