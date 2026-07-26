import { Link } from "react-router-dom";
import rechnungenService from "../services/rechnungenService";

const euro = betrag => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(betrag);

export default function Buchhaltung() {
    const rechnungen = rechnungenService.getAll();
    const offeneRechnungen = rechnungen.filter(rechnung => rechnung.status === "offen");
    const bezahlteRechnungen = rechnungen.filter(rechnung => rechnung.status === "bezahlt");
    const offen = offeneRechnungen.reduce((summe, rechnung) => summe + Number(rechnung.betrag), 0);
    const bezahlt = bezahlteRechnungen.reduce((summe, rechnung) => summe + Number(rechnung.betrag), 0);

    return <>
        <h1>Buchhaltungsübersicht</h1>
        <p>Übersicht über Rechnungen und den aktuellen Zahlungsstatus.</p>
        <div className="kennzahlen">
            <div className="kennzahl"><span>Offene Rechnungen</span><strong>{offeneRechnungen.length}</strong><small>{euro(offen)}</small></div>
            <div className="kennzahl"><span>Bezahlte Rechnungen</span><strong>{bezahlteRechnungen.length}</strong><small>{euro(bezahlt)}</small></div>
            <div className="kennzahl"><span>Rechnungen gesamt</span><strong>{rechnungen.length}</strong><small>{euro(offen + bezahlt)}</small></div>
        </div>
        <section className="buchhaltung-liste">
            <h2>Offene Rechnungen</h2>
            {offeneRechnungen.length === 0 ? <p>Zurzeit sind keine Rechnungen offen.</p> :
                <ul>{offeneRechnungen.map(rechnung => <li key={rechnung.id}><strong>{rechnung.rechnungsnr}</strong> – {rechnung.kunde}: {euro(Number(rechnung.betrag))}</li>)}</ul>}
            <div className="link-list">
                <Link className="button-link" to="/firmenkonto">Zum Firmenkonto</Link>
                <Link className="button-link" to="/rechnungen">Zur Rechnungsverwaltung</Link>
                <Link className="button-link" to="/zahlungen">Zu den Zahlungen</Link>
                <Link className="button-link" to="/mahnungen">Zu den Mahnungen</Link>
                <Link className="button-link" to="/belege">Zum Belegarchiv</Link>
            </div>
        </section>
    </>;
}
