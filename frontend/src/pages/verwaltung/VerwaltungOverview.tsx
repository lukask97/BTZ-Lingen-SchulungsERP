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
        intro="Kurze Übersicht über die administrativen Bereiche Benutzer, Rollen, Berechtigungen, Dokumentnummern und zentrale Optionen."
        cards={[
            { label: "Benutzer", value: benutzerService.list().length },
            { label: "Rollen", value: rollenService.list().length },
            { label: "Nummernkreise", value: nummernkreiseService.list().length },
            { label: "Skonto", value: `${fristenOptionenService.get().skontoProzent} % / ${fristenOptionenService.get().skontoTage} Tage` }
        ]}
        nextSteps={["Benutzer verwalten", "Rollen pflegen", "Berechtigungen prüfen", "Dokumentkuerzel anpassen", "Fristen steuern"]}
        links={[
            { to: "/benutzer", label: "Benutzer" },
            { to: "/rollen", label: "Rollen" },
            { to: "/rechte", label: "Rechte" },
            { to: "/nummernkreise", label: "Nummernkreise" },
            { to: "/exporte", label: "Exporte" },
            { to: "/optionen", label: "Optionen" }
        ]}
    />;
}
