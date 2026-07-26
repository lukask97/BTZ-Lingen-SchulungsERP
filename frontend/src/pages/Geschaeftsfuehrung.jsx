import PlaceholderModule from "../components/PlaceholderModule";
import freigabenService from "../services/freigabenService";
import berichteService from "../services/berichteService";

export default function Geschaeftsfuehrung() {
    return <PlaceholderModule
        title="Geschäftsführung"
        intro="Diese Seite bündelt die vorbereiteten Führungsfunktionen für Freigaben, Berichte und bereichsübergreifende Kennzahlen."
        cards={[
            { label: "Offene Freigaben", value: freigabenService.list().filter(item => item.status === "offen").length },
            { label: "Berichte", value: berichteService.list().length },
            { label: "Fertige Berichte", value: berichteService.list().filter(item => item.status === "fertig").length }
        ]}
        nextSteps={["Dashboard auswerten", "Rabatte und Kooperationen freigeben", "Bereichsberichte prüfen", "Kennzahlen für Unterrichtsgespräche nutzen"]}
        links={[
            { to: "/freigaben", label: "Zu den Freigaben" },
            { to: "/berichte", label: "Zu den Berichten" }
        ]}
    />;
}
