import { Link } from "react-router-dom";
import OverviewCards from "../../components/OverviewCards";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import angeboteService from "../../services/verkauf/angeboteService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import zahlungenService from "../../services/buchhaltung/zahlungenService";
import bestellungenService from "../../services/einkauf/bestellungenService";
import { isPendingPayment } from "../../utils/openItems";

export default function LehrkraftOverview() {
    const kundenkorrespondenz = customerInquiryService.list();
    const angebote = angeboteService.getAll();
    const vertriebsdokumente = vertriebsdokumenteService.list();
    const bestellungen = bestellungenService.list();
    const rechnungen = rechnungenService.list();
    const zahlungen = zahlungenService.list();

    const offeneAnfragen = kundenkorrespondenz.filter(item => !["erledigt", "archiviert"].includes(String(item.status || "").toLowerCase())).length;
    const offeneAngebote = angebote.filter(item => !["angenommen", "abgelehnt", "ersetzt"].includes(String(item.status || "").toLowerCase())).length;
    const offeneWarenannahmen = vertriebsdokumente.filter(item =>
        ["lieferschein", "warenbegleitpapier", "transportpapier"].includes(String(item.dokumentTyp || "").toLowerCase())
        && String(item.status || "").toLowerCase() !== "versendet"
    ).length;
    const offeneLieferantenanfragen = bestellungen.filter(item => item.status === "angefragt").length;
    const bestaetigteBestellungen = bestellungen.filter(item => item.status === "bestaetigt").length;
    const versendeteBestellungen = bestellungen.filter(item => item.status === "versendet").length;
    const offeneDebitorenzahlungen = zahlungen.filter(item => item.zahlungsart !== "Ausgang" && isPendingPayment(item)).length;
    const offeneRechnungenZurSchuelerfirma = rechnungen.filter(item => item.status !== "bezahlt").length;

    return <>
        <h1>Lehrkraft</h1>
        <p>Diese Sicht bündelt die wichtigsten Unterlagen und Kommunikationsflächen für Unterricht, Kontrolle und Versand. Die Bearbeitung bleibt in den vorhandenen Fachseiten, aber hier ist der Einstieg für die Lehrkraft kompakter zusammengefasst.</p>

        <OverviewCards cards={[
            { label: "Kundenanfragen offen", value: offeneAnfragen },
            { label: "Angebote offen", value: offeneAngebote },
            { label: "Warenannahmen offen", value: offeneWarenannahmen },
            { label: "Lieferantenanfragen offen", value: offeneLieferantenanfragen },
            { label: "Debitorenzahlungen offen", value: offeneDebitorenzahlungen },
            { label: "Offene Rechnungen", value: offeneRechnungenZurSchuelerfirma }
        ]}/>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Kundenkorrespondenz</h2>
                    <span>Verkauf</span>
                </div>
                <p>Hier sieht die Lehrkraft, ob sie auf Kundenanfragen reagieren, Angebote beantworten oder eine Warenannahme beziehungsweise Transportbescheinigung bestätigen muss.</p>
                <ul className="dashboard-note-list">
                    <li>{offeneAnfragen} Anfragen oder Rückmeldungen sind noch nicht abgeschlossen.</li>
                    <li>{offeneAngebote} Angebote warten noch auf Annahme, Ablehnung oder Rückfrage.</li>
                    <li>{offeneWarenannahmen} Warenannahmen oder Transportunterlagen sind noch offen.</li>
                </ul>
                <div className="dashboard-mini-links">
                    <Link className="button-link" to="/lehrkraft/kundenkorrespondenz">Kundenkorrespondenz öffnen</Link>
                    <Link className="button-link" to="/lehrkraft/kundenkorrespondenz">Offene Antworten öffnen</Link>
                </div>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Lieferantenkorrespondenz</h2>
                    <span>Einkauf</span>
                </div>
                <p>Hier bestaetigt die Lehrkraft Einkaufsanfragen der Schuelerfirma und markiert die Bestellung anschliessend als versendet. Eine zusaetzliche Dokumentkette ist dafuer nicht noetig.</p>
                <ul className="dashboard-note-list">
                    <li>{offeneLieferantenanfragen} Anfragen warten auf Bestaetigung.</li>
                    <li>{bestaetigteBestellungen} bestaetigte Bestellungen koennen versendet werden.</li>
                    <li>{versendeteBestellungen} Bestellungen warten auf Wareneingang in der Schuelerfirma.</li>
                </ul>
                <div className="dashboard-mini-links">
                    <Link className="button-link" to="/lehrkraft/lieferantenkorrespondenz">Lieferantenkorrespondenz öffnen</Link>
                    <Link className="button-link" to="/lehrkraft/lieferantenkorrespondenz">Bestellungen öffnen</Link>
                </div>
            </article>
        </section>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Debitorenzahlungen</h2>
                    <span>Buchhaltung</span>
                </div>
                <p>Hier sieht die Lehrkraft, welche Zahlungen von Kunden gegenüber der Schülerfirma noch erwartet oder erst geplant sind.</p>
                <ul className="dashboard-note-list">
                    <li>Die Schülerfirma führt die Zahlung nicht selbst aus, sondern dokumentiert Zahlungserwartung, Eingang oder Klärung.</li>
                    <li>{offeneDebitorenzahlungen} Debitorenzahlungen sind noch offen oder noch nicht ausgeführt.</li>
                </ul>
                <div className="dashboard-mini-links">
                    <Link className="button-link" to="/lehrkraft/zahlungen">Debitorenzahlungen öffnen</Link>
                    <Link className="button-link" to="/lehrkraft/zahlungen">Externe Zahlungen öffnen</Link>
                </div>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Rechnungen gegenüber der Schülerfirma</h2>
                    <span>Kontrolle</span>
                </div>
                <p>Diese Sicht dient als kompakter Einstieg in Rechnungen, offene Posten und Belegbezug. So kann die Lehrkraft prüfen, ob die Klasse die Vorgänge nachvollziehbar dokumentiert hat.</p>
                <ul className="dashboard-note-list">
                    <li>{offeneRechnungenZurSchuelerfirma} Rechnungen sind noch offen oder noch nicht vollständig ausgeglichen.</li>
                    <li>Belege, Zahlungen und Mahnungen bleiben direkt mit dem Vorgang verbunden.</li>
                </ul>
                <div className="dashboard-mini-links">
                    <Link className="button-link" to="/lehrkraft/rechnungen">Rechnungen öffnen</Link>
                    <Link className="button-link" to="/belege">Belege öffnen</Link>
                </div>
            </article>
        </section>
    </>;
}
