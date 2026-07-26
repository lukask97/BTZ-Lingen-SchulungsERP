import PlaceholderModule from "../components/PlaceholderModule";
import artikelService from "../services/artikelService";
import bestellungenService from "../services/bestellungenService";
import retourenService from "../services/retourenService";
import versandService from "../services/versandService";

export default function Logistik() {
    return <PlaceholderModule
        title="Logistik"
        intro="Übersicht über Lager, Versand, Retouren und logistische Kennzahlen für die Präsentation des Mockups."
        cards={[
            { label: "Niedrige Bestände", value: artikelService.list().filter(item => Number(item.bestand) < 10).length },
            { label: "Offene Wareneingänge", value: bestellungenService.list().filter(item => item.status === "offen").length },
            { label: "Versandaufträge", value: versandService.list().length },
            { label: "Retouren", value: retourenService.list().length }
        ]}
        nextSteps={["Lagerbestand verwalten", "Wareneingänge prüfen", "Versand vorbereiten", "Retouren bearbeiten", "Lagerkennzahlen anzeigen"]}
        links={[
            { to: "/lager", label: "Zum Lager" },
            { to: "/wareneingaenge", label: "Zu den Wareneingängen" },
            { to: "/versand", label: "Zum Versand" },
            { to: "/retouren", label: "Zu den Retouren" }
        ]}
    />;
}
