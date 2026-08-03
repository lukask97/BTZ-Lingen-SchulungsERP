import PlaceholderModule from "../../components/PlaceholderModule";
import benutzerService from "../../services/verwaltung/benutzerService";
import nummernkreiseService from "../../services/verwaltung/nummernkreiseService";
import rollenService from "../../services/verwaltung/rollenService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";

export default function VerwaltungOverview() {
    useStorageSyncRefresh(["benutzer", "rollen", "nummernkreise"]);

    return <PlaceholderModule
        title="Verwaltung"
        intro="Kurze Übersicht über die administrativen Bereiche Benutzer, Rollen, Berechtigungen und Dokumentnummern."
        cards={[
            { label: "Benutzer", value: benutzerService.list().length },
            { label: "Rollen", value: rollenService.list().length },
            { label: "Nummernkreise", value: nummernkreiseService.list().length }
        ]}
        nextSteps={["Benutzer verwalten", "Rollen pflegen", "Berechtigungen prüfen", "Dokumentkuerzel anpassen"]}
        links={[
            { to: "/benutzer", label: "Benutzer" },
            { to: "/rollen", label: "Rollen" },
            { to: "/rechte", label: "Rechte" },
            { to: "/nummernkreise", label: "Nummernkreise" }
        ]}
    />;
}
