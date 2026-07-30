import type { DataTableColumn } from "../types/ui";

// Initiale Datenstrukturen für alle Tabellen
export const INITIAL_DATA = {
    lieferanten: {
        id: null,
        lieferantenNr: "",
        firma: "",
        anschrift: "",
        plz: "",
        ort: "",
        segment: "",
        fuerBts: "",
        bewertung: 3,
        abc: "C"
    },
    kunden: {
        id: null,
        kundenNr: "",
        firma: "",
        anschrift: "",
        plz: "",
        ort: "",
        segment: "",
        abc: "C",
        website: "",
        optionen: [],
        notiz: ""
    },
    artikel: {
        id: null,
        artikelNr: "",
        name: "",
        kategorieId: "",
        kategorie: "",
        kategoriePfad: "",
        artikelTyp: "Einzelartikel",
        einkaufspreis: 0,
        verkaufspreis: 0,
        bestand: 0,
        beschreibung: "",
        komponenten: []
    },
    kategorien: {
        id: null,
        name: "",
        parentId: "",
        beschreibung: ""
    },
    services: {
        id: null,
        serviceNr: "",
        name: "",
        kategorie: "",
        berechnungstyp: "Pauschal",
        zeEinheit: "",
        einkaufspreis: 0,
        verkaufspreis: 0,
        beschreibung: ""
    },
    benutzer: {
        id: null,
        username: "",
        email: "",
        password: "",
        rolle: ""
    },
    rollen: {
        id: null,
        name: "",
        beschreibung: "",
        permissions: []
    },
    rechte: {
        id: null,
        name: "",
        beschreibung: ""
    },
    lager: {
        id: null,
        name: "",
        standort: "",
        kapazitaet: 0
    },
    rechnungen: {
        id: null,
        rechnungsnr: "",
        rechnungstyp: "Ausgangsrechnung",
        kundeId: "",
        lieferantId: "",
        kunde: "",
        bestellungId: "",
        bestellNr: "",
        faelligAm: "",
        datum: "",
        betrag: 0,
        status: "offen",
        mahnstufe: "-"
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
    "Einkauf": [
        { key: "einkauf.lesen", label: "Einkauf lesen" },
        { key: "einkauf.bearbeiten", label: "Einkauf bearbeiten" }
    ],
    "Verkauf": [
        { key: "verkauf.lesen", label: "Verkauf lesen" },
        { key: "verkauf.bearbeiten", label: "Verkauf bearbeiten" }
    ],
    "Service": [
        { key: "service.lesen", label: "Service lesen" },
        { key: "service.bearbeiten", label: "Service bearbeiten" }
    ],
    "Marketing": [
        { key: "marketing.lesen", label: "Marketing lesen" },
        { key: "marketing.bearbeiten", label: "Marketing bearbeiten" }
    ],
    "Buchhaltung": [
        { key: "buchhaltung.lesen", label: "Buchhaltung lesen" },
        { key: "buchhaltung.bearbeiten", label: "Buchhaltung bearbeiten" }
    ],
    "Geschäftsführung": [
        { key: "gf.lesen", label: "Geschäftsführung lesen" },
        { key: "gf.bearbeiten", label: "Geschäftsführung bearbeiten" }
    ],
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
    lieferanten: {
        title: "Lieferantenverwaltung",
        tableName: "lieferanten",
        permissionCreate: "einkauf.bearbeiten",
        permissionEdit: "einkauf.bearbeiten",
        columns: "lieferanten"
    },
    kunden: {
        title: "Kundenverwaltung",
        tableName: "kunden",
        permissionCreate: PERMISSIONS.KUNDE_ANLEGEN,
        permissionEdit: PERMISSIONS.KUNDE_BEARBEITEN,
        columns: "kunden"
    },
    artikel: {
        title: "Artikelverwaltung",
        tableName: "artikel",
        permissionCreate: PERMISSIONS.ARTIKEL_ANLEGEN,
        permissionEdit: PERMISSIONS.ARTIKEL_BEARBEITEN,
        columns: "artikel"
    },
    kategorien: {
        title: "Kategorien",
        tableName: "kategorien",
        permissionCreate: PERMISSIONS.ARTIKEL_ANLEGEN,
        permissionEdit: PERMISSIONS.ARTIKEL_BEARBEITEN,
        columns: "kategorien"
    },
    services: {
        title: "Serviceverwaltung",
        tableName: "services",
        permissionCreate: "service.bearbeiten",
        permissionEdit: "service.bearbeiten",
        columns: "services"
    },
    benutzer: {
        title: "Benutzerverwaltung",
        tableName: "benutzer",
        permissionCreate: PERMISSIONS.BENUTZER_ANLEGEN,
        permissionEdit: PERMISSIONS.BENUTZER_BEARBEITEN,
        columns: "benutzer"
    },
    rollen: {
        title: "Rollenverwaltung",
        tableName: "rollen",
        permissionCreate: PERMISSIONS.ROLLEN_ANLEGEN,
        permissionEdit: PERMISSIONS.ROLLEN_BEARBEITEN,
        columns: "rollen"
    },
    rechte: {
        title: "Rechteverwaltung",
        tableName: "rechte",
        permissionCreate: PERMISSIONS.RECHTE_ANLEGEN,
        permissionEdit: PERMISSIONS.RECHTE_BEARBEITEN,
        columns: "rechte"
    },
    lager: {
        title: "Lagerverwaltung",
        tableName: "lager",
        permissionCreate: PERMISSIONS.LAGER_ANLEGEN,
        permissionEdit: PERMISSIONS.LAGER_BEARBEITEN,
        columns: "lager"
    },
    rechnungen: {
        title: "Rechnungsverwaltung",
        tableName: "rechnungen",
        permissionCreate: PERMISSIONS.RECHNUNG_ANLEGEN,
        permissionEdit: PERMISSIONS.RECHNUNG_BEARBEITEN,
        columns: "rechnungen"
    }
};

export const TABLE_COLUMNS: Record<string, DataTableColumn[]> = {
    lieferanten: [
        { field: "lieferantenNr", title: "Lieferantennummer" },
        { field: "firma", title: "Firma" },
        { field: "ort", title: "Ort" },
        { field: "segment", title: "Segment" },
        { field: "bewertung", title: "Bewertung" },
        { field: "abc", title: "ABC" },
        { field: "anschrift", title: "Anschrift", visible: false },
        { field: "plz", title: "PLZ", visible: false },
        { field: "fuerBts", title: "Fuer BTS", visible: false }
    ],
    kunden: [
        { field: "kundenNr", title: "Kundennummer" },
        { field: "firma", title: "Firma" },
        { field: "ort", title: "Ort" },
        { field: "segment", title: "Segment" },
        { field: "abc", title: "ABC" },
        { field: "website", title: "Website" },
        { field: "anschrift", title: "Anschrift", visible: false },
        { field: "plz", title: "PLZ", visible: false },
        { field: "optionen", title: "Optionen", visible: false },
        { field: "notiz", title: "Notiz", visible: false }
    ],
    artikel: [
        { field: "artikelNr", title: "Artikelnummer" },
        { field: "name", title: "Name" },
        { field: "kategoriePfad", title: "Kategorie" },
        { field: "artikelTyp", title: "Typ" },
        { field: "einkaufspreis", title: "Einkaufspreis" },
        { field: "verkaufspreis", title: "Verkaufspreis" },
        { field: "bestand", title: "Bestand" },
        { field: "beschreibung", title: "Beschreibung", visible: false },
        { field: "komponenten", title: "Komponenten", visible: false }
    ],
    kategorien: [
        { field: "name", title: "Name" },
        { field: "parentId", title: "Oberkategorie" },
        { field: "beschreibung", title: "Beschreibung" }
    ],
    services: [
        { field: "serviceNr", title: "Servicenummer" },
        { field: "name", title: "Name" },
        { field: "kategorie", title: "Kategorie" },
        { field: "berechnungstyp", title: "Berechnungstyp" },
        { field: "zeEinheit", title: "ZE" },
        { field: "einkaufspreis", title: "Einkaufspreis" },
        { field: "verkaufspreis", title: "Verkaufspreis" },
        { field: "beschreibung", title: "Beschreibung", visible: false }
    ],
    benutzer: [
        { field: "username", title: "Benutzername" },
        { field: "email", title: "E-Mail" },
        { field: "rolle", title: "Rolle" },
        { field: "password", title: "Passwort", visible: false }
    ],
    rollen: [
        { field: "name", title: "Name" },
        { field: "beschreibung", title: "Beschreibung" },
        { field: "permissions", title: "Berechtigungen", visible: false }
    ],
    rechte: [
        { field: "name", title: "Name" },
        { field: "beschreibung", title: "Beschreibung" }
    ],
    lager: [
        { field: "name", title: "Name" },
        { field: "standort", title: "Standort" },
        { field: "kapazitaet", title: "Kapazitaet" }
    ],
    rechnungen: [
        { field: "rechnungsnr", title: "Rechnungsnummer" },
        { field: "rechnungstyp", title: "Rechnungstyp" },
        { field: "kunde", title: "Kunde" },
        { field: "bestellNr", title: "Bestellnummer" },
        { field: "datum", title: "Datum" },
        { field: "faelligAm", title: "Faellig am" },
        { field: "betrag", title: "Betrag" },
        { field: "status", title: "Status" },
        { field: "mahnstufe", title: "Mahnstufe" }
    ]
};

export function getAllTableColumns(tableName: string): DataTableColumn[] {
    return TABLE_COLUMNS[tableName] || [];
}

export function getVisibleTableColumns(tableName: string): DataTableColumn[] {
    return getAllTableColumns(tableName).filter(column => column.visible !== false);
}
