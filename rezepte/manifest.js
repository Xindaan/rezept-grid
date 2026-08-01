// GENERIERT von tools/build-manifest.js — nicht von Hand bearbeiten.
// Quelle der Wahrheit sind die .json-Dateien in diesem Ordner.
window.REZEPTE = window.REZEPTE || {};

window.REZEPTE["eierkuchen"] = {
  "schema": 1,
  "id": "eierkuchen",
  "titel": "Eierkuchen",
  "untertitel": "Grundteig 250 / 500 / 4 — Mehl, Milch, Eier",
  "portionen": 4,
  "portionen_einheit": "Portionen",
  "zeit_aktiv_s": 1800,
  "zeit_gesamt_s": 3600,
  "gefaess": "Rührschüssel, beschichtete Pfanne 24 cm",
  "tags": [
    "grundrezept",
    "süß",
    "schnell",
    "kinder"
  ],
  "quelle": null,
  "zutaten": [
    {
      "id": "z-mehl",
      "name": "Weizenmehl",
      "menge": 250,
      "einheit": "g",
      "notiz": "Type 405"
    },
    {
      "id": "z-zucker",
      "name": "Zucker",
      "menge": 1,
      "einheit": "EL",
      "notiz": null
    },
    {
      "id": "z-salz",
      "name": "Salz",
      "menge": 1,
      "einheit": "Prise",
      "notiz": null,
      "skalieren": false
    },
    {
      "id": "z-milch-1",
      "name": "Milch",
      "menge": 250,
      "einheit": "ml",
      "notiz": "die Hälfte, zimmerwarm"
    },
    {
      "id": "z-eier",
      "name": "Eier",
      "menge": 4,
      "einheit": null,
      "notiz": "Größe M"
    },
    {
      "id": "z-milch-2",
      "name": "Milch",
      "menge": 250,
      "einheit": "ml",
      "notiz": "restliche Hälfte"
    },
    {
      "id": "z-butterschmalz",
      "name": "Butterschmalz",
      "menge": null,
      "einheit": null,
      "notiz": "zum Ausbacken"
    }
  ],
  "schritte": [
    {
      "id": "s-mischen",
      "titel": "trocken mischen",
      "anweisung": "Mehl, Zucker und Salz in der Schüssel verrühren.",
      "dauer_s": 30,
      "zutaten": [
        "z-mehl",
        "z-zucker",
        "z-salz"
      ],
      "vorstufen": []
    },
    {
      "id": "s-anruehren",
      "titel": "glatt rühren",
      "anweisung": "Die halbe Milch zugießen und zu einem dicken, klumpenfreien Teig rühren. Ein zäher Teig lässt sich glatt rühren, ein dünner nicht — deshalb erst die Hälfte.",
      "dauer_s": 120,
      "zutaten": [
        "z-milch-1"
      ],
      "vorstufen": [
        "s-mischen"
      ]
    },
    {
      "id": "s-eier",
      "titel": "Eier unterrühren",
      "anweisung": "Eier einzeln unterrühren, bis der Teig wieder glatt ist.",
      "dauer_s": 60,
      "zutaten": [
        "z-eier"
      ],
      "vorstufen": [
        "s-anruehren"
      ]
    },
    {
      "id": "s-verduennen",
      "titel": "verdünnen",
      "anweisung": "Restliche Milch einrühren, bis der Teig dickflüssig vom Löffel läuft.",
      "dauer_s": 60,
      "zutaten": [
        "z-milch-2"
      ],
      "vorstufen": [
        "s-eier"
      ]
    },
    {
      "id": "s-ruhen",
      "titel": "ruhen lassen",
      "anweisung": "Zugedeckt bei Zimmertemperatur stehen lassen. Das Mehl quillt, der Teig wird geschmeidiger und reißt beim Wenden seltener.",
      "dauer_s": 1800,
      "unbeaufsichtigt": true,
      "zutaten": [],
      "vorstufen": [
        "s-verduennen"
      ]
    },
    {
      "id": "s-ausbacken",
      "titel": "ausbacken",
      "anweisung": "Pfanne mittelheiß, wenig Butterschmalz. Teig dünn einlaufen lassen, wenden sobald die Oberfläche matt ist. Ergibt etwa acht Eierkuchen.",
      "dauer_s": 1500,
      "zutaten": [
        "z-butterschmalz"
      ],
      "vorstufen": [
        "s-ruhen"
      ]
    }
  ],
  "hinweise": [
    "Die Ruhezeit ist der Unterschied zwischen zäh und zart — sie lohnt sich mehr als jede Zutat.",
    "Zu dicker Teig: schluckweise Milch zugeben, nie umgekehrt Mehl in dünnen Teig.",
    "Herzhaft: Zucker weglassen, dafür Muskat oder gehackte Kräuter unterrühren."
  ]
};

