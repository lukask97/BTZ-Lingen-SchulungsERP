import ModuleOverview from "../../components/ModuleOverview";
import artikelService from "../../services/logistik/artikelService";
import bestellungenService from "../../services/einkauf/bestellungenService";
import lieferantenService from "../../services/einkauf/lieferantenService";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";
import { getOpenGoodsReceiptOrders, getPurchaseOrdersByStatus } from "../../utils/processFlow";

export default function EinkaufOverview() {
    useDataSyncRefresh(["lieferanten", "bestellungen", "artikel"]);

    const lieferanten = lieferantenService.list();
    const bestellungen = bestellungenService.list();
    const artikel = artikelService.list();

    const offeneAnfragen = getPurchaseOrdersByStatus(bestellungen, "angefragt").length;
    const freigegebeneBestellungen = getPurchaseOrdersByStatus(bestellungen, "bestaetigt").length;
    const versendeteBestellungen = getOpenGoodsReceiptOrders(bestellungen).length;
    const bewerteteLieferanten = lieferanten.filter(item => Number(item.bewertung || 0) > 0).length;
    const kritischeBestaende = artikel.filter(item => Number(item.bestand) < 10).length;
    const eingegangeneBestellungen = bestellungen.filter(item => item.status === "eingegangen").length;

    return <ModuleOverview
        title="Einkauf"
        intro="Der Einkauf bleibt bewusst einfach: Die Schülerfirma erfasst Artikelnummern und benötigte Mengen in einer Anfrage. Dabei kann zwischen Bedarfsmeldung und Lieferantenkonditionen unterschieden werden. Die Lehrkraft erstellt darauf aufbauend ein Angebot, bestätigt die Bestellung und markiert sie anschließend als versendet."
        cards={[
            { label: "Lieferanten", value: lieferanten.length, note: `${bewerteteLieferanten} bewertet` },
            { label: "Bestellanforderungen offen", value: offeneAnfragen, note: `${freigegebeneBestellungen} freigegeben` },
            { label: "Versand / Wareneingang", value: versendeteBestellungen, note: `${eingegangeneBestellungen} gebucht` },
            { label: "Kritische Bestände", value: kritischeBestaende, note: "Bedarfsmeldung möglich" },
        ]}
        panels={[
            {
                title: "Einfache Reihenfolge",
                badge: "Ablauf",
                items: [
                    "Artikelbedarf feststellen oder Lieferantenkonditionen auswerten.",
                    "Bestellanforderung mit Artikelnummer und benötigter Menge anlegen.",
                    "Lehrkraft prüft und gibt die Bestellung anschließend frei.",
                    "Wareneingang buchen und Lager-Bestand automatisch erhöhen.",
                    "Danach erscheint die Eingangsrechnung in der Buchhaltung.",
                ],
            },
            {
                title: "Lehrkraft im Prozess",
                badge: "Externe Seite",
                description: "Die Lehrkraft ist der Gegenpart zum Einkauf. Sie sieht die Artikelnummern aus der Anfrage, erstellt darauf ein Angebot und bestätigt die Bestellung erst danach.",
                items: [
                    `${offeneAnfragen} Bestellanforderungen warten noch auf Prüfung und Freigabe.`,
                    `${freigegebeneBestellungen} freigegebene Bestellungen können versendet werden.`,
                    `${versendeteBestellungen} versendete Bestellungen warten auf Wareneingang.`,
                ],
                links: [
                    { to: "/lehrkraft/lieferantenkorrespondenz", label: "Lieferantenkorrespondenz öffnen" },
                    { to: "/wareneingaenge", label: "Wareneingänge öffnen" },
                ],
            },
        ]}
        links={[
            { to: "/lieferanten", label: "Lieferanten" },
            { to: "/lieferantenkonditionen", label: "Lieferantenkonditionen" },
            { to: "/bestellungen", label: "Bestellungen" },
            { to: "/wareneingaenge", label: "Wareneingänge" },
            { to: "/lager", label: "Lager" },
        ]}
    />;
}
