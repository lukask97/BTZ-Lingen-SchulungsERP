import ScenarioPage from "../../components/ScenarioPage";

export default function Kooperation() {
    return <ScenarioPage
        title="Szenario: Kooperation"
        intro="Diese Fallakte verbindet Marketingplanung mit einer nötigen Freigabe."
        documentInfo={[
            { title: "Ausgangslage", text: "Die Stadtwerke Lingen möchten gemeinsam mit dem Unternehmen einen Testfahrtag organisieren. Geplant sind Leasingrad-Rabatte und Servicegutscheine." },
            { title: "Zusatzinfo", text: "Die Lehrkraft erwartet, dass sowohl die Marketingaktion als auch die nötige Freigabe sichtbar im System vorbereitet werden." }
        ]}
        tasks={[
            "Eine passende Marketingaktion anlegen.",
            "Das gemeinsame Angebot in der Beschreibung dokumentieren.",
            "Eine Freigabe für die Geschäftsführung vorbereiten.",
            "Den Zusammenhang zwischen Aktion und Freigabe klar benennen."
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
