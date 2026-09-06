import ModuleOverview from "../../components/ModuleOverview";
import auftraegeService from "../../services/verkauf/auftraegeService";
import berichteService from "../../services/gf/berichteService";
import bestellungenService from "../../services/einkauf/bestellungenService";
import freigabenService from "../../services/gf/freigabenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";

export default function Geschaeftsfuehrung() {
    useDataSyncRefresh(["freigaben", "berichte", "auftraege", "bestellungen", "zahlungen"]);

    const freigaben = freigabenService.list();
    const berichte = berichteService.list();
    const auftraege = auftraegeService.list();
    const bestellungen = bestellungenService.list();
    const rechnungen = rechnungenService.list();

    const offeneFreigaben = freigaben.filter(item => item.status === "offen").length;
    const fertigeBerichte = berichte.filter(item => item.status === "fertig").length;
    const offeneAuftraege = auftraege.filter(item => item.status === "offen").length;
    const offeneBestellungen = bestellungen.filter(item => item.status !== "eingegangen").length;
    const offeneRechnungen = rechnungen.filter(item => item.status === "offen").length;

    return <ModuleOverview
        title="Geschäftsführung"
        intro="Modul für Freigaben, Berichte und Unternehmenskennzahlen. Die Seite soll Lehrkräften und Schülern zeigen, wie bereichsübergreifende Entscheidungen auf vorhandenen Vorgängen beruhen."
        cards={[
            { label: "Offene Freigaben", value: offeneFreigaben, note: "Entscheidungen" },
            { label: "Berichte", value: berichte.length, note: `${fertigeBerichte} fertig` },
            { label: "Offene Aufträge", value: offeneAuftraege, note: "Vertrieb" },
            { label: "Offene Bestellungen", value: offeneBestellungen, note: "Einkauf" },
            { label: "Offene Rechnungen", value: offeneRechnungen, note: "Buchhaltung" },
        ]}
        panels={[
            {
                title: "Führungsaufgaben",
                badge: "Didaktischer Fokus",
                items: [
                    "Offene Freigaben prüfen und Entscheidungen begründen.",
                    "Berichte aus den Fachbereichen lesen und einordnen.",
                    "Kennzahlen aus Einkauf, Vertrieb und Buchhaltung gemeinsam betrachten.",
                    "Unterrichtsgespräche mit nachvollziehbaren Daten vorbereiten.",
                ],
            },
            {
                title: "Bereichsübergreifender Blick",
                badge: "Mockup-Zusammenhang",
                items: [
                    "Viele offene Aufträge beeinflussen Versand, Rechnungen und Freigaben.",
                    "Aktive Bestellungen oder Engpässe wirken auf Lager und Lieferfähigkeit.",
                    "Offene Rechnungen und Mahnungen sind Hinweise auf Zahlungs- oder Prozessprobleme.",
                ],
                links: [
                    { to: "/freigaben", label: "Freigaben öffnen" },
                    { to: "/berichte", label: "Berichte öffnen" },
                    { to: "/", label: "Zum Dashboard" },
                ],
            },
        ]}
        links={[
            { to: "/freigaben", label: "Freigaben" },
            { to: "/berichte", label: "Berichte" },
            { to: "/buchhaltung", label: "Buchhaltung" },
            { to: "/themen/verkauf", label: "Verkauf" },
            { to: "/themen/einkauf", label: "Einkauf" },
        ]}
    />;
}
