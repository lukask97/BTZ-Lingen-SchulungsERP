import ScenarioPage from "../../components/ScenarioPage";

export default function Kooperation() {
    return <ScenarioPage
        title="Szenario: Kooperation"
        intro="Diese Fallakte verbindet Marketingplanung mit einer nötigen Freigabe."
        caseProfile={[
            { label: "Fachbereiche", value: "Marketing, Geschäftsführung und Kooperation" },
            { label: "Bearbeitungsziel", value: "Aktion vorbereiten und eine passende Freigabe begründet anlegen" }
        ]}
        documentInfo={[
            { title: "Ausgangslage", text: "Die Stadtwerke Lingen möchten gemeinsam mit dem Unternehmen einen Testfahrtag organisieren. Geplant sind Leasingrad-Rabatte und Servicegutscheine." },
            { title: "Zusatzinfo", text: "Die Lehrkraft erwartet, dass sowohl die Marketingaktion als auch die nötige Freigabe sichtbar im System vorbereitet werden." }
        ]}
        documentTemplates={[
            "Marketingaktion",
            "Kooperationsbeschreibung",
            "Freigabeantrag"
        ]}
        tasks={[
            "Eine passende Marketingaktion anlegen.",
            "Das gemeinsame Angebot in der Beschreibung dokumentieren.",
            "Eine Freigabe für die Geschäftsführung vorbereiten.",
            "Den Zusammenhang zwischen Aktion und Freigabe klar benennen."
        ]}
        teacherChecks={[
            "Wird der Partner Stadtwerke Lingen in der Aktion sichtbar genannt?",
            "Ist die Freigabe nicht allgemein, sondern klar auf diese Maßnahme bezogen?",
            "Lassen sich Aktion und Freigabe inhaltlich miteinander verbinden?"
        ]}
        completionChecks={[
            "Eine Marketingaktion zur Kooperation ist vorhanden.",
            "Eine passende Freigabe wurde erfasst.",
            "Partner und Angebotsidee sind in beiden Bereichen nachvollziehbar."
        ]}
        targetPages={[
            { to: "/marketing", label: "Marketing" },
            { to: "/freigaben", label: "Freigaben" }
        ]}
    />;
}
