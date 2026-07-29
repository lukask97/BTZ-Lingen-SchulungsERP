import ScenarioPage from "../../components/ScenarioPage";

export default function Eventbestellung() {
    return <ScenarioPage
        title="Szenario: Eventbestellung"
        intro="Diese Fallakte fokussiert einen Sonderauftrag mit zusätzlicher Koordination und Dokumentation."
        caseProfile={[
            { label: "Fachbereiche", value: "Verkauf, Eventbezug und Dokumentation" },
            { label: "Bearbeitungsziel", value: "Sonderauftrag mit Koordinationshinweisen im System sichtbar machen" }
        ]}
        documentInfo={[
            { title: "Ausgangslage", text: "Die Eventmobil OHG benötigt für die Mobilitätstage Lingen drei Eventpakete. Das Lieferfenster muss mit der Eventleitung abgestimmt werden." },
            { title: "Zusatzinfo", text: "Zusätzlich soll die Lehrkraft nachvollziehen können, dass der Sondercharakter des Auftrags dokumentiert wurde." }
        ]}
        documentTemplates={[
            "Angebot oder Auftrag",
            "Eventnotiz",
            "Optional: Beleg oder Abstimmungsvermerk"
        ]}
        tasks={[
            "Kundendaten prüfen oder ergänzen.",
            "Ein Angebot oder direkt einen Auftrag für drei Eventpakete erfassen.",
            "Die Koordination mit der Eventleitung schriftlich festhalten.",
            "Optional einen Beleg oder eine Notiz zur Eventabstimmung archivieren."
        ]}
        teacherChecks={[
            "Ist die Menge von drei Eventpaketen richtig erfasst?",
            "Wird das Lieferfenster oder die Eventabstimmung schriftlich sichtbar?",
            "Ist erkennbar, dass es sich nicht um einen normalen Standardauftrag handelt?"
        ]}
        completionChecks={[
            "Der Auftrag oder das Angebot ist vorhanden.",
            "Die Menge von drei Eventpaketen stimmt.",
            "Die Koordinationsinformation ist in der Anwendung sichtbar."
        ]}
        targetPages={[
            { to: "/kunden", label: "Kunden" },
            { to: "/angebote", label: "Angebote" },
            { to: "/auftraege", label: "Aufträge" },
            { to: "/belege", label: "Belege" }
        ]}
    />;
}
