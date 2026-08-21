import { useEffect, useMemo, useState } from "react";
import Label from "../../components/form/Label";
import TextField from "../../components/form/TextField";
import SaveButton from "../../components/SaveButton";
import unternehmenService from "../../services/verwaltung/unternehmenService";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";

const FIELD_GROUPS = [
    {
        key: "stammdaten",
        title: "Grunddaten",
        fields: [
            ["firmenname", "Firmenname"],
            ["branche", "Firma / Bereich"],
            ["unternehmerNr", "Unternehmer Nr."],
            ["unternehmensNr", "UnternehmensNr."]
        ]
    },
    {
        key: "stammdaten",
        title: "Adresse",
        fields: [
            ["strasse", "Strasse"],
            ["plzOrt", "PLZ / Ort"],
            ["bundesland", "Bundesland"]
        ]
    },
    {
        key: "stammdaten",
        title: "Kontakt",
        fields: [
            ["telefon", "Telefon"],
            ["mail", "Mail"]
        ]
    },
    {
        key: "register",
        title: "Register und Steuern",
        fields: [
            ["betriebsNr", "BetriebsNr."],
            ["handelsregisterNr", "HandelsregisterNr."],
            ["amtsgericht", "Amtsgericht"],
            ["finanzamtNr", "Finanzamtnummer"],
            ["steuernummer", "Steuernummer"],
            ["ustIdNr", "Ust-Id.-Nummer"]
        ]
    },
    {
        key: "konten",
        title: "Firmenkonto",
        fields: [
            ["firmaKontoname", "Kontoname"],
            ["firmaBankName", "Bank"],
            ["firmaIban", "IBAN"],
            ["firmaKontoNr", "Kontonummer"],
            ["firmaBic", "BIC"],
            ["firmaBlz", "BLZ"]
        ]
    },
    {
        key: "konten",
        title: "Verkaufskonto",
        fields: [
            ["verkaufKontoname", "Kontoname"],
            ["verkaufBankName", "Bank"],
            ["verkaufIban", "IBAN"],
            ["verkaufKontoNr", "Kontonummer"],
            ["verkaufBic", "BIC"],
            ["verkaufBlz", "BLZ"]
        ]
    },
    {
        key: "konten",
        title: "Einkaufskonto",
        fields: [
            ["einkaufKontoname", "Kontoname"],
            ["einkaufBankName", "Bank"],
            ["einkaufIban", "IBAN"],
            ["einkaufKontoNr", "Kontonummer"],
            ["einkaufBic", "BIC"],
            ["einkaufBlz", "BLZ"]
        ]
    }
];

const SECTION_TABS = [
    { key: "stammdaten", label: "Stammdaten", hint: "Firma, Adresse, Kontakt" },
    { key: "register", label: "Register", hint: "Steuern und Pflichtangaben" },
    { key: "konten", label: "Konten", hint: "Firma, Verkauf und Einkauf" }
] as const;

const WIDE_FIELDS = new Set([
    "firmenname",
    "branche",
    "strasse",
    "plzOrt",
    "mail",
    "firmaKontoname",
    "verkaufKontoname",
    "einkaufKontoname",
    "firmaIban",
    "verkaufIban",
    "einkaufIban"
]);

function safe(value: unknown) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

