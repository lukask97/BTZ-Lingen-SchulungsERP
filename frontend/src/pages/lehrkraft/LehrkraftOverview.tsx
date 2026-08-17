import { Link } from "react-router-dom";
import OverviewCards from "../../components/OverviewCards";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import angeboteService from "../../services/verkauf/angeboteService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import zahlungenService from "../../services/buchhaltung/zahlungenService";
import bestellungenService from "../../services/einkauf/bestellungenService";
import { isPendingPayment } from "../../utils/openItems";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";
import { getOpenGoodsReceiptOrders, getPurchaseOrdersByStatus } from "../../utils/processFlow";
import { useLehrkraftAutomationen } from "../../hooks/useLehrkraftAutomationen";

const OFFER_OPEN_STATUSES = ["wartet auf antwort"];

export default function LehrkraftOverview() {
    useLehrkraftAutomationen();
    useStorageSyncRefresh(["kundenanfragen", "angebote", "vertriebsdokumente", "bestellungen", "zahlungen", "auftraege"]);

    const kundenkorrespondenz = customerInquiryService.list();
    const angebote = angeboteService.getAll();
    const vertriebsdokumente = vertriebsdokumenteService.list();
    const bestellungen = bestellungenService.list();
    const rechnungen = rechnungenService.list();
    const zahlungen = zahlungenService.list();

    const offeneAnfragen = kundenkorrespondenz.filter(item => !["erledigt", "archiviert"].includes(String(item.status || "").toLowerCase())).length;
    const offeneAngebote = angebote.filter(item => OFFER_OPEN_STATUSES.includes(String(item.status || "").toLowerCase())).length;
    const offeneWarenannahmen = vertriebsdokumente.filter(item =>
        ["lieferschein", "warenbegleitpapier", "transportpapier"].includes(String(item.dokumentTyp || "").toLowerCase())
        && String(item.status || "").toLowerCase() !== "versendet"
    ).length;
    const offeneLieferantenanfragen = getPurchaseOrdersByStatus(bestellungen, "angefragt").length;
    const bestaetigteBestellungen = getPurchaseOrdersByStatus(bestellungen, "bestaetigt").length;
    const versendeteBestellungen = getOpenGoodsReceiptOrders(bestellungen).length;
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
                    <Link className="button-link" to="/lehrkraft/optionen">Lehrkraft-Optionen</Link>
                </div>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Lieferantenkorrespondenz</h2>
                    <span>Einkauf</span>
                </div>
                <p>Hier bestätigt die Lehrkraft Einkaufsanfragen der Schülerfirma und markiert die Bestellung anschließend als versendet. Eine zusätzliche Dokumentkette ist dafür nicht nötig.</p>
                <ul className="dashboard-note-list">
                    <li>{offeneLieferantenanfragen} Anfragen warten auf Bestätigung.</li>
                    <li>{bestaetigteBestellungen} bestätigte Bestellungen können versendet werden.</li>
                    <li>{versendeteBestellungen} Bestellungen warten auf Wareneingang in der Schülerfirma.</li>
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
                    <h2>Zahlungen extern</h2>
                    <span>Kunden</span>
                </div>
                <p>Hier sieht die Lehrkraft, welche Zahlungen von Kunden gegenüber der Schülerfirma noch erwartet oder erst geplant sind. Dieser Bereich gehört zur Kundenkorrespondenz.</p>
                <ul className="dashboard-note-list">
                    <li>Die Schülerfirma führt die Zahlung nicht selbst aus, sondern dokumentiert Zahlungserwartung, Eingang oder Klärung.</li>
                    <li>{offeneDebitorenzahlungen} Debitorenzahlungen sind noch offen oder noch nicht ausgeführt.</li>
                </ul>
                <div className="dashboard-mini-links">
                    <Link className="button-link" to="/lehrkraft/zahlungen">Zahlungen extern öffnen</Link>
                    <Link className="button-link" to="/lehrkraft/kundenkorrespondenz">Zur Kundenkorrespondenz</Link>
                    <Link className="button-link" to="/lehrkraft/optionen">Automatik verwalten</Link>
                </div>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Rechnungen extern</h2>
                    <span>Lieferanten</span>
                </div>
                <p>Diese Sicht dient als kompakter Einstieg in Rechnungen, offene Posten und Belegbezug gegenüber der Schülerfirma. Dieser Bereich gehört zur Lieferantenkorrespondenz.</p>
                <ul className="dashboard-note-list">
                    <li>{offeneRechnungenZurSchuelerfirma} Rechnungen sind noch offen oder noch nicht vollständig ausgeglichen.</li>
                    <li>Belege, Zahlungen und Mahnungen bleiben direkt mit dem Vorgang verbunden.</li>
                </ul>
                <div className="dashboard-mini-links">
                    <Link className="button-link" to="/lehrkraft/rechnungen">Rechnungen extern öffnen</Link>
                    <Link className="button-link" to="/lehrkraft/lieferantenkorrespondenz">Zur Lieferantenkorrespondenz</Link>
                </div>
            </article>
        </section>
    </>;
}
