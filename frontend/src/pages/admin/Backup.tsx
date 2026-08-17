import { resetTestData } from "../../services/mockup/mockStorage";

export default function Backup() {
    const testdatenZuruecksetzen = () => {
        if (!confirm("Alle lokalen Testdaten werden zurückgesetzt. Fortfahren")) return;
        resetTestData();
        window.location.reload();
    };

    return <>
        <h1>Backup</h1>
        <p>Diese Seite dient aktuell als Vorlage für spätere Sicherungs- und Wiederherstellungsfunktionen.</p>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Testdaten</h2>
                <span>Aktiv</span>
            </div>
            <p>
                Der Reset der Testdaten wurde aus dem Dashboard hierher verschoben.
                Im Datenbank-Modus wird der Server-Reset ausgelöst, im Mock-Modus werden lokale Testdaten gelöscht.
            </p>
            <div className="thread-document-links">
                <button type="button" className="button-secondary" onClick={testdatenZuruecksetzen}>Testdaten zurücksetzen</button>
            </div>
        </section>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Datensicherung</h2>
                <span>Platzhalter</span>
            </div>
            <p>
                Die Funktionen sind bewusst noch nicht aktiv. Die Oberfläche bleibt aber schon sichtbar,
                damit der spätere Ablauf für Unterricht und Demo vorbereitet ist.
            </p>
            <div className="thread-document-links">
                <button type="button" disabled>Backup herunterladen</button>
                <button type="button" className="button-secondary" disabled>Backup wiederherstellen</button>
            </div>
            <p style={{ textDecoration: "line-through", opacity: 0.7 }}>
                JSON-Export und Restore sind in dieser Demo-Version noch deaktiviert.
            </p>
        </section>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Geplante Funktionen</h2>
                <span>Ausblick</span>
            </div>
            <ul className="module-list">
                <li>Backup-Datei herunterladen</li>
                <li>Backup-Datei auswählen und wiederherstellen</li>
                <li>Status- und Fehlerhinweise für Lehrkraft und Admin</li>
            </ul>
        </section>
    </>;
}
