import { useEffect, useMemo, useState } from "react";
import NumberField from "../../components/form/NumberField";
import Label from "../../components/form/Label";
import lehrkraftOptionenService from "../../services/lehrkraft/lehrkraftOptionenService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";

type LehrkraftTab = "lieferannahme" | "zahlungen";

type Zahlungsregel = {
    id: string;
    startTag: number;
    endTag: number;
    gewichtung: number;
};

type ZahlungsregelDraft = {
    id: string;
    startTag: string;
    endTag: string;
    gewichtung: string;
};

function formatRuleLabel(regel: Zahlungsregel) {
    if (regel.startTag === 0 && regel.endTag === 0) {
        return "Keine Zahlung / Inkasso-Weiterleitung";
    }

    if (regel.startTag === regel.endTag) {
        return `Genau an Tag ${regel.startTag}`;
    }

    return `Zwischen Tag ${regel.startTag} und ${regel.endTag}`;
}

function sortRulesByStartTag(regeln: Zahlungsregel[]) {
    return [...regeln].sort((a, b) => {
        if (a.startTag !== b.startTag) return a.startTag - b.startTag;
        if (a.endTag !== b.endTag) return a.endTag - b.endTag;
        return a.gewichtung - b.gewichtung;
    });
}

function toDrafts(regeln: Zahlungsregel[]): ZahlungsregelDraft[] {
    return regeln.map(regel => ({
        id: regel.id,
        startTag: String(regel.startTag),
        endTag: String(regel.endTag),
        gewichtung: String(regel.gewichtung)
    }));
}

