import PlaceholderModule from "../../components/PlaceholderModule";
import benutzerService from "../../services/verwaltung/benutzerService";
import fristenOptionenService from "../../services/verwaltung/fristenOptionenService";
import nummernkreiseService from "../../services/verwaltung/nummernkreiseService";
import rollenService from "../../services/verwaltung/rollenService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";

export default function VerwaltungOverview() {
    useStorageSyncRefresh(["benutzer", "rollen", "nummernkreise", "fristenOptionen"]);

    return <PlaceholderModule
        title="Verwaltung"
        intro="Kurze Uebersicht ueber Unternehmensdaten, Dokumentnummern und zentrale Optionen. Benutzer, Rollen und Backups liegen jetzt im eigenen Admin-Bereich."
        cards={[
            { label: "Nummernkreise", value: nummernkreiseService.list().length },
            { label: "Skonto", value: `${fristenOptionenService.get().skontoProzent} % / ${fristenOptionenService.get().skontoTage} Tage` },
            { label: "Benutzer", value: benutzerService.list().length },
            { label: "Rollen", value: rollenService.list().length }
        ]}
        nextSteps={["Unternehmen pflegen", "Dokumentkuerzel anpassen", "Fristen steuern", "Zum Admin-Bereich fuer Benutzer und Backup wechseln"]}
        links={[
            { to: "/unternehmen", label: "Unternehmen" },
            { to: "/nummernkreise", label: "Nummernkreise" },
            { to: "/exporte", label: "Exporte" },
            { to: "/optionen", label: "Optionen" },
            { to: "/admin", label: "Admin" }
        ]}
    />;
}
