import ModuleOverview from "../../components/ModuleOverview";
import angeboteService from "../../services/verkauf/angeboteService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import kundenService from "../../services/verkauf/customerService";
import reklamationenService from "../../services/verkauf/reklamationenService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";

export default function VerkaufOverview() {
    useDataSyncRefresh(["kunden", "kundenanfragen", "angebote", "auftraege", "reklamationen", "vertriebsdokumente"]);

    const kunden = kundenService.list();
    const anfragen = customerInquiryService.list();
    const angebote = angeboteService.list();
    const auftraege = auftraegeService.list();
    const reklamationen = reklamationenService.list();
    const dokumente = vertriebsdokumenteService.list();

    const offeneAnfragen = anfragen.filter(item => item.status === "offen").length;
    const offeneAngebote = angebote.filter(item => !["angenommen", "abgelehnt"].includes(String(item.status || "").toLowerCase())).length;
    const offeneAuftraege = auftraege.filter(item => item.status === "offen").length;
    const offeneReklamationen = reklamationen.filter(item => item.status === "neu").length;

    return <ModuleOverview
        title="Verkauf"
        intro="Modul für den didaktisch vereinfachten Vertriebsprozess. Schüler sollen vom ersten Kundenkontakt bis zu Auftrag, Versand und Dokumentenkette verstehen, wie ein Vorgang fachlich weitergeführt wird."
        cards={[
            { label: "Kunden", value: kunden.length, note: "Stammdaten" },
            { label: "Kundenanfragen", value: anfragen.length, note: `${offeneAnfragen} offen` },
            { label: "Angebote", value: angebote.length, note: `${offeneAngebote} offen` },
            { label: "Aufträge", value: auftraege.length, note: `${offeneAuftraege} offen` },
            { label: "Vertriebsdokumente", value: dokumente.length, note: "Dokumentenkette" },
            { label: "Reklamationen", value: reklamationen.length, note: `${offeneReklamationen} neu` },
        ]}
        panels={[
            {
                title: "Vertriebsprozess",
                badge: "Lernkette",
                items: [
                    "Kundenanfrage aufnehmen und sauber dokumentieren.",
                    "Passendes Angebot mit Positionen erstellen.",
                    "Nach dem Angebot erst auf die Antwort warten und Annahme oder Ablehnung festhalten.",
                    "Nur angenommene Angebote in einen Auftrag übernehmen.",
                    "Auftragsbestätigung, Lieferschein und Begleitpapiere ergänzen.",
                    "Bei Problemen Reklamationen oder Servicefälle weiterbearbeiten.",
                ],
            },
            {
                title: "Kalkulation und Dokumente",
                badge: "Übungsfokus",
                items: [
                    "Einkaufspreis, Aufschlag und Verkaufspreis nachvollziehen",
                    "Optional mit Rabatt, Skonto oder MwSt arbeiten",
                    "Auftragsbestätigung, Lieferschein, Warenbegleitpapier und Transportpapier nutzen",
                ],
                links: [
                    { to: "/vertriebsdokumente", label: "Vertriebsdokumente öffnen" },
                    { to: "/versand", label: "Versand öffnen" },
                ],
            },
        ]}
        links={[
            { to: "/kunden", label: "Kunden" },
            { to: "/kundenanfragen", label: "Kundenanfragen" },
            { to: "/angebote", label: "Angebote" },
            { to: "/auftraege", label: "Aufträge" },
            { to: "/vertriebsdokumente", label: "Vertriebsdokumente" },
            { to: "/reklamationen", label: "Reklamationen" },
        ]}
    />;
}
