import { ACCESS } from "./permissions";

export const NAVIGATION_GROUPS = [
    {
        key: "start",
        title: "Start",
        overviewPath: "/",
        access: null,
        items: [
            { title: "Dashboard", path: "/", access: null },
            { title: "Organisation", path: "/organisation", access: ACCESS.ORGANISATION },
            { title: "Glossar", path: "/glossar", access: null },
            { title: "Suche", path: "/suche", access: null }
        ]
    },
    {
        key: "lehrkraft",
        title: "Lehrkraft",
        overviewPath: "/lehrkraft",
        access: ACCESS.GESCHAEFTSFUEHRUNG,
        adminOnly: true,
        items: [
            { title: "Lehrkraft-Übersicht", path: "/lehrkraft", access: ACCESS.GESCHAEFTSFUEHRUNG },
            { title: "Kundenkorrespondenz", path: "/lehrkraft/kundenkorrespondenz", access: ACCESS.GESCHAEFTSFUEHRUNG },
            { title: "Lieferantenkorrespondenz", path: "/lehrkraft/lieferantenkorrespondenz", access: ACCESS.GESCHAEFTSFUEHRUNG },
            { title: "Lehrkraft-Optionen", path: "/lehrkraft/optionen", access: ACCESS.GESCHAEFTSFUEHRUNG }
        ]
    },
    {
        key: "einkauf",
        title: "Einkauf (EK)",
        overviewPath: "/themen/einkauf",
        access: ACCESS.EINKAUF,
        items: [
            { title: "Lieferanten", path: "/lieferanten", access: ACCESS.EINKAUF },
            { title: "Lieferantenvergleich", path: "/lieferantenvergleich", access: ACCESS.EINKAUF },
            { title: "Bestellungen", path: "/bestellungen", access: ACCESS.EINKAUF },
            { title: "Wareneingänge", path: "/wareneingaenge", access: ACCESS.LAGER }
        ]
    },
    {
        key: "verkauf",
        title: "Verkauf (VK)",
        overviewPath: "/themen/verkauf",
        access: ACCESS.VERKAUF,
        items: [
            { title: "Kunden", path: "/kunden", access: ACCESS.KUNDE },
            { title: "Kundenanfragen", path: "/kundenanfragen", access: ACCESS.VERKAUF },
            { title: "Angebote", path: "/angebote", access: ACCESS.VERKAUF },
            { title: "Aufträge", path: "/auftraege", access: ACCESS.VERKAUF },
            { title: "Services", path: "/services", access: ACCESS.SERVICE },
            { title: "Vertriebsdokumente", path: "/vertriebsdokumente", access: ACCESS.VERKAUF },
            { title: "Reklamationen", path: "/reklamationen", access: ACCESS.SERVICE }
        ]
    },
    {
        key: "marketing",
        title: "Marketing (MA)",
        overviewPath: "/marketing",
        access: ACCESS.MARKETING,
        items: [
            { title: "Marketing", path: "/marketing", access: ACCESS.MARKETING }
        ]
    },
    {
        key: "logistik",
        title: "Logistik (LOG)",
        overviewPath: "/logistik",
        access: ACCESS.LOGISTIK,
        items: [
            { title: "Logistik", path: "/logistik", access: ACCESS.LOGISTIK },
            { title: "Bestand", path: "/bestand", access: ACCESS.LAGER },
            { title: "Artikel", path: "/artikel", access: ACCESS.ARTIKEL },
            { title: "Kategorien", path: "/kategorien", access: ACCESS.ARTIKEL },
            { title: "Versand", path: "/versand", access: ACCESS.LOGISTIK },
            { title: "Retouren", path: "/retouren", access: ACCESS.LOGISTIK }
        ]
    },
    {
        key: "personalwesen",
        title: "Personalwesen (PW)",
        overviewPath: "/personalwesen",
        access: ACCESS.PERSONALWESEN,
        items: [
            { title: "Personalwesen", path: "/personalwesen", access: ACCESS.PERSONALWESEN },
            { title: "Bewerber", path: "/bewerber", access: ACCESS.PERSONALWESEN },
            { title: "Mitarbeiter", path: "/mitarbeiter", access: ACCESS.PERSONALWESEN },
            { title: "Personalakte", path: "/personalakte", access: ACCESS.PERSONALWESEN },
            { title: "Arbeitszeiten", path: "/arbeitszeiten", access: ACCESS.PERSONALWESEN },
            { title: "Urlaubsanträge", path: "/urlaubsantraege", access: ACCESS.PERSONALWESEN },
            { title: "Krankmeldungen", path: "/krankmeldungen", access: ACCESS.PERSONALWESEN },
            { title: "Schulungen", path: "/schulungen", access: ACCESS.PERSONALWESEN }
        ]
    },
    {
        key: "buchhaltung",
        title: "Buchhaltung (BuHa)",
        overviewPath: "/buchhaltung",
        access: ACCESS.BUCHHALTUNG,
        items: [
            { title: "Buchhaltung", path: "/buchhaltung", access: ACCESS.BUCHHALTUNG },
            { title: "ABC-Analyse", path: "/abc-analyse", access: ACCESS.BUCHHALTUNG },
            { title: "Ausgangsrechnungen", path: "/ausgangsrechnungen", access: ACCESS.RECHNUNG },
            { title: "Eingangsrechnungen", path: "/eingangsrechnungen", access: ACCESS.RECHNUNG },
            { title: "Bankauszug", path: "/bankauszug", access: ACCESS.BUCHHALTUNG },
            { title: "Firmenkonto", path: "/firmenkonto", access: ACCESS.BUCHHALTUNG },
            { title: "Mahnungen", path: "/mahnungen", access: ACCESS.BUCHHALTUNG },
            { title: "Belege", path: "/belege", access: ACCESS.BUCHHALTUNG }
        ]
    },
    {
        key: "gf",
        title: "Geschäftsführung (GF)",
        overviewPath: "/geschaeftsfuehrung",
        access: ACCESS.GESCHAEFTSFUEHRUNG,
        items: [
            { title: "Geschäftsführung", path: "/geschaeftsfuehrung", access: ACCESS.GESCHAEFTSFUEHRUNG },
            { title: "Berichte", path: "/berichte", access: ACCESS.GESCHAEFTSFUEHRUNG },
            { title: "Freigaben", path: "/freigaben", access: ACCESS.GESCHAEFTSFUEHRUNG }
        ]
    },
    {
        key: "admin",
        title: "Admin",
        overviewPath: "/admin",
        access: ACCESS.BENUTZER,
        items: [
            { title: "Admin", path: "/admin", access: ACCESS.BENUTZER },
            { title: "Benutzer", path: "/benutzer", access: ACCESS.BENUTZER },
            { title: "Rollen", path: "/rollen", access: ACCESS.ROLLEN },
            { title: "Rechte", path: "/rechte", access: ACCESS.RECHTE },
            { title: "Backup", path: "/admin/backup", access: ACCESS.BENUTZER }
        ]
    },
    {
        key: "verwaltung",
        title: "Verwaltung",
        overviewPath: "/themen/verwaltung",
        access: ACCESS.BENUTZER,
        items: [
            { title: "Unternehmen", path: "/unternehmen", access: ACCESS.BENUTZER },
            { title: "Benutzer", path: "/benutzer", access: ACCESS.BENUTZER },
            { title: "Nummernkreise", path: "/nummernkreise", access: ACCESS.BENUTZER },
            { title: "Exporte", path: "/exporte", access: ACCESS.BENUTZER },
            { title: "Optionen", path: "/optionen", access: ACCESS.BENUTZER },
            { title: "Rollen", path: "/rollen", access: ACCESS.ROLLEN }
        ]
    }
];

export const SCENARIO_MENU = [
    { title: "Regionale Bestellung", path: "/szenarien/regionale-bestellung", access: ACCESS.VERKAUF },
    { title: "Großbestellung", path: "/szenarien/grossbestellung", access: ACCESS.VERKAUF },
    { title: "Firmenauftrag", path: "/szenarien/firmenauftrag", access: ACCESS.VERKAUF },
    { title: "Eventbestellung", path: "/szenarien/eventbestellung", access: ACCESS.VERKAUF },
    { title: "Service", path: "/szenarien/service", access: ACCESS.SERVICE },
    { title: "Transportverzögerung", path: "/szenarien/transportverzoegerung", access: ACCESS.VERKAUF },
    { title: "Kooperation", path: "/szenarien/kooperation", access: ACCESS.MARKETING }
];

export const SCENARIO_OVERVIEW = {
    title: "Szenarien",
    path: "/themen/szenarien"
};
