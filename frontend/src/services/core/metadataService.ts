import { buildDatabasePath, isPermissionError, syncApiRequest } from "./api";

function getUserColumnSettings() {
    try {
        const result = syncApiRequest(buildDatabasePath("/benutzerSpalten"));
        return result.items || [];
    } catch (error) {
        if (isPermissionError(error)) {
            return [];
        }

        throw error;
    }
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

    try {
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
    } catch (error) {
        if (isPermissionError(error)) {
            return;
        }

        throw error;
    }

}

export function getUserColumnWidths(username, tabelle) {
    const setting = getUserColumns(username, tabelle);
    return setting?.spaltenBreiten || {};
}

export function saveUserColumnWidths(username, tabelle, widths, fields = []) {
    let daten = getUserColumnSettings();
    const bisher = daten.find(x => x.username === username && x.tabelle === tabelle);

    const payload = {
        ...(bisher || {}),
        username,
        tabelle,
        sichtbareFelder: bisher?.sichtbareFelder?.length > 0 ? bisher.sichtbareFelder : fields,
        spaltenBreiten: widths
    };

    try {
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
    } catch (error) {
        if (isPermissionError(error)) {
            return;
        }

        throw error;
    }
}
