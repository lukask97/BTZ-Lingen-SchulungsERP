import { Link } from "react-router-dom";
import artikelService from "../services/artikelService";
import bestellungenService from "../services/bestellungenService";
import retourenService from "../services/retourenService";
import versandService from "../services/versandService";
import auftraegeService from "../services/auftraegeService";

export default function Logistik() {
    const artikel = artikelService.list();
    const bestellungen = bestellungenService.list();
    const versandauftraege = versandService.list();
    const retouren = retourenService.list();
    const auftraege = auftraegeService.list();

    const niedrigeBestaende = artikel.filter(item => Number(item.bestand) < 10).length;
    const offeneWareneingaenge = bestellungen.filter(item => item.status === "offen").length;
    const vorbereiteteSendungen = versandauftraege.filter(item => item.status === "in Vorbereitung").length;
    const offeneRetouren = retouren.filter(item => item.status !== "abgeschlossen").length;
    const offeneAuftraegeOhneVersand = auftraege.filter(auftrag => !versandauftraege.some(item => String(item.auftragId) === String(auftrag.id))).length;

    return <>
        <h1>Logistik</h1>
        <p>Modul für Lager, Wareneingang, Versand und Retouren. Die Seite macht sichtbar, wie Material- und Warenbewegungen zwischen Einkauf, Lager und Vertrieb zusammenhängen.</p>

        <div className="kennzahlen">
            <div className="kennzahl"><span>Niedrige Bestände</span><strong>{niedrigeBestaende}</strong><small>Lager beobachten</small></div>
            <div className="kennzahl"><span>Offene Wareneingänge</span><strong>{offeneWareneingaenge}</strong><small>Einkauf abschließen</small></div>
            <div className="kennzahl"><span>Versandaufträge</span><strong>{versandauftraege.length}</strong><small>{vorbereiteteSendungen} in Vorbereitung</small></div>
            <div className="kennzahl"><span>Aufträge ohne Versand</span><strong>{offeneAuftraegeOhneVersand}</strong><small>Vertrieb übergeben</small></div>
            <div className="kennzahl"><span>Retouren</span><strong>{retouren.length}</strong><small>{offeneRetouren} offen</small></div>
        </div>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Logistikkette</h2>
                    <span>Lernkette</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Wareneingänge aus dem Einkauf prüfen und buchen.</li>
                    <li>Lagerbestände beobachten und Engpässe erkennen.</li>
                    <li>Versandaufträge aus dem Verkauf vorbereiten und abschließen.</li>
                    <li>Retouren dokumentieren und als Folgeprozess sauber beenden.</li>
                    <li>Kennzahlen nutzen, um Materialfluss und Arbeitsstand zu verstehen.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Zusammenhänge</h2>
                    <span>Bereichsübergreifend</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Offene Bestellungen wirken direkt auf Wareneingänge und Bestände.</li>
                    <li>Offene Aufträge führen zu Versandaufträgen im Logistikbereich.</li>
                    <li>Retouren können Service, Reklamation und Ersatzlieferung auslösen.</li>
                </ul>
                <div className="link-list">
                    <Link className="button-link" to="/wareneingaenge">Wareneingänge öffnen</Link>
                    <Link className="button-link" to="/versand">Versand öffnen</Link>
                    <Link className="button-link" to="/retouren">Retouren öffnen</Link>
                </div>
            </article>
        </section>

        <section className="module-panel">
            <h2>Direkte Einstiege</h2>
            <div className="link-list">
                <Link className="button-link" to="/lager">Lager</Link>
                <Link className="button-link" to="/artikel">Artikelbestand</Link>
                <Link className="button-link" to="/wareneingaenge">Wareneingänge</Link>
                <Link className="button-link" to="/versand">Versand</Link>
                <Link className="button-link" to="/retouren">Retouren</Link>
            </div>
        </section>
    </>;
}
