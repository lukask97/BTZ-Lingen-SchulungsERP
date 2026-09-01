import type { DataTableColumn } from "../types/ui";
import { PERMISSIONS, PERMISSION_GROUPS } from "./permissions";

export { PERMISSIONS, PERMISSION_GROUPS } from "./permissions";

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
        iban: "",
        fuerBts: "",
        bewertung: 3,
        abc: "Unbestimmt"
    },
    lieferantenArtikelStaffeln: {
        id: null,
        artikelId: "",
        lieferantId: "",
        mindestbestellmenge: 1,
        stueckpreis: 0,
        lieferzeitTage: 1,
        notiz: ""
    },
    kunden: {
        id: null,
        kundenNr: "",
        firma: "",
        anschrift: "",
        plz: "",
        ort: "",
        segment: "",
        abc: "Unbestimmt",
        iban: "",
        website: "",
        optionen: [],
        notiz: "",
        ansprechpartner: []
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
        mindestmenge: 0,
        bedarfsmeldungBei: 0,
        beschreibung: "",
        komponenten: [],
        individualisierungen: []
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
    nummernkreise: {
        id: null,
        schluessel: "",
        bezeichnung: "",
        kuerzel: ""
    },
    benutzer: {
        id: null,
        vorname: "",
        nachname: "",
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

// Page-Konfigurationen
export const PAGE_CONFIG = {
    lieferanten: {
        title: "Lieferantenverwaltung",
        tableName: "lieferanten",
        permissionCreate: PERMISSIONS.EINKAUF_BEARBEITEN,
        permissionEdit: PERMISSIONS.EINKAUF_BEARBEITEN,
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
        permissionCreate: PERMISSIONS.SERVICE_BEARBEITEN,
        permissionEdit: PERMISSIONS.SERVICE_BEARBEITEN,
        columns: "services"
    },
    benutzer: {
        title: "Benutzerverwaltung",
        tableName: "benutzer",
        permissionCreate: PERMISSIONS.BENUTZER_ANLEGEN,
        permissionEdit: PERMISSIONS.BENUTZER_BEARBEITEN,
        columns: "benutzer"
    },
    nummernkreise: {
        title: "Nummernkreise",
        tableName: "nummernkreise",
        permissionCreate: PERMISSIONS.BENUTZER_BEARBEITEN,
        permissionEdit: PERMISSIONS.BENUTZER_BEARBEITEN,
        columns: "nummernkreise"
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
        { field: "iban", title: "IBAN" },
        { field: "bewertung", title: "Bewertung" },
        { field: "abc", title: "ABC" },
        { field: "anschrift", title: "Anschrift", visible: false },
        { field: "plz", title: "PLZ", visible: false },
        { field: "fuerBts", title: "Für BTS", visible: false }
    ],
    kunden: [
        { field: "kundenNr", title: "Kundennummer" },
        { field: "firma", title: "Firma" },
        { field: "ort", title: "Ort" },
        { field: "segment", title: "Kategorie" },
        { field: "abc", title: "ABC" },
        { field: "iban", title: "IBAN" },
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
        { field: "bestand", title: "Lager-Bestand" },
        { field: "mindestmenge", title: "Eiserner Bestand" },
        { field: "bedarfsmeldungBei", title: "Nachbestellen ab" },
        { field: "beschreibung", title: "Beschreibung", visible: false },
        { field: "komponenten", title: "Komponenten", visible: false }
    ],
    kategorien: [
        { field: "name", title: "Kategorie" },
        { field: "parentName", title: "Oberkategorie" },
        { field: "pfad", title: "Pfad" },
        { field: "beschreibung", title: "Beschreibung", visible: false }
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
        { field: "vorname", title: "Vorname" },
        { field: "nachname", title: "Nachname" },
        { field: "username", title: "Benutzername" },
        { field: "email", title: "E-Mail" },
        { field: "rolle", title: "Rolle" },
        { field: "password", title: "Passwort", visible: false }
    ],
    nummernkreise: [
        { field: "bezeichnung", title: "Bereich" },
        { field: "schluessel", title: "Schlüssel" },
        { field: "kuerzel", title: "Kürzel" }
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
        { field: "kapazitaet", title: "Kapazität" }
    ],
    rechnungen: [
        { field: "rechnungsnr", title: "Rechnungsnummer" },
        { field: "rechnungstyp", title: "Rechnungstyp" },
        { field: "kunde", title: "Kunde" },
        { field: "bestellNr", title: "Bestellnummer" },
        { field: "datum", title: "Datum" },
        { field: "faelligAm", title: "Fällig am" },
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
