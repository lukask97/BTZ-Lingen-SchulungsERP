import { Link } from "react-router-dom";
import belegeService from "../../services/buchhaltung/belegeService";
import mahnungenService from "../../services/buchhaltung/mahnungenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import zahlungenService from "../../services/buchhaltung/zahlungenService";
import { getOpenItemStatus, getUnifiedOpenItems, isOverdueOpenItem, sumPaidItems, sumUnifiedOpenItems } from "../../utils/openItems";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";

const euro = betrag => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(betrag);

export default function Buchhaltung() {
    useStorageSyncRefresh(["auftraege", "bestellungen", "belege", "zahlungen", "mahnungen"]);

    const rechnungen = rechnungenService.getAll();
    const belege = belegeService.list();
    const zahlungen = zahlungenService.list();
    const mahnungen = mahnungenService.list();
    const ausgangsrechnungen = rechnungen.filter(rechnung => rechnung.rechnungstyp !== "Eingangsrechnung");
    const eingangsrechnungen = rechnungen.filter(rechnung => rechnung.rechnungstyp === "Eingangsrechnung");
    const offenePosten = getUnifiedOpenItems(rechnungen, zahlungen);
    const ueberfaelligePosten = rechnungen.filter(isOverdueOpenItem);
    const ausgeglichenePosten = rechnungen.filter(rechnung => getOpenItemStatus(rechnung) === "bezahlt");
    const offenePostenSumme = sumUnifiedOpenItems(rechnungen, zahlungen);
    const ausgeglicheneSumme = sumPaidItems(rechnungen);
    const belegeProRechnung = rechnungen.map(rechnung => ({
        ...rechnung,
        belege: belege.filter(item => item.bezug === rechnung.rechnungsnr)
    })).slice(0, 4);
    const ampelUebersicht = [
        { label: "Gelb", value: rechnungen.filter(rechnung => getOpenItemStatus(rechnung) === "offen").length, hint: "offen" },
        { label: "Rot", value: rechnungen.filter(rechnung => getOpenItemStatus(rechnung) === "ueberfaellig").length, hint: "ueberfaellig" },
        { label: "Grün", value: rechnungen.filter(rechnung => getOpenItemStatus(rechnung) === "bezahlt").length, hint: "bezahlt" },
        { label: "Grau", value: rechnungen.filter(rechnung => getOpenItemStatus(rechnung) === "storniert").length, hint: "storniert" }
    ];

    return <>
        <h1>Offene-Posten-Buchhaltung</h1>
        <p>Interne Übersicht über Debitoren, Kreditoren, offene Posten, überfällige Posten und ausgeglichene Vorgänge.</p>
        <div className="kennzahlen">
            <div className="kennzahl"><span>Offene Posten</span><strong>{offenePosten.length}</strong><small>{euro(offenePostenSumme)}</small></div>
            <div className="kennzahl"><span>Überfällige Posten</span><strong>{ueberfaelligePosten.length}</strong><small>Statusampel Rot</small></div>
            <div className="kennzahl"><span>Ausgangsrechnungen</span><strong>{ausgangsrechnungen.length}</strong><small>Debitoren</small></div>
            <div className="kennzahl"><span>Eingangsrechnungen</span><strong>{eingangsrechnungen.length}</strong><small>Kreditoren</small></div>
            <div className="kennzahl"><span>Ausgeglichene Posten</span><strong>{ausgeglichenePosten.length}</strong><small>{euro(ausgeglicheneSumme)}</small></div>
            <div className="kennzahl"><span>Rechnungen gesamt</span><strong>{rechnungen.length}</strong><small>{euro(rechnungen.reduce((summe, rechnung) => summe + Number(rechnung.betrag), 0))}</small></div>
        </div>
        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Buchhaltungslogik</h2>
                    <span>Lernziel</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Offene Posten sind offene Rechnungen oder bereits geplante, aber noch nicht ausgeführte Zahlungen.</li>
                    <li>Ausgangsrechnungen gehören zu Kunden und zeigen Debitorenposten.</li>
                    <li>Eingangsrechnungen gehören zu Lieferanten und zeigen Kreditorenposten.</li>
                    <li>Zahlungen, Mahnungen und Belege dokumentieren intern immer denselben offenen Posten.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Belegwesen</h2>
                    <span>Ordnungssystem</span>
                </div>
                <div className="status-grid">
                    <div className="status-card tone-good"><span>Zahlungen</span><strong>{zahlungen.length}</strong></div>
                    <div className="status-card tone-warn"><span>Mahnungen</span><strong>{mahnungen.length}</strong></div>
                    <div className="status-card tone-good"><span>Belege</span><strong>{belege.length}</strong></div>
                </div>
            </article>
        </section>
        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Statusampel einfach erklärt</h2>
                <span>Lernhilfe</span>
            </div>
            <div className="ampel-grid">
                {ampelUebersicht.map(item => <div key={item.label} className={`ampel-card ampel-${item.hint === "ueberfaellig" ? "due" : item.hint === "offen" ? "open" : item.hint === "bezahlt" ? "paid" : "cancelled"}`}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.hint === "ueberfaellig" ? "überfällig" : item.hint}</small>
                </div>)}
            </div>
            <p className="module-hint">Die Ampel zeigt, welche offenen Posten noch normal offen sind, welche bereits überfällig wurden und welche schon ausgeglichen sind.</p>
        </section>
        <section className="buchhaltung-liste">
            <h2>Offene-Posten-Liste</h2>
            {offenePosten.length === 0 ? <p>Zurzeit sind keine offenen Posten vorhanden.</p> :
                <ul>{offenePosten.map(item => <li key={item.id}><Link className="detail-link" to={item.link}><strong>{item.referenz}</strong></Link> – {item.partner} · {item.quelltyp} · {item.fachtyp} · {item.faelligAm || "ohne Termin"} · {item.ampel}: {euro(Number(item.betrag))}</li>)}</ul>}
            <p>Didaktische Einordnung: Nicht nur die Rechnung selbst steht im Mittelpunkt, sondern der intern zu dokumentierende offene Vorgang bis zur Klärung.</p>
            <div className="link-list">
                <Link className="button-link" to="/abc-analyse">Zur ABC-Analyse</Link>
                <Link className="button-link" to="/firmenkonto">Zum Firmenkonto</Link>
                <Link className="button-link" to="/rechnungen">Zur Rechnungsverwaltung</Link>
                <Link className="button-link" to="/zahlungen">Zu den Zahlungen</Link>
                <Link className="button-link" to="/mahnungen">Zu den Mahnungen</Link>
                <Link className="button-link" to="/belege">Zum Belegarchiv</Link>
            </div>
        </section>
        <section className="buchhaltung-liste">
            <h2>Belegfluss</h2>
            <p>Die Übersicht zeigt vereinfacht, welche offenen Posten bereits durch Belege, Zahlungsnachweise oder Mahndokumente ergänzt wurden.</p>
            <ul>
                {belegeProRechnung.map(rechnung => <li key={rechnung.rechnungsnr}>
                    <Link className="detail-link" to={`/belege?bezug=${rechnung.rechnungsnr}`}><strong>{rechnung.rechnungsnr}</strong></Link> – {rechnung.kunde}: {rechnung.belege.length === 0 ? "kein Beleg hinterlegt" : `${rechnung.belege.length} Beleg(e) vorhanden`}
                    {rechnung.belege.length > 0 && <small> ({rechnung.belege.map(item => item.typ).join(", ")})</small>}
                </li>)}
            </ul>
        </section>
    </>;
}
