import { Link } from "react-router-dom";
import HelpHint from "../../components/HelpHint";
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
    const offeneDebitoren = ausgangsrechnungen.filter(rechnung => ["offen", "ueberfaellig"].includes(getOpenItemStatus(rechnung)));
    const offeneKreditoren = eingangsrechnungen.filter(rechnung => ["offen", "ueberfaellig"].includes(getOpenItemStatus(rechnung)));
    const offenePostenSumme = sumUnifiedOpenItems(rechnungen, zahlungen);
    const ausgeglicheneSumme = sumPaidItems(rechnungen);
    const offeneDebitorenSumme = offeneDebitoren.reduce((summe, rechnung) => summe + Number(rechnung.betrag || 0), 0);
    const offeneKreditorenSumme = offeneKreditoren.reduce((summe, rechnung) => summe + Number(rechnung.betrag || 0), 0);
    const belegeProRechnung = rechnungen.map(rechnung => ({
        ...rechnung,
        belege: belege.filter(item => String(item.rechnungId) === String(rechnung.id) || item.bezug === rechnung.rechnungsnr)
    })).slice(0, 4);
    const ampelUebersicht = [
        { label: "Gelb", value: rechnungen.filter(rechnung => getOpenItemStatus(rechnung) === "offen").length, hint: "offen" },
        { label: "Rot", value: rechnungen.filter(rechnung => getOpenItemStatus(rechnung) === "ueberfaellig").length, hint: "ueberfaellig" },
        { label: "Grün", value: rechnungen.filter(rechnung => getOpenItemStatus(rechnung) === "bezahlt").length, hint: "bezahlt" },
        { label: "Grau", value: rechnungen.filter(rechnung => getOpenItemStatus(rechnung) === "storniert").length, hint: "storniert" }
    ];

    return <>
        <h1>Offene-Posten-Buchhaltung</h1>
        <p>Hier sieht die Buchhaltung, welche Rechnungen noch offen sind, wer Geld an den Betrieb zahlen muss und bei welchen Lieferanten der Betrieb selbst noch zahlen muss.</p>
        <div className="kennzahlen">
            <div className="kennzahl"><span>Offene Posten</span><strong>{offenePosten.length}</strong><small>{euro(offenePostenSumme)}</small></div>
            <div className="kennzahl"><span>Offene Debitoren</span><strong>{offeneDebitoren.length}</strong><small>{euro(offeneDebitorenSumme)}</small></div>
            <div className="kennzahl"><span>Offene Kreditoren</span><strong>{offeneKreditoren.length}</strong><small>{euro(offeneKreditorenSumme)}</small></div>
            <div className="kennzahl"><span>Überfällige Posten</span><strong>{ueberfaelligePosten.length}</strong><small>Statusampel Rot</small></div>
            <div className="kennzahl"><span>Ausgangsrechnungen</span><strong>{ausgangsrechnungen.length}</strong><small>Debitoren</small></div>
            <div className="kennzahl"><span>Eingangsrechnungen</span><strong>{eingangsrechnungen.length}</strong><small>Kreditoren</small></div>
            <div className="kennzahl"><span>Ausgeglichene Posten</span><strong>{ausgeglichenePosten.length}</strong><small>{euro(ausgeglicheneSumme)}</small></div>
        </div>
        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Grundbegriffe</h2>
                    <span>Buchhaltungslogik</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Ein <strong>offener Posten</strong> ist ein Vorgang, der noch nicht vollständig bezahlt oder geklärt ist <HelpHint text="Ein offener Posten ist ein noch nicht vollständig ausgeglichener Rechnungs- oder Zahlungsvorgang." delay={300} />.</li>
                    <li><strong>Debitor</strong> bedeutet: Ein Kunde schuldet dem Betrieb noch Geld. Das ist meist eine offene Ausgangsrechnung <HelpHint text="Ein Debitor ist aus Sicht des Betriebs ein Kunde, gegen den noch eine Forderung besteht." delay={300} />.</li>
                    <li><strong>Kreditor</strong> bedeutet: Der Betrieb schuldet einem Lieferanten noch Geld. Das ist meist eine offene Eingangsrechnung <HelpHint text="Ein Kreditor ist aus Sicht des Betriebs ein Lieferant oder Gläubiger, dem noch Geld geschuldet wird." delay={300} />.</li>
                    <li>Zahlungen, Mahnungen und Belege gehören fachlich zum selben offenen Posten.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Arbeitsfluss</h2>
                    <span>Ablauf</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Offene Rechnung erkennen.</li>
                    <li>Als Debitoren- oder Kreditorenposten einordnen.</li>
                    <li>Zahlung oder Bankbewegung zuordnen.</li>
                    <li>Vorgang als ausgeglichen abschließen.</li>
                </ul>
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
        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Einordnung</h2>
                    <span>Debitor / Kreditor</span>
                </div>
                <div className="status-grid">
                    <div className="status-card tone-good"><span>Debitoren</span><strong>{offeneDebitoren.length}</strong><small>Kunden zahlen noch an uns</small></div>
                    <div className="status-card tone-warn"><span>Kreditoren</span><strong>{offeneKreditoren.length}</strong><small>Wir zahlen noch an Lieferanten</small></div>
                </div>
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
        <section className="buchhaltung-liste">
            <h2>Offene-Posten-Liste</h2>
            {offenePosten.length === 0 ? <p>Zurzeit sind keine offenen Posten vorhanden.</p> :
                <ul>{offenePosten.map(item => <li key={item.id}><Link className="detail-link" to={item.link}><strong>{item.referenz}</strong></Link> – {item.partner} · {item.quelltyp} · {item.fachtyp} · {item.faelligAm || "ohne Termin"} · {item.ampel}: {euro(Number(item.betrag))}</li>)}</ul>}
            <p>Didaktische Einordnung: Im Mittelpunkt steht nicht nur das Dokument, sondern der noch offene Vorgang bis zur vollständigen Klärung.</p>
            <div className="link-list">
                <Link className="button-link" to="/abc-analyse">Zur ABC-Analyse</Link>
                <Link className="button-link" to="/bankauszug">Zum Bankauszug</Link>
                <Link className="button-link" to="/firmenkonto">Zum Firmenkonto</Link>
                <Link className="button-link" to="/ausgangsrechnungen">Zu den Ausgangsrechnungen</Link>
                <Link className="button-link" to="/eingangsrechnungen">Zu den Eingangsrechnungen</Link>
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
