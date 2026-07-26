import { Link } from "react-router-dom";
import belegeService from "../services/belegeService";
import mahnungenService from "../services/mahnungenService";
import rechnungenService from "../services/rechnungenService";
import zahlungenService from "../services/zahlungenService";

const euro = betrag => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(betrag);
const today = "2026-07-26";

function ampelStatus(rechnung) {
    if (rechnung.status === "bezahlt") return "bezahlt";
    if (rechnung.status === "storniert") return "storniert";
    if (rechnung.faelligAm && rechnung.faelligAm < today) return "fällig";
    return "offen";
}

export default function Buchhaltung() {
    const rechnungen = rechnungenService.getAll();
    const belege = belegeService.list();
    const zahlungen = zahlungenService.list();
    const mahnungen = mahnungenService.list();
    const ausgangsrechnungen = rechnungen.filter(rechnung => rechnung.rechnungstyp !== "Eingangsrechnung");
    const eingangsrechnungen = rechnungen.filter(rechnung => rechnung.rechnungstyp === "Eingangsrechnung");
    const offeneRechnungen = rechnungen.filter(rechnung => rechnung.status === "offen");
    const faelligeRechnungen = rechnungen.filter(rechnung => ampelStatus(rechnung) === "fällig");
    const bezahlteRechnungen = rechnungen.filter(rechnung => rechnung.status === "bezahlt");
    const offen = offeneRechnungen.reduce((summe, rechnung) => summe + Number(rechnung.betrag), 0);
    const bezahlt = bezahlteRechnungen.reduce((summe, rechnung) => summe + Number(rechnung.betrag), 0);
    const offenePosten = offeneRechnungen.map(rechnung => ({ ...rechnung, ampel: ampelStatus(rechnung) }));
    const belegeProRechnung = rechnungen.map(rechnung => ({
        ...rechnung,
        belege: belege.filter(item => item.bezug === rechnung.rechnungsnr)
    })).slice(0, 4);
    const ampelUebersicht = [
        { label: "Gelb", value: rechnungen.filter(rechnung => ampelStatus(rechnung) === "offen").length, hint: "offen" },
        { label: "Rot", value: rechnungen.filter(rechnung => ampelStatus(rechnung) === "fällig").length, hint: "fällig" },
        { label: "Grün", value: rechnungen.filter(rechnung => ampelStatus(rechnung) === "bezahlt").length, hint: "bezahlt" },
        { label: "Grau", value: rechnungen.filter(rechnung => ampelStatus(rechnung) === "storniert").length, hint: "storniert" }
    ];

    return <>
        <h1>Buchhaltungsübersicht</h1>
        <p>Übersicht über Debitoren, Kreditoren, Fälligkeiten und die vereinfachte Offene-Posten-Liste.</p>
        <div className="kennzahlen">
            <div className="kennzahl"><span>Offene Posten</span><strong>{offeneRechnungen.length}</strong><small>{euro(offen)}</small></div>
            <div className="kennzahl"><span>Fällige Vorgänge</span><strong>{faelligeRechnungen.length}</strong><small>Statusampel Rot</small></div>
            <div className="kennzahl"><span>Ausgangsrechnungen</span><strong>{ausgangsrechnungen.length}</strong><small>Debitoren</small></div>
            <div className="kennzahl"><span>Eingangsrechnungen</span><strong>{eingangsrechnungen.length}</strong><small>Kreditoren</small></div>
            <div className="kennzahl"><span>Bezahlte Rechnungen</span><strong>{bezahlteRechnungen.length}</strong><small>{euro(bezahlt)}</small></div>
            <div className="kennzahl"><span>Rechnungen gesamt</span><strong>{rechnungen.length}</strong><small>{euro(rechnungen.reduce((summe, rechnung) => summe + Number(rechnung.betrag), 0))}</small></div>
        </div>
        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Buchhaltungslogik</h2>
                    <span>Lernziel</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Ausgangsrechnungen gehören zu Kunden und zeigen Debitorenprozesse.</li>
                    <li>Eingangsrechnungen gehören zu Lieferanten und zeigen Kreditorenprozesse.</li>
                    <li>Zahlungen, Mahnungen und Belege ergänzen dieselben Rechnungen.</li>
                    <li>Die Statusampel unterscheidet offen, fällig und bezahlt.</li>
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
                {ampelUebersicht.map(item => <div key={item.label} className={`ampel-card ampel-${item.hint === "fällig" ? "due" : item.hint === "offen" ? "open" : item.hint === "bezahlt" ? "paid" : "cancelled"}`}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.hint}</small>
                </div>)}
            </div>
            <p className="module-hint">Die Ampel soll Schülern zeigen, welche Rechnungen nur erfasst wurden, welche bearbeitet werden müssen und welche bereits abgeschlossen sind.</p>
        </section>
        <section className="buchhaltung-liste">
            <h2>Offene-Posten-Liste</h2>
            {offeneRechnungen.length === 0 ? <p>Zurzeit sind keine Rechnungen offen.</p> :
                <ul>{offenePosten.map(rechnung => <li key={rechnung.id}><Link className="detail-link" to={`/rechnungen?focus=${rechnung.rechnungsnr}`}><strong>{rechnung.rechnungsnr}</strong></Link> – {rechnung.kunde} · {rechnung.rechnungstyp} · {rechnung.faelligAm || "ohne Fälligkeit"} · {rechnung.ampel}: {euro(Number(rechnung.betrag))}</li>)}</ul>}
            <p>Didaktische Einordnung: Ausgangsrechnungen betreffen Kunden, Eingangsrechnungen betreffen Lieferanten. Die Statusampel unterscheidet offen, fällig und bezahlt.</p>
            <div className="link-list">
                <Link className="button-link" to="/firmenkonto">Zum Firmenkonto</Link>
                <Link className="button-link" to="/rechnungen">Zur Rechnungsverwaltung</Link>
                <Link className="button-link" to="/zahlungen">Zu den Zahlungen</Link>
                <Link className="button-link" to="/mahnungen">Zu den Mahnungen</Link>
                <Link className="button-link" to="/belege">Zum Belegarchiv</Link>
            </div>
        </section>
        <section className="buchhaltung-liste">
            <h2>Belegfluss</h2>
            <p>Die Übersicht zeigt vereinfacht, welche Rechnungen bereits durch Belege, Zahlungsnachweise oder Mahndokumente ergänzt wurden.</p>
            <ul>
                {belegeProRechnung.map(rechnung => <li key={rechnung.rechnungsnr}>
                    <Link className="detail-link" to={`/belege?bezug=${rechnung.rechnungsnr}`}><strong>{rechnung.rechnungsnr}</strong></Link> – {rechnung.kunde}: {rechnung.belege.length === 0 ? "kein Beleg hinterlegt" : `${rechnung.belege.length} Beleg(e) vorhanden`}
                    {rechnung.belege.length > 0 && <small> ({rechnung.belege.map(item => item.typ).join(", ")})</small>}
                </li>)}
            </ul>
        </section>
    </>;
}
