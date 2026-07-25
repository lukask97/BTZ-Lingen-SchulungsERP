// Initiale Datenstrukturen für alle Tabellen
export const INITIAL_DATA = {
    kunden: {
        id: null,
        kundenNr: "",
        firma: "",
        anschrift: "",
        plz: "",
        ort: "",
        segment: "",
        website: "",
        optionen: [],
        notiz: "",
        aktiv: true
    },
    artikel: {
        id: null,
        artikelNr: "",
        name: "",
        kategorie: "",
        preis: 0,
        bestand: 0,
        beschreibung: "",
        aktiv: true
    },
    benutzer: {
        id: null,
        username: "",
        email: "",
        password: "",
        rolle: "",
        aktiv: true
    },
    rollen: {
        id: null,
        name: "",
        beschreibung: "",
        permissions: [],
        aktiv: true
    },
    rechte: {
        id: null,
        name: "",
        beschreibung: "",
        aktiv: true
    },
    lager: {
        id: null,
        name: "",
        standort: "",
        kapazitaet: 0,
        aktiv: true
    },
    rechnungen: {
        id: null,
        rechnungsnr: "",
        kunde: "",
        datum: "",
        betrag: 0,
        status: "offen",
        aktiv: true
    }
};

// Berechtigungen für jede Seite
export const PERMISSIONS = {
    KUNDE_ANLEGEN: "kunde.anlegen",
    KUNDE_BEARBEITEN: "kunde.bearbeiten",
    ARTIKEL_ANLEGEN: "artikel.anlegen",
    ARTIKEL_BEARBEITEN: "artikel.bearbeiten",
    BENUTZER_ANLEGEN: "benutzer.anlegen",
    BENUTZER_BEARBEITEN: "benutzer.bearbeiten",
    ROLLEN_ANLEGEN: "rollen.anlegen",
    ROLLEN_BEARBEITEN: "rollen.bearbeiten",
    RECHTE_ANLEGEN: "rechte.anlegen",
    RECHTE_BEARBEITEN: "rechte.bearbeiten",
    LAGER_ANLEGEN: "lager.anlegen",
    LAGER_BEARBEITEN: "lager.bearbeiten",
    RECHNUNG_ANLEGEN: "rechnung.anlegen",
    RECHNUNG_BEARBEITEN: "rechnung.bearbeiten"
};

// Alle verfügbaren Berechtigungen gruppiert
export const PERMISSION_GROUPS = {
    "Kunden": [
        { key: "kunde.anlegen", label: "Kunde anlegen" },
        { key: "kunde.bearbeiten", label: "Kunde bearbeiten" },
        { key: "kunde.loeschen", label: "Kunde löschen" },
        { key: "kunde.anzeigen", label: "Kunde anzeigen" }
    ],
    "Artikel": [
        { key: "artikel.anlegen", label: "Artikel anlegen" },
        { key: "artikel.bearbeiten", label: "Artikel bearbeiten" },
        { key: "artikel.loeschen", label: "Artikel löschen" },
        { key: "artikel.anzeigen", label: "Artikel anzeigen" }
    ],
    "Benutzer": [
        { key: "benutzer.anlegen", label: "Benutzer anlegen" },
        { key: "benutzer.bearbeiten", label: "Benutzer bearbeiten" },
        { key: "benutzer.loeschen", label: "Benutzer löschen" },
        { key: "benutzer.anzeigen", label: "Benutzer anzeigen" }
    ],
    "Rollen": [
        { key: "rollen.anlegen", label: "Rolle anlegen" },
        { key: "rollen.bearbeiten", label: "Rolle bearbeiten" },
        { key: "rollen.loeschen", label: "Rolle löschen" },
        { key: "rollen.anzeigen", label: "Rolle anzeigen" }
    ],
    "Rechte": [
        { key: "rechte.anlegen", label: "Recht anlegen" },
        { key: "rechte.bearbeiten", label: "Recht bearbeiten" },
        { key: "rechte.loeschen", label: "Recht löschen" },
        { key: "rechte.anzeigen", label: "Recht anzeigen" }
    ],
    "Lager": [
        { key: "lager.anlegen", label: "Lager anlegen" },
        { key: "lager.bearbeiten", label: "Lager bearbeiten" },
        { key: "lager.loeschen", label: "Lager löschen" },
        { key: "lager.anzeigen", label: "Lager anzeigen" }
    ],
    "Rechnungen": [
        { key: "rechnung.anlegen", label: "Rechnung anlegen" },
        { key: "rechnung.bearbeiten", label: "Rechnung bearbeiten" },
        { key: "rechnung.loeschen", label: "Rechnung löschen" },
        { key: "rechnung.anzeigen", label: "Rechnung anzeigen" }
    ]
};

// Page-Konfigurationen
export const PAGE_CONFIG = {
    kunden: {
        title: "Kundenverwaltung",
        tableName: "kunden",
        permissionCreate: PERMISSIONS.KUNDE_ANLEGEN,
        permissionEdit: PERMISSIONS.KUNDE_BEARBEITEN
    },
    artikel: {
        title: "Artikelverwaltung",
        tableName: "artikel",
        permissionCreate: PERMISSIONS.ARTIKEL_ANLEGEN,
        permissionEdit: PERMISSIONS.ARTIKEL_BEARBEITEN
    },
    benutzer: {
        title: "Benutzerverwaltung",
        tableName: "benutzer",
        permissionCreate: PERMISSIONS.BENUTZER_ANLEGEN,
        permissionEdit: PERMISSIONS.BENUTZER_BEARBEITEN
    },
    rollen: {
        title: "Rollenverwaltung",
        tableName: "rollen",
        permissionCreate: PERMISSIONS.ROLLEN_ANLEGEN,
        permissionEdit: PERMISSIONS.ROLLEN_BEARBEITEN
    },
    rechte: {
        title: "Rechteverwaltung",
        tableName: "rechte",
        permissionCreate: PERMISSIONS.RECHTE_ANLEGEN,
        permissionEdit: PERMISSIONS.RECHTE_BEARBEITEN
    },
    lager: {
        title: "Lagerverwaltung",
        tableName: "lager",
        permissionCreate: PERMISSIONS.LAGER_ANLEGEN,
        permissionEdit: PERMISSIONS.LAGER_BEARBEITEN
    },
    rechnungen: {
        title: "Rechnungsverwaltung",
        tableName: "rechnungen",
        permissionCreate: PERMISSIONS.RECHNUNG_ANLEGEN,
        permissionEdit: PERMISSIONS.RECHNUNG_BEARBEITEN
    }
};