window.REZEPTE["linsen-eintopf"] = {
  "schema": 1,
  "id": "linsen-eintopf",
  "titel": "Linsen-Eintopf mit Wurzelgemüse",
  "untertitel": "Ein Topf, 50 Minuten, hält sich drei Tage im Kühlschrank",
  "portionen": 4,
  "portionen_einheit": "Portionen",
  "zeit_aktiv_s": 1200,
  "zeit_gesamt_s": 3900,
  "gefaess": "Großer Topf, mindestens 4 Liter",
  "tags": [
    "eintopf",
    "vegetarisch",
    "vorkochen",
    "herbst"
  ],
  "quelle": null,
  "zutaten": [
    {
      "id": "z-olivenoel",
      "name": "Olivenöl",
      "menge": 2,
      "einheit": "EL",
      "notiz": null
    },
    {
      "id": "z-zwiebeln",
      "name": "Zwiebeln",
      "menge": 200,
      "einheit": "g",
      "notiz": "fein gewürfelt, ca. 2 mittelgroße"
    },
    {
      "id": "z-knoblauch",
      "name": "Knoblauch",
      "menge": 2,
      "einheit": "Zehe",
      "notiz": "in Scheiben"
    },
    {
      "id": "z-karotten",
      "name": "Karotten",
      "menge": 250,
      "einheit": "g",
      "notiz": "in 1 cm Würfeln"
    },
    {
      "id": "z-sellerie",
      "name": "Knollensellerie",
      "menge": 150,
      "einheit": "g",
      "notiz": "in 1 cm Würfeln"
    },
    {
      "id": "z-kartoffeln",
      "name": "Kartoffeln",
      "menge": 400,
      "einheit": "g",
      "notiz": "festkochend, in 2 cm Würfeln"
    },
    {
      "id": "z-tomatenmark",
      "name": "Tomatenmark",
      "menge": 30,
      "einheit": "g",
      "notiz": null
    },
    {
      "id": "z-linsen",
      "name": "Berglinsen",
      "menge": 300,
      "einheit": "g",
      "notiz": "trocken, abgespült"
    },
    {
      "id": "z-bruehe",
      "name": "Gemüsebrühe",
      "menge": 1200,
      "einheit": "ml",
      "notiz": "heiß"
    },
    {
      "id": "z-lorbeer",
      "name": "Lorbeerblatt",
      "menge": 2,
      "einheit": "Blatt",
      "notiz": null,
      "skalieren": false
    },
    {
      "id": "z-thymian",
      "name": "Thymian",
      "menge": 3,
      "einheit": "Stiel",
      "notiz": "frisch"
    },
    {
      "id": "z-essig",
      "name": "Rotweinessig",
      "menge": 1,
      "menge_bis": 2,
      "einheit": "EL",
      "notiz": null
    },
    {
      "id": "z-salz",
      "name": "Salz",
      "menge": 1.5,
      "einheit": "TL",
      "notiz": null
    },
    {
      "id": "z-pfeffer",
      "name": "Schwarzer Pfeffer",
      "menge": null,
      "einheit": null,
      "notiz": "frisch gemahlen, nach Geschmack"
    },
    {
      "id": "z-petersilie",
      "name": "Petersilie",
      "menge": null,
      "einheit": null,
      "notiz": "grob gehackt, zum Servieren"
    }
  ],
  "schritte": [
    {
      "id": "s-anschwitzen",
      "titel": "anschwitzen",
      "anweisung": "Öl im Topf erhitzen, Zwiebeln bei mittlerer Hitze weich dünsten, Knoblauch in der letzten Minute zugeben.",
      "dauer_s": 360,
      "zutaten": [
        "z-olivenoel",
        "z-zwiebeln",
        "z-knoblauch"
      ],
      "vorstufen": []
    },
    {
      "id": "s-wurzelgemuese",
      "titel": "mitbraten",
      "anweisung": "Karotten, Sellerie und Kartoffeln zugeben und unter Rühren anbraten, bis die Kanten Farbe nehmen.",
      "dauer_s": 300,
      "zutaten": [
        "z-karotten",
        "z-sellerie",
        "z-kartoffeln"
      ],
      "vorstufen": [
        "s-anschwitzen"
      ]
    },
    {
      "id": "s-tomatenmark",
      "titel": "Tomatenmark rösten",
      "anweisung": "Tomatenmark einrühren und kurz mitrösten, bis es dunkler wird und nicht mehr säuerlich riecht.",
      "dauer_s": 60,
      "zutaten": [
        "z-tomatenmark"
      ],
      "vorstufen": [
        "s-wurzelgemuese"
      ]
    },
    {
      "id": "s-abloeschen",
      "titel": "aufgießen",
      "anweisung": "Linsen zugeben, mit der heißen Brühe ablöschen, Lorbeer und Thymian einlegen und aufkochen lassen.",
      "dauer_s": 180,
      "zutaten": [
        "z-linsen",
        "z-bruehe",
        "z-lorbeer",
        "z-thymian"
      ],
      "vorstufen": [
        "s-tomatenmark"
      ]
    },
    {
      "id": "s-koecheln",
      "titel": "köcheln",
      "anweisung": "Zugedeckt bei kleiner Hitze köcheln, bis Linsen und Kartoffeln weich sind. Gelegentlich umrühren.",
      "dauer_s": 2100,
      "unbeaufsichtigt": true,
      "zutaten": [],
      "vorstufen": [
        "s-abloeschen"
      ]
    },
    {
      "id": "s-abschmecken",
      "titel": "abschmecken",
      "anweisung": "Lorbeer und Thymianstiele entfernen. Mit Essig, Salz und Pfeffer abschmecken, mit Petersilie bestreut servieren.",
      "dauer_s": null,
      "zutaten": [
        "z-essig",
        "z-salz",
        "z-pfeffer",
        "z-petersilie"
      ],
      "vorstufen": [
        "s-koecheln"
      ]
    }
  ],
  "hinweise": [
    "Der Essig am Schluss ist kein Deko-Schritt: ohne Säure schmeckt der Eintopf flach.",
    "Am zweiten Tag besser. Beim Aufwärmen einen Schuss Wasser zugeben, die Linsen ziehen nach.",
    "Für eine kräftigere Variante 150 g geräucherten Speck vor dem Öl auslassen."
  ]
};
