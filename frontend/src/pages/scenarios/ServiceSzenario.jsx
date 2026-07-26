import ScenarioPage from "../../components/ScenarioPage";

export default function ServiceSzenario() {
    return <ScenarioPage
        title="Szenario: Service"
        intro="Hier soll ein Servicefall anhand einer Fallakte gelöst werden."
        documentInfo={[
            { title: "Ausgangslage", text: "Ein Kunde meldet, dass ein gelieferter Helm einen Materialfehler aufweist. Zusätzlich soll geprüft werden, ob weitere Teile der Lieferung betroffen sein könnten." },
            { title: "Zusatzinfo", text: "Die Lehrkraft erwartet eine Reklamation mit klarer Beschreibung und die Planung einer Ersatzlieferung." }
        ]}
        tasks={[
            "Den betroffenen Kunden zuordnen.",
            "Eine neue Reklamation mit präziser Problembeschreibung erfassen.",
            "Die Ersatzlieferung planen.",
            "Falls sinnvoll, den Prüfhinweis für den Rest der Lieferung dokumentieren."
        ]}
        completionChecks={[
            "Eine Reklamation ist angelegt.",
            "Der Status wurde auf Ersatzlieferung geplant gesetzt.",
            "Problem und Folgeaktion sind nachvollziehbar beschrieben."
        ]}
        targetPages={[
            { to: "/kunden", label: "Kunden" },
            { to: "/reklamationen", label: "Reklamationen" }
        ]}
    />;
}
