export const NAVIGATION_GROUPS = [
    {
        key: "start",
        title: "Start",
        overviewPath: "/",
        access: null,
        items: [
            { title: "Dashboard", path: "/", access: null },
            { title: "Organisation", path: "/organisation", access: "organisation" }
        ]
    },
    {
        key: "einkauf",
        title: "Einkauf (EK)",
        overviewPath: "/themen/einkauf",
        access: "einkauf",
        items: [
            { title: "Lieferanten", path: "/lieferanten", access: "einkauf" },
            { title: "Lieferantenvergleich", path: "/lieferantenvergleich", access: "einkauf" },
            { title: "Bestellungen", path: "/bestellungen", access: "einkauf" },
            { title: "Einkaufsdokumente", path: "/einkaufsdokumente", access: "einkauf" },
            { title: "Wareneingänge", path: "/wareneingaenge", access: "lager" },
            { title: "Lager", path: "/lager", access: "lager" }
        ]
    },
    {
        key: "verkauf",
        title: "Verkauf (VK)",
        overviewPath: "/themen/verkauf",
        access: "verkauf",
        items: [
            { title: "Kunden", path: "/kunden", access: "kunde" },
            { title: "Kundenanfragen", path: "/kundenanfragen", access: "verkauf" },
            { title: "Angebote", path: "/angebote", access: "verkauf" },
            { title: "Aufträge", path: "/auftraege", access: "verkauf" },
            { title: "Services", path: "/services", access: "service" },
            { title: "Vertriebsdokumente", path: "/vertriebsdokumente", access: "verkauf" },
            { title: "Reklamationen", path: "/reklamationen", access: "service" }
        ]
    },
    {
        key: "marketing",
        title: "Marketing (MA)",
        overviewPath: "/marketing",
        access: "marketing",
        items: [
            { title: "Marketing", path: "/marketing", access: "marketing" }
        ]
    },
    {
        key: "logistik",
        title: "Logistik (LOG)",
        overviewPath: "/logistik",
        access: "logistik",
        items: [
            { title: "Logistik", path: "/logistik", access: "logistik" },
            { title: "Artikel", path: "/artikel", access: "artikel" },
            { title: "Versand", path: "/versand", access: "logistik" },
            { title: "Retouren", path: "/retouren", access: "logistik" }
        ]
    },
    {
        key: "personalwesen",
        title: "Personalwesen (PW)",
        overviewPath: "/personalwesen",
        access: "personalwesen",
        items: [
            { title: "Personalwesen", path: "/personalwesen", access: "personalwesen" },
            { title: "Bewerber", path: "/bewerber", access: "personalwesen" },
            { title: "Mitarbeiter", path: "/mitarbeiter", access: "personalwesen" },
            { title: "Personalakte", path: "/personalakte", access: "personalwesen" },
            { title: "Arbeitszeiten", path: "/arbeitszeiten", access: "personalwesen" },
            { title: "Urlaubsanträge", path: "/urlaubsantraege", access: "personalwesen" },
            { title: "Krankmeldungen", path: "/krankmeldungen", access: "personalwesen" },
            { title: "Schulungen", path: "/schulungen", access: "personalwesen" }
        ]
    },
    {
        key: "buchhaltung",
        title: "Buchhaltung (BuHa)",
        overviewPath: "/buchhaltung",
        access: "buchhaltung",
        items: [
            { title: "Buchhaltung", path: "/buchhaltung", access: "buchhaltung" },
            { title: "Firmenkonto", path: "/firmenkonto", access: "buchhaltung" },
            { title: "Rechnungen", path: "/rechnungen", access: "rechnung" },
            { title: "Zahlungen", path: "/zahlungen", access: "buchhaltung" },
            { title: "Mahnungen", path: "/mahnungen", access: "buchhaltung" },
            { title: "Belege", path: "/belege", access: "buchhaltung" }
        ]
    },
    {
        key: "gf",
        title: "Geschäftsführung (GF)",
        overviewPath: "/geschaeftsfuehrung",
        access: "gf",
        items: [
            { title: "Geschäftsführung", path: "/geschaeftsfuehrung", access: "gf" },
            { title: "Berichte", path: "/berichte", access: "gf" },
            { title: "Freigaben", path: "/freigaben", access: "gf" }
        ]
    },
    {
        key: "verwaltung",
        title: "Verwaltung",
        overviewPath: "/themen/verwaltung",
        access: "benutzer",
        items: [
            { title: "Benutzer", path: "/benutzer", access: "benutzer" },
            { title: "Rollen", path: "/rollen", access: "rollen" }
        ]
    }
];

export const SCENARIO_MENU = [
    { title: "Regionale Bestellung", path: "/szenarien/regionale-bestellung", access: "verkauf" },
    { title: "Großbestellung", path: "/szenarien/grossbestellung", access: "verkauf" },
    { title: "Firmenauftrag", path: "/szenarien/firmenauftrag", access: "verkauf" },
    { title: "Eventbestellung", path: "/szenarien/eventbestellung", access: "verkauf" },
    { title: "Service", path: "/szenarien/service", access: "service" },
    { title: "Transportverzögerung", path: "/szenarien/transportverzoegerung", access: "verkauf" },
    { title: "Kooperation", path: "/szenarien/kooperation", access: "marketing" }
];

export const SCENARIO_OVERVIEW = {
    title: "Szenarien",
    path: "/themen/szenarien"
};
