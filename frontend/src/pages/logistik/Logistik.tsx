import { Link } from "react-router-dom";
import artikelService from "../../services/logistik/artikelService";
import bestellungenService from "../../services/einkauf/bestellungenService";
import retourenService from "../../services/logistik/retourenService";
import versandService from "../../services/logistik/versandService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import { getOpenGoodsReceiptOrders, getOrdersWithoutShipment } from "../../utils/processFlow";

export default function Logistik() {
    useStorageSyncRefresh(["artikel", "bestellungen", "versandauftraege", "retouren", "auftraege"]);

    const artikel = artikelService.list();
    const bestellungen = bestellungenService.list();
    const versandauftraege = versandService.list();
    const retouren = retourenService.list();
    const auftraege = auftraegeService.list();
    const vertriebsdokumente = vertriebsdokumenteService.list();

    const niedrigeBestaende = artikel.filter(item => Number(item.bestand) < 10).length;
    const offeneWareneingaenge = getOpenGoodsReceiptOrders(bestellungen).length;
    const vorbereiteteSendungen = versandauftraege.filter(item => item.status === "in Vorbereitung").length;
    const offeneRetouren = retouren.filter(item => item.status !== "abgeschlossen").length;
    const offeneAuftraegeOhneVersand = getOrdersWithoutShipment(auftraege, vertriebsdokumente, versandauftraege).length;

    return <>
        <h1>Logistik</h1>
        <p>Modul fuer Bestand, Wareneingang, Versand und Retouren. Die Seite macht sichtbar, wie Material- und Warenbewegungen zwischen Einkauf, Lager und Vertrieb zusammenhaengen.</p>

        <div className="kennzahlen">
            <div className="kennzahl"><span>Niedrige Bestaende</span><strong>{niedrigeBestaende}</strong><small>Bestand beobachten</small></div>
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
                    <li>Wareneingaenge aus dem Einkauf pruefen und buchen.</li>
                    <li>Bestaende beobachten und Engpaesse erkennen.</li>
                    <li>Reservierte Mengen aus aktiven Auftraegen mitdenken.</li>
                    <li>Versandauftraege aus dem Verkauf vorbereiten und abschliessen.</li>
                    <li>Retouren dokumentieren und als Folgeprozess sauber beenden.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Zusammenhänge</h2>
                    <span>Bereichsübergreifend</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Versendete Bestellungen wirken direkt auf Wareneingaenge und Bestaende.</li>
                    <li>Offene Auftraege fuehren zu Versandauftraegen im Logistikbereich.</li>
                    <li>Reservierte Mengen senken den verfuegbaren Bestand bereits vor dem Versand.</li>
                    <li>Retouren koennen Service, Reklamation und Ersatzlieferung ausloesen.</li>
                </ul>
                <div className="link-list">
                    <Link className="button-link" to="/bestand">Bestand oeffnen</Link>
                    <Link className="button-link" to="/kategorien">Kategorien oeffnen</Link>
                    <Link className="button-link" to="/wareneingaenge">Wareneingaenge oeffnen</Link>
                    <Link className="button-link" to="/versand">Versand oeffnen</Link>
                </div>
            </article>
        </section>

        <section className="module-panel">
            <h2>Direkte Einstiege</h2>
            <div className="link-list">
                <Link className="button-link" to="/bestand">Bestand</Link>
                <Link className="button-link" to="/artikel">Artikel</Link>
                <Link className="button-link" to="/kategorien">Kategorien</Link>
                <Link className="button-link" to="/wareneingaenge">Wareneingaenge</Link>
                <Link className="button-link" to="/versand">Versand</Link>
                <Link className="button-link" to="/retouren">Retouren</Link>
            </div>
        </section>
    </>;
}
