import { Link } from "react-router-dom";
import artikelService from "../../services/logistik/artikelService";
import bestellungenService from "../../services/einkauf/bestellungenService";
import lieferantenService from "../../services/einkauf/lieferantenService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";

export default function EinkaufOverview() {
    useStorageSyncRefresh(["lieferanten", "bestellungen", "artikel"]);

    const lieferanten = lieferantenService.list();
    const bestellungen = bestellungenService.list();
    const artikel = artikelService.list();

    const offeneAnfragen = bestellungen.filter(item => item.status === "angefragt").length;
    const bestaetigteAnfragen = bestellungen.filter(item => item.status === "bestaetigt").length;
    const versendeteBestellungen = bestellungen.filter(item => item.status === "versendet").length;
    const bewerteteLieferanten = lieferanten.filter(item => Number(item.bewertung || 0) > 0).length;
    const kritischeBestaende = artikel.filter(item => Number(item.bestand) < 10).length;
    const eingegangeneBestellungen = bestellungen.filter(item => item.status === "eingegangen").length;

    return <>
        <h1>Einkauf</h1>
        <p>Der Einkauf bleibt bewusst einfach: Die Schuelerfirma fragt benoetigte Artikel an, die Lehrkraft bestaetigt und versendet die Bestellung, danach buchen die Schueler den Wareneingang. Mit dem bestaetigten Wareneingang erscheint anschliessend die Eingangsrechnung in der Buchhaltung.</p>

        <div className="kennzahlen">
            <div className="kennzahl"><span>Lieferanten</span><strong>{lieferanten.length}</strong><small>{bewerteteLieferanten} bewertet</small></div>
            <div className="kennzahl"><span>Anfragen offen</span><strong>{offeneAnfragen}</strong><small>{bestaetigteAnfragen} bestaetigt</small></div>
            <div className="kennzahl"><span>Versand / Wareneingang</span><strong>{versendeteBestellungen}</strong><small>{eingegangeneBestellungen} gebucht</small></div>
            <div className="kennzahl"><span>Kritische Bestände</span><strong>{kritischeBestaende}</strong><small>Bedarfsmeldung möglich</small></div>
        </div>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header"><h2>Einfache Reihenfolge</h2><span>Ablauf</span></div>
                <ul className="dashboard-note-list">
                    <li>Artikelbedarf feststellen und passenden Lieferanten auswaehlen.</li>
                    <li>Einkaufsanfrage mit einem oder mehreren Artikeln anlegen.</li>
                    <li>Lehrkraft bestaetigt und versendet die Bestellung.</li>
                    <li>Wareneingang buchen und Bestand automatisch erhoehen.</li>
                    <li>Danach erscheint die Eingangsrechnung in der Buchhaltung.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header"><h2>Lehrkraft im Prozess</h2><span>Externe Seite</span></div>
                <p>Die Lehrkraft ist der Gegenpart zum Einkauf. Sie prueft offene Anfragen, bestaetigt sie und markiert sie anschliessend als versendet.</p>
                <ul className="dashboard-note-list">
                    <li>{offeneAnfragen} Anfragen warten noch auf Bestaetigung.</li>
                    <li>{bestaetigteAnfragen} bestaetigte Bestellungen koennen versendet werden.</li>
                    <li>{versendeteBestellungen} versendete Bestellungen warten auf Wareneingang.</li>
                </ul>
                <div className="link-list">
                    <Link className="button-link" to="/lehrkraft/lieferantenkorrespondenz">Lieferantenkorrespondenz öffnen</Link>
                    <Link className="button-link" to="/wareneingaenge">Wareneingänge öffnen</Link>
                </div>
            </article>
        </section>

        <section className="module-panel">
            <h2>Direkte Einstiege</h2>
            <div className="link-list">
                <Link className="button-link" to="/lieferanten">Lieferanten</Link>
                <Link className="button-link" to="/lieferantenvergleich">Lieferantenvergleich</Link>
                <Link className="button-link" to="/bestellungen">Bestellungen</Link>
                <Link className="button-link" to="/wareneingaenge">Wareneingänge</Link>
                <Link className="button-link" to="/lager">Lager</Link>
            </div>
        </section>
    </>;
}
