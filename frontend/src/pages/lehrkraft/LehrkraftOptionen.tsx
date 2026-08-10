import OverviewCards from "../../components/OverviewCards";
import lehrkraftOptionenService from "../../services/lehrkraft/lehrkraftOptionenService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";

export default function LehrkraftOptionen() {
    useStorageSyncRefresh(["lehrkraftOptionen"]);

    const optionen = lehrkraftOptionenService.get();

    const toggle = (key: "autoLieferannahmeNach1Tag" | "autoDebitorenzahlungNach1Tag") => {
        lehrkraftOptionenService.update({
            [key]: !optionen[key]
        });
    };

    return <>
        <h1>Lehrkraft-Optionen</h1>
        <p>Diese Hilfsseite steuert automatische Vereinfachungen für die Lehrkraftsicht. Die Automatiken greifen beim Öffnen der Lehrkraftbereiche und können jederzeit wieder ausgeschaltet werden.</p>
        <OverviewCards cards={[
            { label: "Lieferannahme-Automatik", value: optionen.autoLieferannahmeNach1Tag ? "Ein" : "Aus" },
            { label: "Zahlungs-Automatik", value: optionen.autoDebitorenzahlungNach1Tag ? "Ein" : "Aus" }
        ]}/>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Kundenkorrespondenz</h2>
                    <span>Automatik</span>
                </div>
                <p>Wenn aktiv, werden Lieferannahmen in der Kundenkorrespondenz automatisch bestätigt, sobald seit dem Dokumentdatum mindestens ein Tag vergangen ist.</p>
                <button type="button" onClick={() => toggle("autoLieferannahmeNach1Tag")}>
                    {optionen.autoLieferannahmeNach1Tag ? "Ausschalten" : "Einschalten"}
                </button>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Zahlungen</h2>
                    <span>Automatik</span>
                </div>
                <p>Wenn aktiv, werden Debitorenzahlungen in der Lehrkraftsicht automatisch ausgeführt, sobald ihr Ausführungsdatum mindestens einen Tag zurückliegt.</p>
                <button type="button" onClick={() => toggle("autoDebitorenzahlungNach1Tag")}>
                    {optionen.autoDebitorenzahlungNach1Tag ? "Ausschalten" : "Einschalten"}
                </button>
            </article>
        </section>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Was das aktuell bringt</h2>
                <span>Quality of Life</span>
            </div>
            <ul className="dashboard-note-list">
                <li>Weniger manuelle Klicks für wiederkehrende externe Standardfälle.</li>
                <li>Lehrkraftsicht bleibt didaktisch steuerbar, weil jede Automatik separat ein- und ausschaltbar ist.</li>
                <li>Die Schülerprozesse selbst bleiben unverändert; nur die externe Reaktion wird vereinfacht.</li>
            </ul>
        </section>
    </>;
}
