import { benutzerSpalten } from "../mockup/mockMetaData";

import {
    loadData, saveData
} from "../mockup/mockStorage";
import { buildDatabasePath, isDatabaseModeEnabled, syncApiRequest } from "./api";
function getUserColumnSettings() {
    if (isDatabaseModeEnabled()) {
        const result = syncApiRequest(buildDatabasePath("/benutzerSpalten"));
        return result.items || [];
    }

    return loadData("benutzerSpalten", benutzerSpalten);
}

export function getUserColumns(username, tabelle) {

    const daten = getUserColumnSettings();


    return daten.find(x => x.username === username && x.tabelle === tabelle);

}


export function saveUserColumns(username, tabelle, fields) {

    let daten = getUserColumnSettings();


    const bisher = daten.find(x => x.username === username && x.tabelle === tabelle);
    daten = daten.filter(x => !(x.username === username && x.tabelle === tabelle));


    const payload = {
        ...(bisher || {}),

        username,

        tabelle,

        sichtbareFelder: fields

    };

    if (isDatabaseModeEnabled()) {
        if (bisher?.id) {
            syncApiRequest(buildDatabasePath(`/benutzerSpalten/${bisher.id}`), {
                method: "PATCH",
                body: payload
            });
            return;
        }

        syncApiRequest(buildDatabasePath("/benutzerSpalten"), {
            method: "POST",
            body: payload
        });
        return;
    }

    daten.push(payload);


    saveData("benutzerSpalten", daten);

}
