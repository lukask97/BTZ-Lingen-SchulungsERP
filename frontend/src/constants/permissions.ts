export const ACCESS = {
    ORGANISATION: "organisation",
    EINKAUF: "einkauf",
    VERKAUF: "verkauf",
    SERVICE: "service",
    MARKETING: "marketing",
    BUCHHALTUNG: "buchhaltung",
    GESCHAEFTSFUEHRUNG: "gf",
    KUNDE: "kunde",
    ARTIKEL: "artikel",
    BENUTZER: "benutzer",
    ROLLEN: "rollen",
    RECHTE: "rechte",
    LAGER: "lager",
    RECHNUNG: "rechnung",
    LOGISTIK: "logistik",
    PERSONALWESEN: "personalwesen"
} as const;

export const PERMISSIONS = {
    EINKAUF_LESEN: "einkauf.lesen",
    EINKAUF_BEARBEITEN: "einkauf.bearbeiten",
    VERKAUF_LESEN: "verkauf.lesen",
    VERKAUF_BEARBEITEN: "verkauf.bearbeiten",
    SERVICE_LESEN: "service.lesen",
    SERVICE_BEARBEITEN: "service.bearbeiten",
    MARKETING_LESEN: "marketing.lesen",
    MARKETING_BEARBEITEN: "marketing.bearbeiten",
    BUCHHALTUNG_LESEN: "buchhaltung.lesen",
    BUCHHALTUNG_BEARBEITEN: "buchhaltung.bearbeiten",
    LOGISTIK_LESEN: "logistik.lesen",
    LOGISTIK_BEARBEITEN: "logistik.bearbeiten",
    PERSONALWESEN_LESEN: "personalwesen.lesen",
    PERSONALWESEN_BEARBEITEN: "personalwesen.bearbeiten",
    GF_LESEN: "gf.lesen",
    GF_BEARBEITEN: "gf.bearbeiten",
    KUNDE_LESEN: "kunde.lesen",
    KUNDE_ANLEGEN: "kunde.anlegen",
    KUNDE_BEARBEITEN: "kunde.bearbeiten",
    KUNDE_LOESCHEN: "kunde.loeschen",
    KUNDE_ANZEIGEN: "kunde.anzeigen",
    ARTIKEL_LESEN: "artikel.lesen",
    ARTIKEL_ANLEGEN: "artikel.anlegen",
    ARTIKEL_BEARBEITEN: "artikel.bearbeiten",
    ARTIKEL_LOESCHEN: "artikel.loeschen",
    ARTIKEL_ANZEIGEN: "artikel.anzeigen",
    BENUTZER_LESEN: "benutzer.lesen",
    BENUTZER_ANLEGEN: "benutzer.anlegen",
    BENUTZER_BEARBEITEN: "benutzer.bearbeiten",
    BENUTZER_LOESCHEN: "benutzer.loeschen",
    BENUTZER_ANZEIGEN: "benutzer.anzeigen",
    ROLLEN_LESEN: "rollen.lesen",
    ROLLEN_ANLEGEN: "rollen.anlegen",
    ROLLEN_BEARBEITEN: "rollen.bearbeiten",
    ROLLEN_LOESCHEN: "rollen.loeschen",
    ROLLEN_ANZEIGEN: "rollen.anzeigen",
    RECHTE_LESEN: "rechte.lesen",
    RECHTE_ANLEGEN: "rechte.anlegen",
    RECHTE_BEARBEITEN: "rechte.bearbeiten",
    RECHTE_LOESCHEN: "rechte.loeschen",
    RECHTE_ANZEIGEN: "rechte.anzeigen",
    LAGER_LESEN: "lager.lesen",
    LAGER_ANLEGEN: "lager.anlegen",
    LAGER_BEARBEITEN: "lager.bearbeiten",
    LAGER_LOESCHEN: "lager.loeschen",
    LAGER_ANZEIGEN: "lager.anzeigen",
    LAGER_BUCHEN: "lager.buchen",
    RECHNUNG_LESEN: "rechnung.lesen",
    RECHNUNG_ANLEGEN: "rechnung.anlegen",
    RECHNUNG_BEARBEITEN: "rechnung.bearbeiten",
    RECHNUNG_LOESCHEN: "rechnung.loeschen",
    RECHNUNG_ANZEIGEN: "rechnung.anzeigen"
} as const;

