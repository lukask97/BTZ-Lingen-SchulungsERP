import ScenarioPage from "../../components/ScenarioPage";

export default function Transportverzoegerung() {
    return <ScenarioPage
        title="Szenario: Transportverzögerung"
        intro="Die Fallakte muss über Kundenanfrage, Auftrag und Kommunikation gelöst werden."
        caseProfile={[
            { label: "Fachbereiche", value: "Auftrag, Kommunikation und Kundenbetreuung" },
            { label: "Bearbeitungsziel", value: "Verzögerung, Teilmenge und Kundeninformation im System dokumentieren" }
        ]}
        documentInfo={[
            { title: "Ausgangslage", text: "Ein Transport verzögert sich um einen Tag. Der Kunde Emsland Tourismus GmbH muss informiert werden; wenn möglich, soll eine Teilmenge vorab per Kurier angeboten werden." },
            { title: "Zusatzinfo", text: "Die Lehrkraft möchte sehen, dass die Verzögerung nicht nur im Auftrag, sondern auch als Kundenkommunikation dokumentiert wird." }
        ]}
        documentTemplates={[
            "Kommunikationsnotiz oder Kundenanfrage",
            "Auftragshinweis",
            "Vermerk zur Alternativlieferung"
        ]}
        tasks={[
            "Den betroffenen Auftrag identifizieren.",
            "Eine Kundenanfrage oder Kommunikationsnotiz zur Verzögerung anlegen.",
            "Die Alternativlieferung in der Beschreibung festhalten.",
            "Den Status der Kommunikation nach Bearbeitung prüfen."
        ]}
        teacherChecks={[
            "Ist die Kundenkommunikation getrennt vom Auftrag sichtbar",
            "Wurde die Verzögerung konkret benannt",
            "Ist die angebotene Alternativlieferung nachvollziehbar beschrieben"
        ]}
        completionChecks={[
            "Die Kundenanfrage ist erfasst.",
            "Verzögerung und Alternativlieferung sind dokumentiert.",
            "Die Kommunikation ist für die Lehrkraft nachvollziehbar sichtbar."
        ]}
        targetPages={[
            { to: "/kundenanfragen", label: "Kundenanfragen" },
            { to: "/auftraege", label: "Aufträge" }
        ]}
    />;
}
