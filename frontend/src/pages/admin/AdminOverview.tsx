import PlaceholderModule from "../../components/PlaceholderModule";
import benutzerService from "../../services/verwaltung/benutzerService";
import rollenService from "../../services/verwaltung/rollenService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";

export default function AdminOverview() {
    useStorageSyncRefresh(["benutzer", "rollen", "rechte"]);

    return <PlaceholderModule
        title="Admin"
        intro="Zentrale Administration fuer Benutzer, Rollen, Rechte und Datensicherungen."
        cards={[
            { label: "Benutzer", value: benutzerService.list().length },
            { label: "Rollen", value: rollenService.list().length },
            { label: "Backups", value: "JSON-Export" }
        ]}
        nextSteps={["Benutzer pflegen", "Rollen und Rechte pruefen", "Backup erstellen", "Backup bei Bedarf wiederherstellen"]}
        links={[
            { to: "/admin/benutzer", label: "Benutzer" },
            { to: "/admin/rollen", label: "Rollen" },
            { to: "/admin/rechte", label: "Rechte" },
            { to: "/admin/backup", label: "Backup" }
        ]}
    />;
}
