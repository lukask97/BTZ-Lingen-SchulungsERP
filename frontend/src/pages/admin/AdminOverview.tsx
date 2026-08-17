import PlaceholderModule from "../../components/PlaceholderModule";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";
import benutzerService from "../../services/verwaltung/benutzerService";
import rollenService from "../../services/verwaltung/rollenService";
import rechteService from "../../services/verwaltung/rechteService";

export default function AdminOverview() {
    useStorageSyncRefresh(["benutzer", "rollen", "rechte"]);

    return <PlaceholderModule
        title="Admin"
        intro="Zentrale Administration für Benutzer, Rollen und Rechte."
        cards={[
            { label: "Benutzer", value: benutzerService.list().length },
            { label: "Rollen", value: rollenService.list().length },
            { label: "Rechte", value: rechteService.list().length }
        ]}
        nextSteps={["Benutzer pflegen", "Rollen prüfen", "Rechte zuordnen"]}
        links={[
            { to: "/benutzer", label: "Benutzer" },
            { to: "/rollen", label: "Rollen" },
            { to: "/rechte", label: "Rechte" },
            { to: "/admin/backup", label: "Backup" }
        ]}
    />;
}
