import { Link } from "react-router-dom";
import artikelService from "../services/artikelService";
import rechnungenService from "../services/rechnungenService";
import auftraegeService from "../services/auftraegeService";
import { resetTestData } from "../services/mockup/mockStorage";
import useAuth from "../auth/AuthContext";

function Dashboard() {
    const { user, hasAccess, hasPermission } = useAuth();
    const offeneAuftraege = auftraegeService.getAll().filter(auftrag => auftrag.status === "offen").length;
    const offeneRechnungen = rechnungenService.getAll().filter(rechnung => rechnung.status === "offen").length;
    const niedrigeBestaende = artikelService.getAll().filter(artikel => Number(artikel.bestand) < 10).length;
    const bereiche = [
        { access: "einkauf", title: "Einkauf", text: "Lieferanten vergleichen und Bestellungen erfassen.", to: "/lieferanten", link: "Zum Einkauf" },
        { access: "verkauf", title: "Verkauf", text: "Angebote erstellen und in Aufträge übernehmen.", to: "/angebote", link: "Zum Verkauf" },
        { access: "buchhaltung", title: "Buchhaltung", text: "Offene Rechnungen und Summen im Blick behalten.", to: "/buchhaltung", link: "Zur Buchhaltung" },
        { access: "service", title: "Service", text: "Reklamationen erfassen und Ersatzlieferungen planen.", to: "/reklamationen", link: "Zum Service" },
        { access: "marketing", title: "Marketing", text: "Kampagnen, Newsletter, Events und Feedback verwalten.", to: "/marketing", link: "Zum Marketing" }
    ];

    const testdatenZuruecksetzen = () => {
        if (!confirm("Alle lokalen Testdaten werden zurückgesetzt. Fortfahren?")) return;
        resetTestData();
        window.location.reload();
    };

    return <div className="dashboard">
        <div className="dashboard-heading">
            <div>
                <h1>Dashboard</h1>
                <p>Willkommen, {user?.name || user?.username}. Übersicht der wichtigsten Lernkennzahlen.</p>
            </div>
            {hasPermission("*") && <button className="secondary-button" onClick={testdatenZuruecksetzen}>Testdaten zurücksetzen</button>}
        </div>

        <div className="kennzahlen">
            <div className="kennzahl"><span>Offene Aufträge</span><strong>{offeneAuftraege}</strong></div>
            <div className="kennzahl"><span>Offene Rechnungen</span><strong>{offeneRechnungen}</strong></div>
            <div className="kennzahl"><span>Niedrige Bestände</span><strong>{niedrigeBestaende}</strong></div>
        </div>

        <section className="prozess-einstiege">
            <h2>Prozesse für die Demo</h2>
            <div className="prozess-grid">
                {bereiche.filter(bereich => hasAccess(bereich.access)).map(bereich => (
                    <article className="prozess-karte" key={bereich.access}>
                        <h3>{bereich.title}</h3>
                        <p>{bereich.text}</p>
                        <Link to={bereich.to}>{bereich.link}</Link>
                    </article>
                ))}
            </div>
        </section>
    </div>;
}

export default Dashboard;
