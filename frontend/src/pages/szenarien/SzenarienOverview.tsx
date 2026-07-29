import { Link } from "react-router-dom";
import { SCENARIO_MENU } from "../../constants/navigation";

const szenarien = [
    {
        title: "Regionale Bestellung",
        path: "/szenarien/regionale-bestellung",
        fokus: "Vertrieb und Logistik",
        ziel: "Angebot, Auftrag und Lieferplanung aufeinander beziehen."
    },
    {
        title: "Großbestellung",
        path: "/szenarien/grossbestellung",
        fokus: "Angebot und Kalkulation",
        ziel: "Mengenrabatt und Zubehör nachvollziehbar dokumentieren."
    },
    {
        title: "Firmenauftrag",
        path: "/szenarien/firmenauftrag",
        fokus: "Auftrag und Service",
        ziel: "Flottenauftrag mit Zusatzleistung sauber erfassen."
    },
    {
        title: "Eventbestellung",
        path: "/szenarien/eventbestellung",
        fokus: "Sonderfall und Dokumentation",
        ziel: "Besonderheiten eines Eventauftrags sichtbar machen."
    },
    {
        title: "Service",
        path: "/szenarien/service",
        fokus: "Reklamation und Folgeaktion",
        ziel: "Servicefall, Reklamation und Ersatzlieferung verknüpfen."
    },
    {
        title: "Transportverzögerung",
        path: "/szenarien/transportverzoegerung",
        fokus: "Kommunikation und Auftrag",
        ziel: "Verzögerung und Kundeninformation lückenlos dokumentieren."
    },
    {
        title: "Kooperation",
        path: "/szenarien/kooperation",
        fokus: "Marketing und Freigabe",
        ziel: "Aktion und Führungsentscheidung miteinander verbinden."
    }
];

export default function SzenarienOverview() {
    return <>
        <h1>Fallakten und Szenarien</h1>
        <p>Die Szenarien sind als Arbeitsaufträge der Lehrkraft aufgebaut. Schülerinnen und Schüler lesen die Fallakte hier und bearbeiten die Lösung anschließend in den passenden Fachmodulen.</p>

        <div className="kennzahlen">
            <div className="kennzahl"><span>Fallakten</span><strong>{SCENARIO_MENU.length}</strong><small>Unterrichtsfälle</small></div>
            <div className="kennzahl"><span>Arbeitsweise</span><strong>Im System</strong><small>Keine Insellösung</small></div>
            <div className="kennzahl"><span>Fokus</span><strong>Praxis</strong><small>Lernen durch Handeln</small></div>
        </div>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>So werden die Fallakten genutzt</h2>
                    <span>Didaktik</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Die Lehrkraft stellt einen Fall mit Ausgangslage und Zusatzinfos bereit.</li>
                    <li>Die Bearbeitung erfolgt nicht auf der Fallseite, sondern in Kunden, Angeboten, Aufträgen, Buchhaltung oder Marketing.</li>
                    <li>Die Lösung ist dann an Datensätzen, Status und Dokumenten in den Kernmodulen erkennbar.</li>
                    <li>Die Fallakte dient als Arbeitsauftrag und nicht als separates Datensilo.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Worauf Lehrkräfte achten können</h2>
                    <span>Prüfpunkte</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Wurde der passende Fachbereich gewählt?</li>
                    <li>Sind Stamm- und Bewegungsdaten sauber verknüpft?</li>
                    <li>Wurden Notizen, Belege oder Dokumente verständlich ergänzt?</li>
                    <li>Ist das Ergebnis in Tabellen und Übersichten sichtbar nachvollziehbar?</li>
                </ul>
            </article>
        </section>

        <section className="prozess-einstiege">
            <h2>Verfügbare Fallakten</h2>
            <div className="prozess-grid">
                {szenarien.map(item => <article className="prozess-karte" key={item.path}>
                    <h3>{item.title}</h3>
                    <p><strong>Fokus:</strong> {item.fokus}</p>
                    <p>{item.ziel}</p>
                    <Link to={item.path}>Fallakte öffnen</Link>
                </article>)}
            </div>
        </section>
    </>;
}