export default function LehrkraftOptionen() {
    const refreshTick = useStorageSyncRefresh(["lehrkraftOptionen"]);

    const [optionen, setOptionen] = useState(() => lehrkraftOptionenService.get());
    const [activeTab, setActiveTab] = useState<LehrkraftTab>("lieferannahme");
    const tabs = [
        { key: "lieferannahme" as LehrkraftTab, label: "Lieferannahme" },
        { key: "zahlungen" as LehrkraftTab, label: "Zahlungs-Automatik" }
    ];
    const regeln = sortRulesByStartTag(optionen.debitorenzahlungRegeln as Zahlungsregel[]);
    const [regelDrafts, setRegelDrafts] = useState<ZahlungsregelDraft[]>(() => toDrafts(regeln));
    const regelSignature = useMemo(
        () => JSON.stringify(regeln.map(regel => ({
            id: regel.id,
            startTag: regel.startTag,
            endTag: regel.endTag,
            gewichtung: regel.gewichtung
        }))),
        [regeln]
    );
    const gesamtgewicht = useMemo(
        () => regeln.reduce((sum, regel) => sum + Number(regel.gewichtung || 0), 0),
        [regeln]
    );

    useEffect(() => {
        setOptionen(lehrkraftOptionenService.get());
    }, [refreshTick]);

    useEffect(() => {
        setRegelDrafts(toDrafts(regeln));
    }, [regelSignature]);

    const toggle = (key: "autoLieferannahmeNach1Tag" | "autoDebitorenzahlungNach1Tag") => {
        setOptionen(lehrkraftOptionenService.update({
            [key]: !optionen[key]
        }));
    };

    const updateRegel = (id: string, key: "startTag" | "endTag" | "gewichtung", value: string) => {
        setRegelDrafts(current => current.map(regel => regel.id === id ? { ...regel, [key]: value } : regel));
    };

    const commitRegel = (id: string, key: "startTag" | "endTag" | "gewichtung") => {
        const draft = regelDrafts.find(regel => regel.id === id);
        if (!draft) return;
        const startTagValue = Number(draft.startTag || 0);
        const endTagValue = Number(draft.endTag || 0);
        const gewichtungValue = Number(draft.gewichtung || 0);

        setOptionen(lehrkraftOptionenService.update({
            debitorenzahlungRegeln: regeln.map(regel => {
                if (regel.id !== id) return regel;

                if (startTagValue === 0 && endTagValue === 0) {
                    return {
                        ...regel,
                        startTag: 0,
                        endTag: 0,
                        gewichtung: key === "gewichtung" ? gewichtungValue : regel.gewichtung
                    };
                }

                return {
                    ...regel,
                    startTag: key === "startTag" ? startTagValue : regel.startTag,
                    endTag: key === "endTag" ? endTagValue : regel.endTag,
                    gewichtung: key === "gewichtung" ? gewichtungValue : regel.gewichtung
                };
            })
        }));
    };

    const addRegel = () => {
        setOptionen(lehrkraftOptionenService.update({
            debitorenzahlungRegeln: [
                ...regeln,
                {
                    id: `regel-${Date.now()}`,
                    startTag: 1,
                    endTag: 1,
                    gewichtung: 1
                }
            ]
        }));
    };

    const removeRegel = (id: string) => {
        if (regeln.length <= 1) return;
        setOptionen(lehrkraftOptionenService.update({
            debitorenzahlungRegeln: regeln.filter(regel => regel.id !== id)
        }));
    };

    return <>
        <h1>Lehrkraft-Optionen</h1>
        <p>Diese Hilfsseite steuert automatische Vereinfachungen für die Lehrkraftsicht. Ziel ist, dass Standardfälle möglichst ohne Zusatzarbeit abgefangen werden und die Lehrkraft nur noch bei echten Ausnahmen eingreifen muss.</p>
        <div className="kennzahlen" role="tablist" aria-label="Lehrkraft-Optionen">
            {tabs.map(tab => <button
                key={tab.key}
                type="button"
                className={`kennzahl kennzahl-button${activeTab === tab.key ? " is-active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
            >
                <span>{tab.label}</span>
            </button>)}
        </div>

        {activeTab === "lieferannahme" && <section className="dashboard-panel">
            <div className="dashboard-panel-header">
                <h2>Lieferannahme</h2>
                <span>{optionen.autoLieferannahmeNach1Tag ? "Ein" : "Aus"}</span>
            </div>
            <p>Wenn aktiv, werden Lieferannahmen in der Kundenkorrespondenz automatisch bestätigt. Die Verteilung ist fest: 1 Tag = 25 %, 2 Tage = 50 %, 3 Tage = 25 %.</p>
            <div className="lehrkraft-options-actions">
                <button type="button" onClick={() => toggle("autoLieferannahmeNach1Tag")}>
                    {optionen.autoLieferannahmeNach1Tag ? "Ausschalten" : "Einschalten"}
                </button>
            </div>
            <ul className="dashboard-note-list">
                <li>Typische Standardreaktionen laufen ohne zusätzliche Lehrkraft-Klicks durch.</li>
                <li>Der Ablauf bleibt didaktisch steuerbar, weil die Funktion jederzeit deaktiviert werden kann.</li>
                <li>Die Annahme erfolgt bewusst nicht sofort, sondern mit realistischer 1/2/3-Tage-Verteilung.</li>
            </ul>
        </section>}

        {activeTab === "zahlungen" && <>
            <section className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Debitorenzahlungen</h2>
                    <span>{optionen.autoDebitorenzahlungNach1Tag ? "Ein" : "Aus"}</span>
                </div>
                <p>Wenn aktiv, legt das System für übermittelte Ausgangsrechnungen automatisch eine terminierte Überweisung an. Die spätere Ausführung folgt dann der gewichteten Tagesverteilung. Eine Regel mit <strong>0</strong> simuliert bewusst den Fall, dass keine Zahlung eingeht und später eine Inkasso-Weiterleitung nötig wird.</p>
                <div className="lehrkraft-options-actions">
                    <button type="button" onClick={() => toggle("autoDebitorenzahlungNach1Tag")}>
                        {optionen.autoDebitorenzahlungNach1Tag ? "Ausschalten" : "Einschalten"}
                    </button>
                    <button type="button" className="button-secondary" onClick={addRegel}>
                        Regel hinzufügen
                    </button>
                </div>
            </section>

            <section className="module-panel">
                <div className="dashboard-panel-header">
                    <h2>Gewichtete Zahlungsregeln</h2>
                    <span>Erweiterbar</span>
                </div>
                <p>Beispiel: <code>1-3 | 10</code> bedeutet 10 Anteile für Zahlungen zwischen Tag 1 und 3. Innerhalb der Spanne wird gleich verteilt. <code>0 | 1</code> bedeutet: in 1 Anteil findet gar keine Zahlung statt.</p>
                <div className="lehrkraft-rule-list">
                    {regeln.map((regel, index) => {
                        const anteil = gesamtgewicht > 0 ? ((regel.gewichtung / gesamtgewicht) * 100).toFixed(1) : "0.0";
                        return <article key={regel.id} className="lehrkraft-rule-card">
                            <div className="lehrkraft-rule-header">
                                <strong>{formatRuleLabel(regel)}</strong>
                                <div className="lehrkraft-rule-header-actions">
                                    <small>{regel.gewichtung} von {gesamtgewicht} Fällen ({anteil} %)</small>
                                    <button type="button" className="button-danger" onClick={() => removeRegel(regel.id)} disabled={regeln.length <= 1}>
                                        Entfernen
                                    </button>
                                </div>
                            </div>
                            <div className="lehrkraft-rule-grid">
                                <div>
                                    <Label>Von Tag</Label>
                                    <NumberField
                                        value={regelDrafts.find(item => item.id === regel.id)?.startTag || String(regel.startTag)}
                                        min="0"
                                        onChange={value => updateRegel(regel.id, "startTag", value)}
                                        onBlur={() => commitRegel(regel.id, "startTag")}
                                    />
                                </div>
                                <div>
                                    <Label>Bis Tag</Label>
                                    <NumberField
                                        value={regelDrafts.find(item => item.id === regel.id)?.endTag || String(regel.endTag)}
                                        min="0"
                                        onChange={value => updateRegel(regel.id, "endTag", value)}
                                        onBlur={() => commitRegel(regel.id, "endTag")}
                                    />
                                </div>
                                <div>
                                    <Label>Gewichtung</Label>
                                    <NumberField
                                        value={regelDrafts.find(item => item.id === regel.id)?.gewichtung || String(regel.gewichtung)}
                                        min="1"
                                        onChange={value => updateRegel(regel.id, "gewichtung", value)}
                                        onBlur={() => commitRegel(regel.id, "gewichtung")}
                                    />
                                </div>
                            </div>
                        </article>;
                    })}
                </div>
            </section>

            <section className="module-panel">
                <div className="dashboard-panel-header">
                    <h2>Was das der Lehrkraft abnimmt</h2>
                    <span>Entlastung</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Sobald eine Ausgangsrechnung vorliegt, wird automatisch eine geplante Überweisung mit Termin erzeugt.</li>
                    <li>Wiederkehrende Zahlungseingänge werden automatisch über realistische Zeitfenster verteilt.</li>
                    <li>Ausreißer wie Nichtzahlung lassen sich bewusst mit einer 0-Regel simulieren, ohne einzelne Vorgänge manuell offen zu halten.</li>
                    <li>Die Lehrkraft muss dadurch weniger Belege einzeln nachfassen und kann stärker auf didaktische Sonderfälle schauen.</li>
                </ul>
            </section>
        </>}
    </>;
}
