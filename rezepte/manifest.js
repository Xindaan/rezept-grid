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

window.REZEPTE["maultaschen"] = {
  "schema": 1,
  "id": "maultaschen",
  "titel": "Maultaschen",
  "untertitel": "Schwäbische Teigtaschen mit Brät-Spinat-Füllung — die Füllung entsteht, während der Teig ruht",
  "portionen": 4,
  "portionen_einheit": "Portionen",
  "zeit_aktiv_s": 3600,
  "zeit_gesamt_s": 4500,
  "gefaess": "Zwei Schüsseln, Nudelholz oder Maschine, weiter Topf",
  "tags": [
    "schwäbisch",
    "hauptgericht",
    "vorkochen",
    "aufwendig"
  ],
  "quelle": null,
  "zutaten": [
    {
      "id": "z-mehl",
      "name": "Weizenmehl",
      "menge": 400,
      "einheit": "g",
      "notiz": "Type 405"
    },
    {
      "id": "z-eier-teig",
      "name": "Eier",
      "menge": 4,
      "einheit": null,
      "notiz": "für den Teig"
    },
    {
      "id": "z-oel",
      "name": "Olivenöl",
      "menge": 1,
      "einheit": "EL",
      "notiz": null
    },
    {
      "id": "z-salz-teig",
      "name": "Salz",
      "menge": 1,
      "einheit": "TL",
      "notiz": "für den Teig"
    },
    {
      "id": "z-broetchen",
      "name": "Brötchen",
      "menge": 2,
      "einheit": null,
      "notiz": "altbacken, gewürfelt"
    },
    {
      "id": "z-milch",
      "name": "Milch",
      "menge": 150,
      "einheit": "ml",
      "notiz": "lauwarm"
    },
    {
      "id": "z-zwiebel",
      "name": "Zwiebel",
      "menge": 1,
      "einheit": null,
      "notiz": "fein gewürfelt"
    },
    {
      "id": "z-butter",
      "name": "Butter",
      "menge": 20,
      "einheit": "g",
      "notiz": "zum Anschwitzen"
    },
    {
      "id": "z-spinat",
      "name": "Blattspinat",
      "menge": 300,
      "einheit": "g",
      "notiz": "aufgetaut und gut ausgedrückt"
    },
    {
      "id": "z-hack",
      "name": "Hackfleisch",
      "menge": 300,
      "einheit": "g",
      "notiz": "gemischt"
    },
    {
      "id": "z-braet",
      "name": "Bratwurstbrät",
      "menge": 200,
      "einheit": "g",
      "notiz": null
    },
    {
      "id": "z-ei-fuellung",
      "name": "Eier",
      "menge": 1,
      "einheit": null,
      "notiz": "für die Füllung"
    },
    {
      "id": "z-petersilie",
      "name": "Petersilie",
      "menge": 4,
      "einheit": "Stiel",
      "notiz": "fein gehackt"
    },
    {
      "id": "z-muskat",
      "name": "Muskatnuss",
      "menge": null,
      "einheit": null,
      "notiz": "frisch gerieben"
    },
    {
      "id": "z-salz-fuellung",
      "name": "Salz",
      "menge": null,
      "einheit": null,
      "notiz": "für die Füllung, kräftig"
    },
    {
      "id": "z-pfeffer",
      "name": "Schwarzer Pfeffer",
      "menge": null,
      "einheit": null,
      "notiz": "frisch gemahlen"
    },
    {
      "id": "z-bruehe",
      "name": "Fleischbrühe",
      "menge": 2,
      "einheit": "l",
      "notiz": "kräftig"
    }
  ],
  "schritte": [
    {
      "id": "s-teig",
      "titel": "Nudelteig kneten",
      "anweisung": "Zu einem festen, glatten Teig kneten. Er soll deutlich fester sein als Spätzleteig, sonst reißt er beim Ausrollen.",
      "dauer_s": 600,
      "zutaten": [
        "z-mehl",
        "z-eier-teig",
        "z-oel",
        "z-salz-teig"
      ],
      "vorstufen": []
    },
    {
      "id": "s-teig-ruhen",
      "titel": "Teig ruhen lassen",
      "anweisung": "In Folie gewickelt kühl ruhen lassen. Ohne Ruhe zieht sich der Teig beim Ausrollen wieder zusammen.",
      "dauer_s": 1800,
      "unbeaufsichtigt": true,
      "zutaten": [],
      "vorstufen": [
        "s-teig"
      ]
    },
    {
      "id": "s-fuellung",
      "titel": "Füllung mischen",
      "anweisung": "Brötchenwürfel in der Milch einweichen und ausdrücken. Zwiebel in der Butter glasig dünsten und abkühlen lassen. Alles mit Spinat, Hack, Brät, Ei und Petersilie verkneten und kräftig abschmecken — die Füllung muss überwürzt schmecken, der Teig nimmt viel weg.",
      "dauer_s": 900,
      "zutaten": [
        "z-broetchen",
        "z-milch",
        "z-zwiebel",
        "z-butter",
        "z-spinat",
        "z-hack",
        "z-braet",
        "z-ei-fuellung",
        "z-petersilie",
        "z-muskat",
        "z-salz-fuellung",
        "z-pfeffer"
      ],
      "vorstufen": []
    },
    {
      "id": "s-fuellen",
      "titel": "füllen und formen",
      "anweisung": "Teig dünn ausrollen, Füllung aufstreichen, einrollen und in Stücke abteilen. Ränder gut andrücken, sonst öffnen sie sich in der Brühe.",
      "dauer_s": 1200,
      "zutaten": [],
      "vorstufen": [
        "s-teig-ruhen",
        "s-fuellung"
      ]
    },
    {
      "id": "s-ziehen",
      "titel": "in Brühe ziehen",
      "anweisung": "In siedender, nicht kochender Brühe ziehen lassen, bis sie oben schwimmen. Sprudelndes Wasser reißt sie auf.",
      "dauer_s": 900,
      "zutaten": [
        "z-bruehe"
      ],
      "vorstufen": [
        "s-fuellen"
      ]
    }
  ],
  "hinweise": [
    "Die Füllung braucht keinen fertigen Teig. Wer sie während der Teigruhe ansetzt, spart eine halbe Stunde.",
    "Geröstete Maultaschen sind ein eigenes Gericht, keine Resteverwertung: am Folgetag in Scheiben schneiden und mit verquirltem Ei in der Pfanne braten.",
    "Wer sie einfriert, tut das roh und gart sie später direkt aus dem Gefrierfach."
  ]
};

