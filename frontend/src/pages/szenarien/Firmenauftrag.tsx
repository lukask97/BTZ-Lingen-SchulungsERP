import ScenarioPage from "../../components/ScenarioPage";

export default function Firmenauftrag() {
    return <ScenarioPage
        title="Szenario: Firmenauftrag"
        intro="Die Fallakte soll in einen nachvollziehbaren Firmenauftrag überführt werden."
        caseProfile={[
            { label: "Fachbereiche", value: "Verkauf, Auftrag und Servicebezug" },
            { label: "Bearbeitungsziel", value: "Firmenkunde, Flottenauftrag und Zusatzleistung gemeinsam abbilden" }
        ]}
        documentInfo={[
            { title: "Ausgangslage", text: "Die Firmenrad GmbH plant einen Flottenauftrag über 8 Fahrzeuge. Zusätzlich soll ein jährlicher Servicevertrag angeboten und im Auftrag vermerkt werden." },
            { title: "Zusatzinfo", text: "Die Lehrkraft will sehen, dass der Wartungswunsch nicht verloren geht und der Auftrag klar als Firmenauftrag erkennbar ist." }
        ]}
        documentTemplates={[
            "Angebot oder Auftragsvorbereitung",
            "Auftrag",
            "Service- oder Wartungshinweis"
        ]}
        tasks={[
            "Kundendaten prüfen.",
            "Falls nötig zunächst ein Angebot anlegen.",
            "Den Auftrag erfassen oder aus dem Angebot übernehmen.",
            "Den Servicevertrag im Auftrag dokumentieren."
        ]}
        teacherChecks={[
            "Ist die Menge von 8 Fahrzeugen korrekt erfasst",
            "Wird der Servicevertrag als Zusatzleistung sichtbar erwähnt",
            "Ist der Fall als Firmenauftrag erkennbar und nicht wie eine Standardbestellung behandelt"
        ]}
        completionChecks={[
            "Ein Auftrag für die Firmenrad GmbH ist vorhanden.",
            "Die Fahrzeugmenge ist korrekt erfasst.",
            "Der Wartungshinweis ist im Datensatz oder in einer Notiz sichtbar."
        ]}
        targetPages={[
            { to: "/kunden", label: "Kunden" },
            { to: "/angebote", label: "Angebote" },
            { to: "/auftraege", label: "Aufträge" }
        ]}
    />;
}
