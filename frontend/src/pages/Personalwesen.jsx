import PlaceholderModule from "../components/PlaceholderModule";
import arbeitszeitenService from "../services/arbeitszeitenService";
import bewerberService from "../services/bewerberService";
import mitarbeiterService from "../services/mitarbeiterService";
import schulungenService from "../services/schulungenService";
import urlaubsantraegeService from "../services/urlaubsantraegeService";

export default function Personalwesen() {
    return <PlaceholderModule
        title="Personalwesen"
        intro="Kompakte HR-Übersicht mit Bewerbern, Mitarbeitern, Zeitbuchungen, Urlaubsanträgen und Schulungen."
        cards={[
            { label: "Bewerber", value: bewerberService.list().length },
            { label: "Mitarbeiter", value: mitarbeiterService.list().length },
            { label: "Zeitbuchungen", value: arbeitszeitenService.list().length },
            { label: "Urlaubsanträge", value: urlaubsantraegeService.list().length },
            { label: "Schulungen", value: schulungenService.list().length }
        ]}
        nextSteps={["Bewerber verwalten", "Mitarbeiter verwalten", "Arbeitszeiten erfassen", "Urlaubsanträge verwalten", "Schulungen planen"]}
        links={[
            { to: "/bewerber", label: "Bewerber" },
            { to: "/mitarbeiter", label: "Mitarbeiter" },
            { to: "/arbeitszeiten", label: "Arbeitszeiten" },
            { to: "/urlaubsantraege", label: "Urlaubsanträge" },
            { to: "/schulungen", label: "Schulungen" }
        ]}
    />;
}
