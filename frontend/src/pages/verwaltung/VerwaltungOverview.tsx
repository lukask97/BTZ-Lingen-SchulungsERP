import PlaceholderModule from "../../components/PlaceholderModule";
import benutzerService from "../../services/verwaltung/benutzerService";
import rollenService from "../../services/verwaltung/rollenService";

export default function VerwaltungOverview() {
    return <PlaceholderModule
        title="Verwaltung"
        intro="Kurze Übersicht über die administrativen Bereiche Benutzer, Rollen und Berechtigungssteuerung."
        cards={[
            { label: "Benutzer", value: benutzerService.list().length },
            { label: "Rollen", value: rollenService.list().length },
            { label: "Vergebene Rollen", value: rollenService.list().length }
        ]}
        nextSteps={["Benutzer verwalten", "Rollen pflegen", "Berechtigungen prüfen"]}
        links={[
            { to: "/benutzer", label: "Benutzer" },
            { to: "/rollen", label: "Rollen" },
            { to: "/rechte", label: "Rechte" }
        ]}
    />;
}
