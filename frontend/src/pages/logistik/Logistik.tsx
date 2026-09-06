import ModuleOverview from "../../components/ModuleOverview";
import artikelService from "../../services/logistik/artikelService";
import bestellungenService from "../../services/einkauf/bestellungenService";
import retourenService from "../../services/logistik/retourenService";
import versandService from "../../services/logistik/versandService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import { getOpenGoodsReceiptOrders, getOrdersWithoutShipment } from "../../utils/processFlow";

export default function Logistik() {
    useDataSyncRefresh(["artikel", "bestellungen", "versandauftraege", "retouren", "auftraege"]);

    const artikel = artikelService.list();
    const bestellungen = bestellungenService.list();
    const versandauftraege = versandService.list();
    const retouren = retourenService.list();
    const auftraege = auftraegeService.list();
    const vertriebsdokumente = vertriebsdokumenteService.list();

    const niedrigeBestaende = artikel.filter(item => Number(item.bestand) < 10).length;
    const offeneWareneingaenge = getOpenGoodsReceiptOrders(bestellungen).length;
    const vorbereiteteSendungen = versandauftraege.filter(item => item.status === "in Vorbereitung").length;
    const offeneRetouren = retouren.filter(item => item.status !== "abgeschlossen").length;
    const offeneAuftraegeOhneVersand = getOrdersWithoutShipment(auftraege, vertriebsdokumente, versandauftraege).length;

    return <ModuleOverview
        title="Logistik"
        intro="Modul für Lager-Bestand, Wareneingang, Versand und Retouren. Die Seite macht sichtbar, wie Material- und Warenbewegungen zwischen Einkauf, Lager und Vertrieb zusammenhängen."
        cards={[
            { label: "Niedrige Bestände", value: niedrigeBestaende, note: "Lager-Bestand beobachten" },
            { label: "Offene Wareneingänge", value: offeneWareneingaenge, note: "Einkauf abschließen" },
            { label: "Versandaufträge", value: versandauftraege.length, note: `${vorbereiteteSendungen} in Vorbereitung` },
            { label: "Aufträge ohne Versand", value: offeneAuftraegeOhneVersand, note: "Vertrieb übergeben" },
            { label: "Retouren", value: retouren.length, note: `${offeneRetouren} offen` },
        ]}
        panels={[
            {
                title: "Logistikkette",
                badge: "Lernkette",
                items: [
                    "Wareneingänge aus dem Einkauf prüfen und buchen.",
                    "Bestände beobachten und Engpässe erkennen.",
                    "Für Aufträge reservierte Mengen mitdenken.",
                    "Versandaufträge aus dem Verkauf vorbereiten und abschließen.",
                    "Retouren dokumentieren und als Folgeprozess sauber beenden.",
                ],
            },
            {
                title: "Zusammenhänge",
                badge: "Bereichsübergreifend",
                items: [
                    "Versendete Bestellungen wirken direkt auf Wareneingänge und Bestände.",
                    "Offene Aufträge führen zu Versandaufträgen im Logistikbereich.",
                    "Für Aufträge reservierte Mengen senken den Bestand bereits vor dem Versand.",
                    "Retouren können Service, Reklamation und Ersatzlieferung auslösen.",
                ],
                links: [
                    { to: "/bestand", label: "Lager-Bestand öffnen" },
                    { to: "/kategorien", label: "Kategorien öffnen" },
                    { to: "/wareneingaenge", label: "Wareneingänge öffnen" },
                    { to: "/versand", label: "Versand öffnen" },
                ],
            },
        ]}
        links={[
            { to: "/bestand", label: "Lager-Bestand" },
            { to: "/artikel", label: "Artikel" },
            { to: "/kategorien", label: "Kategorien" },
            { to: "/wareneingaenge", label: "Wareneingänge" },
            { to: "/versand", label: "Versand" },
            { to: "/retouren", label: "Retouren" },
        ]}
    />;
}
