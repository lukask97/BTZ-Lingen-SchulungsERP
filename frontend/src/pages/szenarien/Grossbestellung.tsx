import ScenarioPage from "../../components/ScenarioPage";

export default function Grossbestellung() {
    return <ScenarioPage
        title="Szenario: Großbestellung"
        intro="Diese Fallakte beschreibt eine große Kundenbestellung, die als Angebot vorbereitet und kaufmännisch sauber dokumentiert werden soll."
        caseProfile={[
            { label: "Fachbereiche", value: "Verkauf, Kalkulation und Dokumentation" },
            { label: "Bearbeitungsziel", value: "Große Stückzahl mit Zubehör und Mengenrabatt nachvollziehbar anbieten" }
        ]}
        documentInfo={[
            { title: "Ausgangslage", text: "Nordrad Einkauf fragt 12 Lastenräder an und möchte zusätzlich ein Helm- und Schlossset. Für die große Stückzahl soll ein Mengenrabatt von 10 % berücksichtigt werden." },
            { title: "Zusatzinfo", text: "Die Lehrkraft erwartet, dass der Rabatt und das Zubehör in der Angebotsbeschreibung oder in den Positionen klar erkennbar sind." }
        ]}
        documentTemplates={[
            "Angebot",
            "Kalkulationsnotiz",
            "Zubehörhinweis"
        ]}
        tasks={[
            "Den Kunden in der Kundenverwaltung prüfen.",
            "Ein neues Angebot mit Hauptprodukt und Zubehör erfassen.",
            "Den Mengenrabatt im Angebot nachvollziehbar dokumentieren.",
            "Den offenen Angebotswert kontrollieren."
        ]}
        teacherChecks={[
            "Wurde die Stückzahl 12 korrekt dokumentiert",
            "Sind Rabatt und Zubehör nicht nur gedacht, sondern sichtbar eingetragen",
            "Bleibt das Angebot bewusst offen und wird noch nicht in einen Auftrag übernommen"
        ]}
        completionChecks={[
            "Ein offenes Angebot für Nordrad Einkauf ist vorhanden.",
            "Zubehör und Rabatt sind im Datensatz erkennbar.",
            "Das Angebot bleibt offen und ist noch nicht in einen Auftrag übernommen."
        ]}
        targetPages={[
            { to: "/kunden", label: "Kunden" },
            { to: "/angebote", label: "Angebote" }
        ]}
    />;
}
