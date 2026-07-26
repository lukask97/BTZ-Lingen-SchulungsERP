import ScenarioPage from "../../components/ScenarioPage";

export default function Firmenauftrag() {
    return <ScenarioPage
        title="Szenario: Firmenauftrag"
        intro="Die Fallakte soll in einen nachvollziehbaren Firmenauftrag überführt werden."
        documentInfo={[
            { title: "Ausgangslage", text: "Die Firmenrad GmbH plant einen Flottenauftrag über 8 Fahrzeuge. Zusätzlich soll ein jährlicher Servicevertrag angeboten und im Auftrag vermerkt werden." },
            { title: "Zusatzinfo", text: "Die Lehrkraft will sehen, dass der Wartungswunsch nicht verloren geht und der Auftrag klar als Firmenauftrag erkennbar ist." }
        ]}
        tasks={[
            "Kundendaten prüfen.",
            "Falls nötig zunächst ein Angebot anlegen.",
            "Den Auftrag erfassen oder aus dem Angebot übernehmen.",
            "Den Servicevertrag im Auftrag dokumentieren."
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