window.REZEPTE["pfannkuchen"] = {
  "schema": 1,
  "id": "pfannkuchen",
  "titel": "Pfannkuchen",
  "untertitel": "Berliner Lesart: Hefeteig, ausgebacken, mit Konfitüre gefüllt — nicht zu verwechseln mit Eierkuchen",
  "portionen": 12,
  "portionen_einheit": "Stück",
  "zeit_aktiv_s": 2700,
  "zeit_gesamt_s": 10800,
  "gefaess": "Rührschüssel, weiter Topf mit hohem Rand, Spritzbeutel",
  "tags": [
    "hefeteig",
    "süß",
    "berlin",
    "silvester"
  ],
  "quelle": null,
  "zutaten": [
    {
      "id": "z-milch",
      "name": "Milch",
      "menge": 250,
      "einheit": "ml",
      "notiz": "lauwarm, höchstens 37 °C"
    },
    {
      "id": "z-hefe",
      "name": "Frische Hefe",
      "menge": 21,
      "einheit": "g",
      "notiz": "ein halber Würfel"
    },
    {
      "id": "z-zucker-hefe",
      "name": "Zucker",
      "menge": 1,
      "einheit": "TL",
      "notiz": "für die Hefe",
      "skalieren": false
    },
    {
      "id": "z-mehl",
      "name": "Weizenmehl",
      "menge": 500,
      "einheit": "g",
      "notiz": "Type 550"
    },
    {
      "id": "z-zucker",
      "name": "Zucker",
      "menge": 60,
      "einheit": "g",
      "notiz": "für den Teig"
    },
    {
      "id": "z-eier",
      "name": "Eier",
      "menge": 2,
      "einheit": null,
      "notiz": "Größe M"
    },
    {
      "id": "z-eigelb",
      "name": "Eigelb",
      "menge": 2,
      "einheit": null,
      "notiz": null
    },
    {
      "id": "z-butter",
      "name": "Butter",
      "menge": 75,
      "einheit": "g",
      "notiz": "weich"
    },
    {
      "id": "z-zitrone",
      "name": "Bio-Zitrone",
      "menge": 1,
      "einheit": null,
      "notiz": "nur die abgeriebene Schale"
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
      "id": "z-butterschmalz",
      "name": "Butterschmalz",
      "menge": 1000,
      "einheit": "g",
      "notiz": "zum Ausbacken, hängt vom Topf ab",
      "skalieren": false
    },
    {
      "id": "z-konfituere",
      "name": "Konfitüre",
      "menge": 250,
      "einheit": "g",
      "notiz": "Hagebutte oder Pflaumenmus, glatt gerührt"
    },
    {
      "id": "z-puderzucker",
      "name": "Puderzucker",
      "menge": null,
      "einheit": null,
      "notiz": "zum Bestäuben"
    }
  ],
  "schritte": [
    {
      "id": "s-hefe",
      "titel": "Hefe ansetzen",
      "anweisung": "Hefe und den Löffel Zucker in der lauwarmen Milch auflösen und stehen lassen, bis sich Schaum bildet. Zeigt sich keiner, ist die Hefe tot — dann neu anfangen.",
      "dauer_s": 900,
      "unbeaufsichtigt": true,
      "zutaten": [
        "z-milch",
        "z-hefe",
        "z-zucker-hefe"
      ],
      "vorstufen": []
    },
    {
      "id": "s-teig",
      "titel": "Teig kneten",
      "anweisung": "Alles zugeben und kneten, bis der Teig sich von der Schüssel löst und glänzt. Er bleibt weicher als Brotteig.",
      "dauer_s": 600,
      "zutaten": [
        "z-mehl",
        "z-zucker",
        "z-eier",
        "z-eigelb",
        "z-butter",
        "z-zitrone",
        "z-salz"
      ],
      "vorstufen": [
        "s-hefe"
      ]
    },
    {
      "id": "s-gehen",
      "titel": "gehen lassen",
      "anweisung": "Zugedeckt an einem warmen Ort gehen lassen, bis sich das Volumen verdoppelt hat.",
      "dauer_s": 3600,
      "unbeaufsichtigt": true,
      "zutaten": [],
      "vorstufen": [
        "s-teig"
      ]
    },
    {
      "id": "s-formen",
      "titel": "formen und ruhen",
      "anweisung": "Zwölf Kugeln abstechen, auf bemehltem Tuch nochmals gehen lassen. Nicht mehr kneten, sonst fällt die Luft zusammen.",
      "dauer_s": 1800,
      "unbeaufsichtigt": true,
      "zutaten": [],
      "vorstufen": [
        "s-gehen"
      ]
    },
    {
      "id": "s-backen",
      "titel": "ausbacken",
      "anweisung": "Fett auf 170 °C bringen. Kugeln zuerst mit Deckel goldbraun backen, dann wenden und offen fertig backen. Der helle Rand in der Mitte ist das Ziel.",
      "dauer_s": 1200,
      "temperatur_c": 170,
      "zutaten": [
        "z-butterschmalz"
      ],
      "vorstufen": [
        "s-formen"
      ]
    },
    {
      "id": "s-fuellen",
      "titel": "füllen und zuckern",
      "anweisung": "Lauwarm von der Seite her mit dem Spritzbeutel füllen, danach bestäuben. Heiß füllen geht schief, die Konfitüre läuft wieder heraus.",
      "dauer_s": null,
      "zutaten": [
        "z-konfituere",
        "z-puderzucker"
      ],
      "vorstufen": [
        "s-backen"
      ]
    }
  ],
  "hinweise": [
    "Der Name ist regional verschieden: In Berlin und Brandenburg heißt dieses Hefegebäck Pfannkuchen, andernorts Berliner oder Krapfen. Das flache Gebäck aus der Pfanne heißt hier Eierkuchen und steht unter eigenem Namen.",
    "Der helle Ring rundherum entsteht nur, wenn das Fett nicht zu heiß ist und die Kugeln beim ersten Backen schwimmen dürfen.",
    "Am selben Tag essen. Hefegebäck mit Fett wird über Nacht zäh."
  ]
};