export const PERMISSION_GROUPS = {
    Einkauf: [
        { key: PERMISSIONS.EINKAUF_LESEN, label: "Einkauf lesen" },
        { key: PERMISSIONS.EINKAUF_BEARBEITEN, label: "Einkauf bearbeiten" }
    ],
    Verkauf: [
        { key: PERMISSIONS.VERKAUF_LESEN, label: "Verkauf lesen" },
        { key: PERMISSIONS.VERKAUF_BEARBEITEN, label: "Verkauf bearbeiten" }
    ],
    Service: [
        { key: PERMISSIONS.SERVICE_LESEN, label: "Service lesen" },
        { key: PERMISSIONS.SERVICE_BEARBEITEN, label: "Service bearbeiten" }
    ],
    Marketing: [
        { key: PERMISSIONS.MARKETING_LESEN, label: "Marketing lesen" },
        { key: PERMISSIONS.MARKETING_BEARBEITEN, label: "Marketing bearbeiten" }
    ],
    Buchhaltung: [
        { key: PERMISSIONS.BUCHHALTUNG_LESEN, label: "Buchhaltung lesen" },
        { key: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, label: "Buchhaltung bearbeiten" }
    ],
    Logistik: [
        { key: PERMISSIONS.LOGISTIK_LESEN, label: "Logistik lesen" },
        { key: PERMISSIONS.LOGISTIK_BEARBEITEN, label: "Logistik bearbeiten" }
    ],
    Personalwesen: [
        { key: PERMISSIONS.PERSONALWESEN_LESEN, label: "Personalwesen lesen" },
        { key: PERMISSIONS.PERSONALWESEN_BEARBEITEN, label: "Personalwesen bearbeiten" }
    ],
    Geschäftsführung: [
        { key: PERMISSIONS.GF_LESEN, label: "Geschäftsführung lesen" },
        { key: PERMISSIONS.GF_BEARBEITEN, label: "Geschäftsführung bearbeiten" }
    ],
    Kunden: [
        { key: PERMISSIONS.KUNDE_LESEN, label: "Kunde lesen" },
        { key: PERMISSIONS.KUNDE_ANLEGEN, label: "Kunde anlegen" },
        { key: PERMISSIONS.KUNDE_BEARBEITEN, label: "Kunde bearbeiten" },
        { key: PERMISSIONS.KUNDE_LOESCHEN, label: "Kunde löschen" },
        { key: PERMISSIONS.KUNDE_ANZEIGEN, label: "Kunde anzeigen" }
    ],
    Artikel: [
        { key: PERMISSIONS.ARTIKEL_LESEN, label: "Artikel lesen" },
        { key: PERMISSIONS.ARTIKEL_ANLEGEN, label: "Artikel anlegen" },
        { key: PERMISSIONS.ARTIKEL_BEARBEITEN, label: "Artikel bearbeiten" },
        { key: PERMISSIONS.ARTIKEL_LOESCHEN, label: "Artikel löschen" },
        { key: PERMISSIONS.ARTIKEL_ANZEIGEN, label: "Artikel anzeigen" }
    ],
    Benutzer: [
        { key: PERMISSIONS.BENUTZER_LESEN, label: "Benutzer lesen" },
        { key: PERMISSIONS.BENUTZER_ANLEGEN, label: "Benutzer anlegen" },
        { key: PERMISSIONS.BENUTZER_BEARBEITEN, label: "Benutzer bearbeiten" },
        { key: PERMISSIONS.BENUTZER_LOESCHEN, label: "Benutzer löschen" },
        { key: PERMISSIONS.BENUTZER_ANZEIGEN, label: "Benutzer anzeigen" }
    ],
    Rollen: [
        { key: PERMISSIONS.ROLLEN_LESEN, label: "Rolle lesen" },
        { key: PERMISSIONS.ROLLEN_ANLEGEN, label: "Rolle anlegen" },
        { key: PERMISSIONS.ROLLEN_BEARBEITEN, label: "Rolle bearbeiten" },
        { key: PERMISSIONS.ROLLEN_LOESCHEN, label: "Rolle löschen" },
        { key: PERMISSIONS.ROLLEN_ANZEIGEN, label: "Rolle anzeigen" }
    ],
    Rechte: [
        { key: PERMISSIONS.RECHTE_LESEN, label: "Recht lesen" },
        { key: PERMISSIONS.RECHTE_ANLEGEN, label: "Recht anlegen" },
        { key: PERMISSIONS.RECHTE_BEARBEITEN, label: "Recht bearbeiten" },
        { key: PERMISSIONS.RECHTE_LOESCHEN, label: "Recht löschen" },
        { key: PERMISSIONS.RECHTE_ANZEIGEN, label: "Recht anzeigen" }
    ],
    Lager: [
        { key: PERMISSIONS.LAGER_LESEN, label: "Lager lesen" },
        { key: PERMISSIONS.LAGER_ANLEGEN, label: "Lager anlegen" },
        { key: PERMISSIONS.LAGER_BEARBEITEN, label: "Lager bearbeiten" },
        { key: PERMISSIONS.LAGER_LOESCHEN, label: "Lager löschen" },
        { key: PERMISSIONS.LAGER_ANZEIGEN, label: "Lager anzeigen" }
    ],
    Rechnungen: [
        { key: PERMISSIONS.RECHNUNG_LESEN, label: "Rechnung lesen" },
        { key: PERMISSIONS.RECHNUNG_ANLEGEN, label: "Rechnung anlegen" },
        { key: PERMISSIONS.RECHNUNG_BEARBEITEN, label: "Rechnung bearbeiten" },
        { key: PERMISSIONS.RECHNUNG_LOESCHEN, label: "Rechnung löschen" },
        { key: PERMISSIONS.RECHNUNG_ANZEIGEN, label: "Rechnung anzeigen" }
    ]
} as const;
