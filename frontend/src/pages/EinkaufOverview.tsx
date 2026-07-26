import { Link } from "react-router-dom";
import artikelService from "../services/artikelService";
import bestellungenService from "../services/bestellungenService";
import einkaufsdokumenteService from "../services/einkaufsdokumenteService";
import lieferantenService from "../services/lieferantenService";

export default function EinkaufOverview() {
    const lieferanten = lieferantenService.list();
    const bestellungen = bestellungenService.list();
    const dokumente = einkaufsdokumenteService.list();
    const artikel = artikelService.list();

    const offeneBestellungen = bestellungen.filter(item => item.status === "offen").length;
    const bewerteteLieferanten = lieferanten.filter(item => Number(item.bewertung || 0) > 0).length;
    const kritischeBestaende = artikel.filter(item => Number(item.bestand) < 10).length;
    const offeneDokumente = dokumente.filter(item => item.status === "Entwurf").length;

    return <>
        <h1>Einkauf</h1>
        <p>Modul für den einfachen Einkaufsprozess. Hier soll nachvollziehbar werden, wie aus einem Bedarf eine Anfrage, ein Vergleich, eine Bestellung und am Ende ein dokumentierter Wareneingang wird.</p>

        <div className="kennzahlen">
            <div className="kennzahl"><span>Lieferanten</span><strong>{lieferanten.length}</strong><small>{bewerteteLieferanten} bewertet</small></div>
            <div className="kennzahl"><span>Bestellungen</span><strong>{bestellungen.length}</strong><small>{offeneBestellungen} offen</small></div>
            <div className="kennzahl"><span>Einkaufsdokumente</span><strong>{dokumente.length}</strong><small>{offeneDokumente} Entwürfe</small></div>
            <div className="kennzahl"><span>Kritische Bestände</span><strong>{kritischeBestaende}</strong><small>Bedarfsmeldung möglich</small></div>
        </div>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Einkaufsreihenfolge</h2>
                    <span>Lernkette</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Bedarf erkennen, wenn Artikelbestand oder Meldebestand kritisch ist.</li>
                    <li>Anfrage formulieren und Angebote von Lieferanten vergleichen.</li>
                    <li>Bestellung anlegen und Lieferant bewusst auswählen.</li>
                    <li>Wareneingang dokumentieren und Lagerbestand aktualisieren.</li>
                    <li>Bei Problemen Reklamation oder Reklamationsschreiben ergänzen.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Dokumente im Einkauf</h2>
                    <span>Mockup-Vorlagen</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Bedarfsmeldung</li>
                    <li>Anfrage</li>
                    <li>Angebotsvergleich</li>
                    <li>Bestellung</li>
                    <li>Warenannahmeprotokoll</li>
                    <li>Reklamationsschreiben</li>
                </ul>
                <div className="link-list">
                    <Link className="button-link" to="/einkaufsdokumente">Einkaufsdokumente öffnen</Link>
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
                <Link className="button-link" to="/einkaufsdokumente">Einkaufsdokumente</Link>
                <Link className="button-link" to="/wareneingaenge">Wareneingänge</Link>
                <Link className="button-link" to="/lager">Lager</Link>
            </div>
        </section>
    </>;
}