window.REZEPTE["spaetzle"] = {
  "schema": 1,
  "id": "spaetzle",
  "titel": "Spätzle",
  "untertitel": "Vom Brett geschabt — vier Zutaten, der Rest ist Armkraft",
  "portionen": 4,
  "portionen_einheit": "Portionen",
  "zeit_aktiv_s": 1500,
  "zeit_gesamt_s": 3600,
  "gefaess": "Rührschüssel, weiter Topf, Spätzlebrett und Palette",
  "tags": [
    "schwäbisch",
    "beilage",
    "grundrezept",
    "vegetarisch"
  ],
  "quelle": null,
  "zutaten": [
    {
      "id": "z-mehl",
      "name": "Spätzlemehl",
      "menge": 400,
      "einheit": "g",
      "notiz": "griffig, ersatzweise Type 405"
    },
    {
      "id": "z-eier",
      "name": "Eier",
      "menge": 4,
      "einheit": null,
      "notiz": "Größe M"
    },
    {
      "id": "z-wasser",
      "name": "Wasser",
      "menge": 100,
      "einheit": "ml",
      "notiz": "kalt, nach Bedarf"
    },
    {
      "id": "z-salz",
      "name": "Salz",
      "menge": 1,
      "einheit": "TL",
      "notiz": null
    },
    {
      "id": "z-muskat",
      "name": "Muskatnuss",
      "menge": null,
      "einheit": null,
      "notiz": "frisch gerieben"
    },
    {
      "id": "z-kochwasser",
      "name": "Wasser",
      "menge": 4,
      "einheit": "l",
      "notiz": "zum Kochen",
      "skalieren": false
    },
    {
      "id": "z-kochsalz",
      "name": "Salz",
      "menge": 1,
      "einheit": "EL",
      "notiz": "für das Kochwasser",
      "skalieren": false
    },
    {
      "id": "z-butter",
      "name": "Butter",
      "menge": 30,
      "einheit": "g",
      "notiz": "zum Schwenken"
    }
  ],
  "schritte": [
    {
      "id": "s-teig",
      "titel": "Teig schlagen",
      "anweisung": "Alles verrühren und dann kräftig schlagen, bis der Teig Blasen wirft und zäh vom Löffel reißt. Das Schlagen ist der ganze Trick — zu dünner Teig zerfällt im Wasser.",
      "dauer_s": 480,
      "zutaten": [
        "z-mehl",
        "z-eier",
        "z-wasser",
        "z-salz",
        "z-muskat"
      ],
      "vorstufen": []
    },
    {
      "id": "s-ruhen",
      "titel": "ruhen lassen",
      "anweisung": "Zugedeckt stehen lassen. Der Teig entspannt sich und lässt sich danach sauber schaben.",
      "dauer_s": 1800,
      "unbeaufsichtigt": true,
      "zutaten": [],
      "vorstufen": [
        "s-teig"
      ]
    },
    {
      "id": "s-wasser",
      "titel": "Wasser aufsetzen",
      "anweisung": "Reichlich Wasser salzen und aufkochen. Danach die Hitze zurücknehmen, es soll sieden und nicht sprudeln.",
      "dauer_s": 600,
      "zutaten": [
        "z-kochwasser",
        "z-kochsalz"
      ],
      "vorstufen": [
        "s-ruhen"
      ]
    },
    {
      "id": "s-schaben",
      "titel": "schaben und garen",
      "anweisung": "Teig dünn auf das nasse Brett streichen und in schmalen Streifen ins Wasser schaben. Sobald sie oben schwimmen, abschöpfen und kalt abschrecken.",
      "dauer_s": 480,
      "zutaten": [],
      "vorstufen": [
        "s-wasser"
      ]
    },
    {
      "id": "s-schwenken",
      "titel": "schwenken",
      "anweisung": "In brauner Butter schwenken und sofort auf den Tisch.",
      "dauer_s": 120,
      "zutaten": [
        "z-butter"
      ],
      "vorstufen": [
        "s-schaben"
      ]
    }
  ],
  "hinweise": [
    "Brett und Palette immer wieder ins kochende Wasser tauchen, dann klebt nichts.",
    "Gepresst statt geschabt ergibt einen runden, gleichmäßigen Querschnitt statt der unregelmäßigen Form. Der Teig darf dafür etwas fester sein.",
    "Als Käsespätzle: lagenweise mit geriebenem Bergkäse schichten und mit gerösteten Zwiebeln belegen."
  ]
};
