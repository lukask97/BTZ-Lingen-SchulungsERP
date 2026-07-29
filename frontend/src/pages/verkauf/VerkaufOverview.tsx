import { Link } from "react-router-dom";
import angeboteService from "../../services/verkauf/angeboteService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import kundenService from "../../services/verkauf/customerService";
import reklamationenService from "../../services/verkauf/reklamationenService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";

export default function VerkaufOverview() {
    const kunden = kundenService.list();
    const anfragen = customerInquiryService.list();
    const angebote = angeboteService.list();
    const auftraege = auftraegeService.list();
    const reklamationen = reklamationenService.list();
    const dokumente = vertriebsdokumenteService.list();

    const offeneAnfragen = anfragen.filter(item => item.status === "offen").length;
    const offeneAngebote = angebote.filter(item => !["angenommen", "abgelehnt"].includes(String(item.status || "").toLowerCase())).length;
    const offeneAuftraege = auftraege.filter(item => item.status === "offen").length;
    const offeneReklamationen = reklamationen.filter(item => item.status === "neu").length;

    return <>
        <h1>Verkauf</h1>
        <p>Modul für den didaktisch vereinfachten Vertriebsprozess. Schüler sollen vom ersten Kundenkontakt bis zu Auftrag, Versand und Dokumentenkette verstehen, wie ein Vorgang fachlich weitergeführt wird.</p>

        <div className="kennzahlen">
            <div className="kennzahl"><span>Kunden</span><strong>{kunden.length}</strong><small>Stammdaten</small></div>
            <div className="kennzahl"><span>Kundenanfragen</span><strong>{anfragen.length}</strong><small>{offeneAnfragen} offen</small></div>
            <div className="kennzahl"><span>Angebote</span><strong>{angebote.length}</strong><small>{offeneAngebote} offen</small></div>
            <div className="kennzahl"><span>Aufträge</span><strong>{auftraege.length}</strong><small>{offeneAuftraege} offen</small></div>
            <div className="kennzahl"><span>Vertriebsdokumente</span><strong>{dokumente.length}</strong><small>Dokumentenkette</small></div>
            <div className="kennzahl"><span>Reklamationen</span><strong>{reklamationen.length}</strong><small>{offeneReklamationen} neu</small></div>
        </div>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Vertriebsprozess</h2>
                    <span>Lernkette</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Kundenanfrage aufnehmen und sauber dokumentieren.</li>
                    <li>Passendes Angebot mit Positionen erstellen.</li>
                    <li>Nach dem Angebot erst auf die Antwort warten und Annahme oder Ablehnung festhalten.</li>
                    <li>Nur angenommene Angebote in einen Auftrag übernehmen.</li>
                    <li>Auftragsbestätigung, Lieferschein und Begleitpapiere ergänzen.</li>
                    <li>Bei Problemen Reklamationen oder Servicefälle weiterbearbeiten.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Kalkulation und Dokumente</h2>
                    <span>Übungsfokus</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Einkaufspreis, Aufschlag und Verkaufspreis nachvollziehen</li>
                    <li>Optional mit Rabatt, Skonto oder MwSt arbeiten</li>
                    <li>Auftragsbestätigung, Lieferschein, Warenbegleitpapier und Transportpapier nutzen</li>
                </ul>
                <div className="link-list">
                    <Link className="button-link" to="/vertriebsdokumente">Vertriebsdokumente öffnen</Link>
                    <Link className="button-link" to="/versand">Versand öffnen</Link>
                </div>
            </article>
        </section>

        <section className="module-panel">
            <h2>Direkte Einstiege</h2>
            <div className="link-list">
                <Link className="button-link" to="/kunden">Kunden</Link>
                <Link className="button-link" to="/kundenanfragen">Kundenanfragen</Link>
                <Link className="button-link" to="/angebote">Angebote</Link>
                <Link className="button-link" to="/auftraege">Aufträge</Link>
                <Link className="button-link" to="/vertriebsdokumente">Vertriebsdokumente</Link>
                <Link className="button-link" to="/reklamationen">Reklamationen</Link>
            </div>
        </section>
    </>;
}
