import { useEffect, useState } from "react";
import Label from "../../components/form/Label";
import NumberField from "../../components/form/NumberField";
import fristenOptionenService from "../../services/verwaltung/fristenOptionenService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";

export default function Optionen() {
    const refreshTick = useStorageSyncRefresh(["fristenOptionen"]);
    const [optionen, setOptionen] = useState(() => fristenOptionenService.get());

    useEffect(() => {
        setOptionen(fristenOptionenService.get());
    }, [refreshTick]);

    const update = (
        key: "skontoTage" | "skontoProzent" | "angebotGfFreigabeAbweichungProzent" | "zahlungszielTage" | "zahlungserinnerungTage" | "mahnung1AbTage" | "mahnung2AbTage" | "inkassoAbTage",
        value: string
    ) => {
        const nextValue = fristenOptionenService.update({
            [key]: Number(value || 0)
        });
        setOptionen(nextValue);
    };

    const reset = () => {
        setOptionen(fristenOptionenService.reset());
    };

    return <>
        <h1>Optionen</h1>
        <p>Hier werden zentrale Einstellungen für Rechnungen und Freigaberegeln gepflegt.</p>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Rechnung</h2>
                <span>Einstellungen</span>
            </div>
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                    <tr>
                        <th>Eintrag</th>
                        <th>Wert</th>
                        <th>Hinweis</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td><Label>Skonto in Prozent</Label></td>
                        <td><NumberField value={optionen.skontoProzent} min="0" step="0.1" format="percent" onChange={value => update("skontoProzent", value)}/></td>
                        <td>Zum Beispiel 2 % Skonto.</td>
                    </tr>
                    <tr>
                        <td><Label>Skonto in Tagen</Label></td>
                        <td><NumberField value={optionen.skontoTage} min="0" onChange={value => update("skontoTage", value)}/></td>
                        <td>Skonto gilt bis zu dieser Anzahl Tage nach Rechnungszustellung.</td>
                    </tr>
                    <tr>
                        <td><Label>GF-Freigabe ab Abweichung in Prozent</Label></td>
                        <td><NumberField value={optionen.angebotGfFreigabeAbweichungProzent} min="0" step="0.1" format="percent" onChange={value => update("angebotGfFreigabeAbweichungProzent", value)}/></td>
                        <td>Bei Angeboten wird automatisch eine GF-Freigabe gesetzt, wenn die Abweichung zur Artikelsumme diesen Wert erreicht oder überschreitet.</td>
                    </tr>
                    <tr>
                        <td><Label>Fälligkeit in Tagen</Label></td>
                        <td><NumberField value={optionen.zahlungszielTage} min="0" onChange={value => update("zahlungszielTage", value)}/></td>
                        <td>Die Rechnung ist nach dieser Anzahl Tage ab Zustellung fällig.</td>
                    </tr>
                    <tr>
                        <td><Label>Zahlungserinnerung ab Tagen</Label></td>
                        <td><NumberField value={optionen.zahlungserinnerungTage} min="0" onChange={value => update("zahlungserinnerungTage", value)}/></td>
                        <td>Ab dieser Anzahl Tage nach Rechnungszustellung erscheint der Vorgang bei Zahlungserinnerung.</td>
                    </tr>
                    <tr>
                        <td><Label>1. Mahnung nach Fälligkeit</Label></td>
                        <td><NumberField value={optionen.mahnung1AbTage} min="0" onChange={value => update("mahnung1AbTage", value)}/></td>
                        <td>Ab dieser Anzahl Tage nach Fälligkeit beginnt die 1. Mahnstufe.</td>
                    </tr>
                    <tr>
                        <td><Label>2. Mahnung nach Fälligkeit</Label></td>
                        <td><NumberField value={optionen.mahnung2AbTage} min="0" onChange={value => update("mahnung2AbTage", value)}/></td>
                        <td>Liegt immer nach der 1. Mahnstufe und wird nach Fälligkeit gerechnet.</td>
                    </tr>
                    <tr>
                        <td><Label>Inkasso nach Fälligkeit</Label></td>
                        <td><NumberField value={optionen.inkassoAbTage} min="0" onChange={value => update("inkassoAbTage", value)}/></td>
                        <td>Liegt immer nach der 2. Mahnstufe und wird nach Fälligkeit gerechnet.</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Standardwerte</h2>
                <span>Aktion</span>
            </div>
            <p>Die Ausgangswerte kommen zentral aus <code>backend/seed/optionenDefault.json</code> und lassen sich dort jederzeit anpassen.</p>
            <button type="button" onClick={reset}>Standardwerte wiederherstellen</button>
        </section>
    </>;
}
