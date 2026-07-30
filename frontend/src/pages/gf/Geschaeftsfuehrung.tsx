import { Link } from "react-router-dom";
import auftraegeService from "../../services/verkauf/auftraegeService";
import berichteService from "../../services/gf/berichteService";
import bestellungenService from "../../services/einkauf/bestellungenService";
import freigabenService from "../../services/gf/freigabenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";

export default function Geschaeftsfuehrung() {
    useStorageSyncRefresh(["freigaben", "berichte", "auftraege", "bestellungen", "zahlungen"]);

    const freigaben = freigabenService.list();
    const berichte = berichteService.list();
    const auftraege = auftraegeService.list();
    const bestellungen = bestellungenService.list();
    const rechnungen = rechnungenService.list();

    const offeneFreigaben = freigaben.filter(item => item.status === "offen").length;
    const fertigeBerichte = berichte.filter(item => item.status === "fertig").length;
    const offeneAuftraege = auftraege.filter(item => item.status === "offen").length;
    const offeneBestellungen = bestellungen.filter(item => item.status !== "eingegangen").length;
    const offeneRechnungen = rechnungen.filter(item => item.status === "offen").length;

    return <>
        <h1>Geschäftsführung</h1>
        <p>Modul für Freigaben, Berichte und Unternehmenskennzahlen. Die Seite soll Lehrkräften und Schülern zeigen, wie bereichsübergreifende Entscheidungen auf vorhandenen Vorgängen beruhen.</p>

        <div className="kennzahlen">
            <div className="kennzahl"><span>Offene Freigaben</span><strong>{offeneFreigaben}</strong><small>Entscheidungen</small></div>
            <div className="kennzahl"><span>Berichte</span><strong>{berichte.length}</strong><small>{fertigeBerichte} fertig</small></div>
            <div className="kennzahl"><span>Offene Aufträge</span><strong>{offeneAuftraege}</strong><small>Vertrieb</small></div>
            <div className="kennzahl"><span>Offene Bestellungen</span><strong>{offeneBestellungen}</strong><small>Einkauf</small></div>
            <div className="kennzahl"><span>Offene Rechnungen</span><strong>{offeneRechnungen}</strong><small>Buchhaltung</small></div>
        </div>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Führungsaufgaben</h2>
                    <span>Didaktischer Fokus</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Offene Freigaben prüfen und Entscheidungen begründen.</li>
                    <li>Berichte aus den Fachbereichen lesen und einordnen.</li>
                    <li>Kennzahlen aus Einkauf, Vertrieb und Buchhaltung gemeinsam betrachten.</li>
                    <li>Unterrichtsgespräche mit nachvollziehbaren Daten vorbereiten.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Bereichsübergreifender Blick</h2>
                    <span>Mockup-Zusammenhang</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Viele offene Aufträge beeinflussen Versand, Rechnungen und Freigaben.</li>
                    <li>Aktive Bestellungen oder Engpaesse wirken auf Lager und Lieferfaehigkeit.</li>
                    <li>Offene Rechnungen und Mahnungen sind Hinweise auf Zahlungs- oder Prozessprobleme.</li>
                </ul>
                <div className="link-list">
                    <Link className="button-link" to="/freigaben">Freigaben öffnen</Link>
                    <Link className="button-link" to="/berichte">Berichte öffnen</Link>
                    <Link className="button-link" to="/">Zum Dashboard</Link>
                </div>
            </article>
        </section>

        <section className="module-panel">
            <h2>Direkte Einstiege</h2>
            <div className="link-list">
                <Link className="button-link" to="/freigaben">Freigaben</Link>
                <Link className="button-link" to="/berichte">Berichte</Link>
                <Link className="button-link" to="/buchhaltung">Buchhaltung</Link>
                <Link className="button-link" to="/themen/verkauf">Verkauf</Link>
                <Link className="button-link" to="/themen/einkauf">Einkauf</Link>
            </div>
        </section>
    </>;
}
