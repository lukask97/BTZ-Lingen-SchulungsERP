import ModuleOverview from "../../components/ModuleOverview";
import arbeitszeitenService from "../../services/personalwesen/arbeitszeitenService";
import bewerberService from "../../services/personalwesen/bewerberService";
import krankmeldungenService from "../../services/personalwesen/krankmeldungenService";
import mitarbeiterService from "../../services/personalwesen/mitarbeiterService";
import personalaktenService from "../../services/personalwesen/personalaktenService";
import schulungenService from "../../services/personalwesen/schulungenService";
import urlaubsantraegeService from "../../services/personalwesen/urlaubsantraegeService";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";

export default function Personalwesen() {
    useDataSyncRefresh([
        "bewerber", "mitarbeiter", "arbeitszeiten", "urlaubsantraege",
        "krankmeldungen", "schulungen", "personalakten"
    ]);

    const bewerber = bewerberService.list();
    const mitarbeiter = mitarbeiterService.list();
    const arbeitszeiten = arbeitszeitenService.list();
    const urlaubsantraege = urlaubsantraegeService.list();
    const krankmeldungen = krankmeldungenService.list();
    const schulungen = schulungenService.list();
    const akten = personalaktenService.list();

    const offeneUrlaubsantraege = urlaubsantraege.filter(item => item.status === "offen").length;
    const offeneKrankmeldungen = krankmeldungen.filter(item => item.status !== "abgeschlossen").length;
    const offeneZeitbuchungen = arbeitszeiten.filter(item => item.status === "erfasst").length;
    const offeneAkte = akten.filter(item => item.status === "offen").length;

    return <ModuleOverview
        title="Personalwesen"
        intro="Modul für Personalprozesse, Aktenführung und Formulare. Die Seite dient als Einstieg in typische HR-Abläufe, die Schüler nachvollziehen und dokumentieren sollen."
        cards={[
            { label: "Bewerber", value: bewerber.length, note: "Personalgewinnung" },
            { label: "Mitarbeiter", value: mitarbeiter.length, note: "Stammdaten" },
            { label: "Personalakten", value: akten.length, note: `${offeneAkte} offen` },
            { label: "Urlaubsanträge", value: urlaubsantraege.length, note: `${offeneUrlaubsantraege} offen` },
            { label: "Krankmeldungen", value: krankmeldungen.length, note: `${offeneKrankmeldungen} aktiv` },
            { label: "Arbeitszeiten", value: arbeitszeiten.length, note: `${offeneZeitbuchungen} zu prüfen` },
            { label: "Schulungen", value: schulungen.length, note: "Weiterbildung" },
        ]}
        panels={[
            {
                title: "Personalprozess",
                badge: "Didaktischer Ablauf",
                items: [
                    "Bewerberdaten aufnehmen und einer Stelle zuordnen.",
                    "Mitarbeiter anlegen und Rolle oder Abteilung festhalten.",
                    "Unterlagen in der Personalakte dokumentieren.",
                    "Urlaubsanträge, Krankmeldungen oder Onboarding-Unterlagen sauber verwalten.",
                    "Arbeitszeiten und Schulungen als laufende Personaldokumentation ergänzen.",
                ],
            },
            {
                title: "Dokumente und Formulare",
                badge: "Übungsfokus",
                items: [
                    "Vertragsunterlagen und Personalnotizen",
                    "Urlaubsanträge und Krankmeldungen",
                    "Abmahnungen nur simulativ und fiktiv",
                    "Onboarding-Checklisten und Schulungsnachweise",
                ],
                links: [
                    { to: "/personalakte", label: "Personalakte öffnen" },
                    { to: "/urlaubsantraege", label: "Urlaubsanträge bearbeiten" },
                    { to: "/krankmeldungen", label: "Krankmeldungen bearbeiten" },
                    { to: "/schulungen", label: "Schulungen planen" },
                ],
            },
        ]}
        links={[
            { to: "/bewerber", label: "Bewerber" },
            { to: "/mitarbeiter", label: "Mitarbeiter" },
            { to: "/personalakte", label: "Personalakte" },
            { to: "/arbeitszeiten", label: "Arbeitszeiten" },
            { to: "/urlaubsantraege", label: "Urlaubsanträge" },
            { to: "/krankmeldungen", label: "Krankmeldungen" },
            { to: "/schulungen", label: "Schulungen" },
        ]}
    />;
}