export default function Unternehmen() {
    const refreshTick = useDataSyncRefresh(["unternehmen"]);
    const [current, setCurrent] = useState(() => unternehmenService.get());
    const [activeSection, setActiveSection] = useState<(typeof SECTION_TABS)[number]["key"]>("stammdaten");

    useEffect(() => {
        setCurrent(unternehmenService.get());
    }, [refreshTick]);

    const visibleGroups = useMemo(
        () => FIELD_GROUPS.filter(group => group.key === activeSection),
        [activeSection]
    );

    const updateField = (field: string, value: string) => {
        setCurrent((item: Record<string, unknown>) => ({
            ...item,
            [field]: value
        }));
    };

    const speichern = () => {
        try {
            const saved = unternehmenService.save(current);
            setCurrent(saved);
            return true;
        } catch {
            return false;
        }
    };

    const alsPdfAnzeigen = () => {
        const popup = window.open("", "_blank", "width=1000,height=1300");
        if (!popup) return;

        const sections = [
            {
                title: "Unternehmensdaten",
                rows: [
                    ["Firmenname", current.firmenname],
                    ["Firma / Bereich", current.branche],
                    ["Unternehmer Nr.", current.unternehmerNr],
                    ["UnternehmensNr.", current.unternehmensNr],
                    ["Strasse", current.strasse],
                    ["PLZ / Ort", current.plzOrt],
                    ["Bundesland", current.bundesland],
                    ["Telefon", current.telefon],
                    ["Mail", current.mail]
                ]
            },
            {
                title: "Register und Steuern",
                rows: [
                    ["BetriebsNr.", current.betriebsNr],
                    ["HandelsregisterNr.", current.handelsregisterNr],
                    ["Amtsgericht", current.amtsgericht],
                    ["Finanzamtnummer", current.finanzamtNr],
                    ["Steuernummer", current.steuernummer],
                    ["USt-Id.-Nummer", current.ustIdNr]
                ]
            },
            {
                title: "Firmenkonto",
                rows: [
                    ["Kontoname", current.firmaKontoname],
                    ["Bank", current.firmaBankName],
                    ["IBAN", current.firmaIban],
                    ["Kontonummer", current.firmaKontoNr],
                    ["BIC", current.firmaBic],
                    ["BLZ", current.firmaBlz]
                ]
            },
            {
                title: "Verkaufskonto",
                rows: [
                    ["Kontoname", current.verkaufKontoname],
                    ["Bank", current.verkaufBankName],
                    ["IBAN", current.verkaufIban],
                    ["Kontonummer", current.verkaufKontoNr],
                    ["BIC", current.verkaufBic],
                    ["BLZ", current.verkaufBlz]
                ]
            },
            {
                title: "Einkaufskonto",
                rows: [
                    ["Kontoname", current.einkaufKontoname],
                    ["Bank", current.einkaufBankName],
                    ["IBAN", current.einkaufIban],
                    ["Kontonummer", current.einkaufKontoNr],
                    ["BIC", current.einkaufBic],
                    ["BLZ", current.einkaufBlz]
                ]
            }
        ];

        popup.document.write(`<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8" />
    <title>${safe(current.firmenname || "Unternehmen")}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 28px; color: #1f2937; background: #f6f7fb; }
        .actions { display: flex; gap: 12px; margin-bottom: 24px; }
        .actions button { border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; background: #111827; color: white; font-size: 14px; }
        .actions .secondary { background: #e5e7eb; color: #111827; }
        .cover { background: linear-gradient(135deg, #ffffff, #eef5ff); border: 1px solid #dbe3f1; border-radius: 18px; padding: 24px; margin-bottom: 20px; }
        .cover h1 { margin: 0 0 8px; font-size: 30px; }
        .cover p { margin: 0; color: #52607a; }
        .section { background: #fff; border: 1px solid #dbe3f1; border-radius: 14px; padding: 18px; margin-bottom: 16px; }
        .section h2 { margin: 0 0 14px; font-size: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: top; }
        th { width: 230px; color: #64748b; font-size: 13px; }
        tr:last-child th, tr:last-child td { border-bottom: none; }
        .footer { margin-top: 18px; color: #6b7280; font-size: 12px; }
        @media print {
            body { margin: 14px; background: #fff; }
            .actions { display: none; }
            .section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="actions">
        <button onclick="window.print()">Als PDF drucken</button>
        <button class="secondary" onclick="window.close()">Schließen</button>
    </div>
    <section class="cover">
        <h1>${safe(current.firmenname || "Unternehmen")}</h1>
        <p>Pflichtangaben und Kontodaten zur Ansicht und für den PDF-Druck.</p>
    </section>
    ${sections.map(section => `
        <section class="section">
            <h2>${safe(section.title)}</h2>
            <table>
                <tbody>
                    ${section.rows.map(([label, value]) => `
                        <tr>
                            <th>${safe(label)}</th>
                            <td>${safe(value || "-")}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </section>
    `).join("")}
    <p class="footer">Automatisch erzeugte Ansicht aus dem Schulungs-ERP.</p>
</body>
</html>`);
        popup.document.close();
        popup.focus();
    };

    return <>
        <h1>Unternehmen</h1>
        <p>Hier werden die zentralen Unternehmens- und Rechnungsangaben gepflegt. Die Bereiche sind kompakt getrennt, damit weniger gescrollt werden muss.</p>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Schnellauswahl</h2>
                <span>Bereiche</span>
            </div>
            <div className="unternehmen-tab-grid">
                {SECTION_TABS.map(tab => <button
                    key={tab.key}
                    type="button"
                    className={`unternehmen-tab${activeSection === tab.key ? " is-active" : ""}`}
                    onClick={() => setActiveSection(tab.key)}
                >
                    <strong>{tab.label}</strong>
                    <span>{tab.hint}</span>
                </button>)}
            </div>
            <div className="unternehmen-summary-grid">
                <div className="unternehmen-summary-card">
                    <span>Firma</span>
                    <strong>{String(current.firmenname || "-")}</strong>
                </div>
                <div className="unternehmen-summary-card">
                    <span>Ort</span>
                    <strong>{String(current.plzOrt || "-")}</strong>
                </div>
                <div className="unternehmen-summary-card">
                    <span>USt-ID</span>
                    <strong>{String(current.ustIdNr || "-")}</strong>
                </div>
                <div className="unternehmen-summary-card">
                    <span>Firmenkonto</span>
                    <strong>{String(current.firmaIban || "-")}</strong>
                </div>
            </div>
        </section>

        <div className="unternehmen-section-grid">
            {visibleGroups.map(group => <section key={group.title} className="module-panel unternehmen-section-panel">
                <div className="dashboard-panel-header">
                    <h2>{group.title}</h2>
                    <span>Pflichtangaben</span>
                </div>
                <div className="form-grid two-columns unternehmen-form-grid">
                    {group.fields.map(([field, label]) => <div
                        key={field}
                        className={WIDE_FIELDS.has(field) ? "unternehmen-field is-wide" : "unternehmen-field"}
                    >
                        <Label>{label}</Label>
                        <TextField value={String(current[field] || "")} onChange={value => updateField(field, value)} />
                    </div>)}
                </div>
            </section>)}
        </div>

        <section className="module-panel unternehmen-actions">
            <div className="table-actions">
                <button type="button" className="button-secondary" onClick={alsPdfAnzeigen}>Als PDF anzeigen</button>
                <SaveButton onSave={speichern} onSuccess={() => undefined}>Speichern</SaveButton>
            </div>
        </section>
    </>;
}
