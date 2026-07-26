import ScenarioPage from "../../components/ScenarioPage";

export default function RegionaleBestellung() {
    return <ScenarioPage
        title="Szenario: Regionale Bestellung"
        intro="Die Lehrkraft stellt diese Fallakte bereit. Schülerinnen und Schüler lösen den Fall in den vorhandenen Modulen, statt hier direkt Daten einzutragen."
        caseProfile={[
            { label: "Fachbereiche", value: "Verkauf, Versand und Kundenstammdaten" },
            { label: "Bearbeitungsziel", value: "Von der Kundenanfrage zu Angebot, Auftrag und Lieferplanung" }
        ]}
        documentInfo={[
            { title: "Ausgangslage", text: "Die Regionale Fahrradstation benötigt kurzfristig 2 Lastenräder für ein Innenstadtprojekt. Der Kunde ist bereits bekannt und wünscht Lieferung bis Mittwoch, 29. Juli 2026." },
            { title: "Zusatzinfo", text: "Der Transport soll mit dem eigenen Fuhrpark organisiert werden. Vor dem Auftrag soll geprüft werden, ob ein passendes Angebot bereits vorliegt oder neu erstellt werden muss." }
        ]}
        documentTemplates={[
            "Angebot",
            "Auftrag",
            "Transport- oder Lieferhinweis"
        ]}
        tasks={[
            "Kundendaten prüfen oder bei Bedarf ergänzen.",
            "Ein Angebot für 2 Lastenräder erstellen.",
            "Das Angebot in einen Auftrag übernehmen.",
            "Im Auftrag Liefertermin und Transport in der Notiz dokumentieren."
        ]}
        teacherChecks={[
            "Wurde erst der Kunde geprüft und dann der Verkaufsvorgang angelegt?",
            "Ist der Liefertermin Mittwoch, 29. Juli 2026 nachvollziehbar eingetragen?",
            "Ist die Transportlösung im Datensatz sichtbar dokumentiert?"
        ]}
        completionChecks={[
            "Ein offenes Angebot für den richtigen Kunden ist vorhanden.",
            "Ein Auftrag mit 2 Lastenrädern erscheint in der Auftragsliste.",
            "Liefertermin und Transport sind nachvollziehbar dokumentiert."
        ]}
        targetPages={[
            { to: "/kunden", label: "Kunden" },
            { to: "/angebote", label: "Angebote" },
            { to: "/auftraege", label: "Aufträge" }
        ]}
    />;
}
