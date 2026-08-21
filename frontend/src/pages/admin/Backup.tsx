import lehrkraftOptionenService from "../../services/lehrkraft/lehrkraftOptionenService";
import { resetSeedData } from "../../services/seed/dataSync";
import fristenOptionenService from "../../services/verwaltung/fristenOptionenService";
import nummernkreiseService from "../../services/verwaltung/nummernkreiseService";
import unternehmenService from "../../services/verwaltung/unternehmenService";

export default function Backup() {
    const testdatenZuruecksetzen = () => {
        if (!confirm("Alle Demo- und Seed-Daten werden auf den hinterlegten Stand zurueckgesetzt. Fortfahren?")) return;
        resetSeedData();
        window.location.reload();
    };

    const bereichZuruecksetzen = (label: string, action: () => void) => {
        if (!confirm(`${label} auf die hinterlegten Standardwerte zuruecksetzen?`)) return;
        action();
        window.location.reload();
    };

    return <>
        <h1>Backup</h1>
        <p>Diese Seite buendelt globale Ruecksetzungen und spaetere Sicherungsfunktionen.</p>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Testdaten</h2>
                <span>Aktiv</span>
            </div>
            <p>
                Der Reset der Testdaten wurde aus dem Dashboard hierher verschoben.
                Er laedt die zentralen Seed-Daten aus dem Backend erneut in die Datenbank.
            </p>
            <div className="thread-document-links">
                <button type="button" className="button-secondary" onClick={testdatenZuruecksetzen}>Testdaten zuruecksetzen</button>
            </div>
        </section>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Einzelne Bereiche zuruecksetzen</h2>
                <span>Lehrkraft / Verwaltung</span>
            </div>
            <p>
                Damit lassen sich gezielt nur die Bereiche zuruecksetzen, die mit Standardwerten aus
                <code> backend/seed/optionenDefault.json </code> arbeiten.
            </p>
            <div className="thread-document-links" style={{ flexWrap: "wrap" }}>
                <button type="button" className="button-secondary" onClick={() => bereichZuruecksetzen("Unternehmen", () => unternehmenService.reset())}>
                    Unternehmen zuruecksetzen
                </button>
                <button type="button" className="button-secondary" onClick={() => bereichZuruecksetzen("Optionen", () => fristenOptionenService.reset())}>
                    Optionen zuruecksetzen
                </button>
                <button type="button" className="button-secondary" onClick={() => bereichZuruecksetzen("Lehrkraft-Optionen", () => lehrkraftOptionenService.reset())}>
                    Lehrkraft-Optionen zuruecksetzen
                </button>
                <button type="button" className="button-secondary" onClick={() => bereichZuruecksetzen("Nummernkreise", () => nummernkreiseService.reset())}>
                    Nummernkreise zuruecksetzen
                </button>
            </div>
        </section>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Datensicherung</h2>
                <span>Platzhalter</span>
            </div>
            <p>
                Die Funktionen sind bewusst noch nicht aktiv. Die Oberflaeche bleibt aber schon sichtbar,
                damit der spaetere Ablauf fuer Unterricht und Demo vorbereitet ist.
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
                <li>Backup-Datei auswaehlen und wiederherstellen</li>
                <li>Status- und Fehlerhinweise fuer Lehrkraft und Admin</li>
            </ul>
        </section>
    </>;
}
