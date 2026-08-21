import { Link } from "react-router-dom";
import OverviewCards from "../../components/OverviewCards";
import DataTable from "../../components/DataTable";
import kundenService from "../../services/verkauf/customerService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";

const euro = betrag => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(betrag || 0));

function berechneKlasse(anteil) {
    if (anteil >= 0.7) return "A";
    if (anteil >= 0.4) return "B";
    return "C";
}

export default function ABCAnalyse() {
    useDataSyncRefresh(["kunden", "auftraege"]);

    const kunden = kundenService.getAll();
    const auftraege = auftraegeService.list();

    const kundenAnalyse = kunden.map(kunde => {
        const kundenAuftraege = auftraege.filter(auftrag => String(auftrag.kundeId) === String(kunde.id));
        const umsatz = kundenAuftraege.reduce((summe, auftrag) => summe + Number(auftrag.gesamtbetrag || 0), 0);

        return {
            id: kunde.id,
            kunde: kunde.firma,
            kundenNr: kunde.kundenNr,
            segment: kunde.segment || "-",
            auftragsAnzahl: kundenAuftraege.length,
            umsatz
        };
    }).sort((a, b) => b.umsatz - a.umsatz);

    const gesamtUmsatz = kundenAnalyse.reduce((summe, item) => summe + item.umsatz, 0);
    let kumuliert = 0;

    const analyseDaten = kundenAnalyse.map(item => {
        kumuliert += item.umsatz;
        const umsatzAnteil = gesamtUmsatz > 0 ? item.umsatz / gesamtUmsatz : 0;
        const kumulierterAnteil = gesamtUmsatz > 0 ? kumuliert / gesamtUmsatz : 0;

        return {
            ...item,
            abc: berechneKlasse(kumulierterAnteil),
            umsatzLabel: euro(item.umsatz),
            umsatzAnteilLabel: `${(umsatzAnteil * 100).toFixed(1)} %`,
            kumulierterAnteilLabel: `${(kumulierterAnteil * 100).toFixed(1)} %`
        };
    });

    const aKunden = analyseDaten.filter(item => item.abc === "A");
    const bKunden = analyseDaten.filter(item => item.abc === "B");
    const cKunden = analyseDaten.filter(item => item.abc === "C");

    return <>
        <h1>ABC-Analyse</h1>
        <p>Die Buchhaltung bewertet Kunden nach Umsatz und Anzahl der Aufträge. Die Tabelle kann direkt nach Umsatz oder Auftragsanzahl sortiert werden.</p>

        <OverviewCards cards={[
            { label: "Kunden gesamt", value: analyseDaten.length },
            { label: "Gesamtumsatz", value: euro(gesamtUmsatz) },
            { label: "A-Kunden", value: aKunden.length, note: "hoher Umsatzanteil" },
            { label: "B-Kunden", value: bKunden.length, note: "mittlerer Umsatzanteil" },
            { label: "C-Kunden", value: cKunden.length, note: "restlicher Umsatzanteil" }
        ]}/>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Auswertung</h2>
                    <span>Buchhaltung</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Grundlage sind die vorhandenen Aufträge aus dem Verkauf.</li>
                    <li>Die ABC-Klasse wird aus dem kumulierten Umsatzanteil abgeleitet.</li>
                    <li>Zusätzlich ist die Anzahl der Aufträge je Kunde sichtbar.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Schnellzugriffe</h2>
                    <span>Weiterarbeiten</span>
                </div>
                <div className="link-list">
                    <Link className="button-link" to="/buchhaltung">Zur Buchhaltung</Link>
                    <Link className="button-link" to="/kunden">Zu den Kunden</Link>
                    <Link className="button-link" to="/auftraege">Zu den Aufträgen</Link>
                </div>
            </article>
        </section>

        <DataTable
            title="Kunden nach ABC-Analyse"
            selectableColumns={false}
            showDetails={false}
            data={analyseDaten}
            columns={[
                { field: "abc", title: "ABC" },
                { field: "kundenNr", title: "Kundennummer" },
                { field: "kunde", title: "Kunde" },
                { field: "segment", title: "Kategorie" },
                { field: "auftragsAnzahl", title: "Anzahl Aufträge" },
                { field: "umsatzLabel", title: "Umsatz" },
                { field: "umsatzAnteilLabel", title: "Umsatzanteil" },
                { field: "kumulierterAnteilLabel", title: "Kumuliert" }
            ]}
        />
    </>;
}
