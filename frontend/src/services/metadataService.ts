import {
    feldMetadaten, benutzerSpalten
} from "./mockup/mockMetaData";


import {
    loadData, saveData
} from "./mockup/mockStorage";


export function getColumns(tabelle, username) {


    const metaDaten = loadData("feldMetadaten", feldMetadaten);


    const spaltenDaten = loadData("benutzerSpalten", benutzerSpalten);


    const userSettings = spaltenDaten.find(x => x.username === username && x.tabelle === tabelle);


    let fields;


    // Benutzer hat eigene Auswahl
    if (userSettings) {

        fields = userSettings.sichtbareFelder;

    } else {

        // Standard: alles anzeigen
        fields = metaDaten
            .filter(x => x.tabelle === tabelle && x.sichtbar)
            .map(x => x.feld);

    }


    return metaDaten

        .filter(x => x.tabelle === tabelle && fields.includes(x.feld))

        .sort((a, b) => a.reihenfolge - b.reihenfolge)

        .map(x => ({

            field: x.feld,

            title: x.anzeigename

        }));

}

export function getUserColumns(username, tabelle) {

    const daten = loadData("benutzerSpalten", []);


    return daten.find(x => x.username === username && x.tabelle === tabelle);

}


export function saveUserColumns(username, tabelle, fields) {

    let daten = loadData("benutzerSpalten", []);


    daten = daten.filter(x => !(x.username === username && x.tabelle === tabelle));


    daten.push({

        username,

        tabelle,

        sichtbareFelder: fields

    });


    saveData("benutzerSpalten", daten);

}

export function getAllColumns(tabelle) {


    const metaDaten = loadData("feldMetadaten", feldMetadaten);


    return metaDaten

        .filter(x => x.tabelle === tabelle && x.sichtbar)

        .sort((a, b) => a.reihenfolge - b.reihenfolge)

        .map(x => ({

            field: x.feld,

            title: x.anzeigename

        }));

}
