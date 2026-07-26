import PlaceholderModule from "../components/PlaceholderModule";
import bestellungenService from "../services/bestellungenService";
import lieferantenService from "../services/lieferantenService";

export default function EinkaufOverview() {
    const lieferanten = lieferantenService.list();
    const bestellungen = bestellungenService.list();
    const offene = bestellungen.filter(item => item.status === "offen").length;
    const bewertete = lieferanten.filter(item => Number(item.bewertung || 0) > 0).length;

    return <PlaceholderModule
        title="Einkauf"
        intro="Kurze Übersicht über den Einkaufsbereich mit Lieferanten, Bestellungen, Wareneingängen und Lagerbezug."
        cards={[
            { label: "Lieferanten", value: lieferanten.length },
            { label: "Bestellungen", value: bestellungen.length },
            { label: "Offene Bestellungen", value: offene },
            { label: "Bewertete Lieferanten", value: bewertete }
        ]}
        nextSteps={["Lieferanten verwalten", "Lieferanten vergleichen", "Bestellungen erstellen", "Wareneingänge erfassen", "Lagerbestand im Blick behalten"]}
        links={[
            { to: "/lieferanten", label: "Lieferanten" },
            { to: "/lieferantenvergleich", label: "Lieferantenvergleich" },
            { to: "/bestellungen", label: "Bestellungen" },
            { to: "/wareneingaenge", label: "Wareneingänge" },
            { to: "/lager", label: "Lager" },
            { to: "/artikel", label: "Artikelbestand" }
        ]}
    />;
}
