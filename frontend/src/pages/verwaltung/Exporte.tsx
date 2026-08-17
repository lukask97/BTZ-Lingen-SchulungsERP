import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import artikelService from "../../services/logistik/artikelService";
import artikelBilderService from "../../services/logistik/artikelBilderService";
import { getAllTableColumns } from "../../constants/schemas";
import { exportRowsToExcel } from "../../utils/excelExport";
import { openArticleCatalogPdf } from "../../utils/articleCatalogPdf";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";

type ExportTab = "excel" | "katalog";

function formatExportValue(value: unknown) {
    if (Array.isArray(value)) {
        return value
            .map(item => {
                if (typeof item === "object" && item !== null) {
                    const artikel = String((item as Record<string, unknown>).artikel || "").trim();
                    const menge = String((item as Record<string, unknown>).menge || "").trim();
                    return artikel && menge ? `${artikel} (${menge})` : JSON.stringify(item);
                }
                return String(item);
            })
            .join(", ");
    }

    if (typeof value === "boolean") {
        return value ? "Ja" : "Nein";
    }

    return value ?? "";
}

export default function Exporte() {
    const [artikel] = useSyncedServiceData(["artikel", "artikelStueckliste", "kategorien"], () => artikelService.getAll());
    const artikelColumns = useMemo(() => getAllTableColumns("artikel"), []);
    const standardSpalten = useMemo(
        () => artikelColumns.filter(column => column.visible !== false).map(column => String(column.field)),
        [artikelColumns]
    );
    const [ausgewaehlteSpalten, setAusgewaehlteSpalten] = useState<string[]>(() => [...standardSpalten]);
    const [isPdfExporting, setIsPdfExporting] = useState(false);
    const [activeTab, setActiveTab] = useState<ExportTab>("excel");

    const sichtbareSpalten = useMemo(
        () => artikelColumns.filter(column => ausgewaehlteSpalten.includes(String(column.field))),
        [artikelColumns, ausgewaehlteSpalten]
    );

    const vorschauDaten = useMemo(
        () => artikel.map(item => Object.fromEntries(
            sichtbareSpalten.map(column => [String(column.field), formatExportValue(item[column.field])])
        )),
        [artikel, sichtbareSpalten]
    );

    const toggleSpalte = (field: string) => {
        setAusgewaehlteSpalten(current => current.includes(field)
             ? current.filter(item => item !== field)
            : [...current, field]
        );
    };

    const alleSpaltenWaehlen = () => {
        setAusgewaehlteSpalten(artikelColumns.map(column => String(column.field)));
    };

    const standardSpaltenWaehlen = () => {
        setAusgewaehlteSpalten([...standardSpalten]);
    };

    const exportiereArtikel = () => {
        if (sichtbareSpalten.length === 0) return;

        exportRowsToExcel({
            fileName: "Artikel_Export",
            sheetName: "Artikel",
            columns: sichtbareSpalten.map(column => ({
                key: String(column.field),
                label: column.title
            })),
            rows: artikel.map(item => Object.fromEntries(
                sichtbareSpalten.map(column => [String(column.field), formatExportValue(item[column.field])])
            ))
        });
    };

    const exportiereArtikelkatalogPdf = async () => {
        setIsPdfExporting(true);
        try {
            const katalogArtikel = await Promise.all(
                [...artikel]
                    .sort((a, b) => {
                        const categoryCompare = String(a.kategoriePfad || "").localeCompare(String(b.kategoriePfad || ""), "de");
                        if (categoryCompare !== 0) return categoryCompare;
                        return String(a.name || "").localeCompare(String(b.name || ""), "de");
                    })
                    .map(async item => ({
                        artikelNr: item.artikelNr,
                        name: item.name,
                        verkaufspreis: Number(item.verkaufspreis || 0),
                        beschreibung: item.beschreibung || "",
                        kategoriePfad: item.kategoriePfad || item.kategorie || "Ohne Kategorie",
                        bilder: await artikelBilderService.list(item.id)
                    }))
            );

            openArticleCatalogPdf({
                title: "Artikelkatalog",
                articles: katalogArtikel
            });
        } finally {
            setIsPdfExporting(false);
        }
    };

    return <>
        <h1>Exporte</h1>
        <p>Hier können Exporte vorbereitet werden. Für Artikel gibt es einen getrennten Excel-Export und einen eigenen Tab für den Artikelkatalog als PDF.</p>

        <div className="kennzahlen" role="tablist" aria-label="Export Tabs">
            <button
                type="button"
                role="tab"
                aria-selected={activeTab === "excel"}
                className={`kennzahl kennzahl-button${activeTab === "excel" ? " is-active" : ""}`}
                onClick={() => setActiveTab("excel")}
            >
                <span>Artikel Excel</span>
                <strong>{ausgewaehlteSpalten.length}</strong>
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={activeTab === "katalog"}
                className={`kennzahl kennzahl-button${activeTab === "katalog" ? " is-active" : ""}`}
                onClick={() => setActiveTab("katalog")}
            >
                <span>Artikelkatalog PDF</span>
                <strong>{artikel.length}</strong>
            </button>
        </div>

        {activeTab === "excel" && <>
        <section className="module-panel">
            <h2>Artikel-Export</h2>
            <p>Wähle zuerst die gewünschten Spalten. Die Vorschau darunter aktualisiert sich sofort.</p>
            <div className="thread-document-links">
                <button type="button" className="button-secondary" onClick={alleSpaltenWaehlen}>Alle Spalten</button>
                <button type="button" className="button-secondary" onClick={standardSpaltenWaehlen}>Standardspalten</button>
                <button type="button" onClick={exportiereArtikel} disabled={sichtbareSpalten.length === 0}>
                    Excel exportieren
                </button>
            </div>
            <div className="export-column-grid">
                {artikelColumns.map(column => {
                    const field = String(column.field);
                    const checked = ausgewaehlteSpalten.includes(field);
                    return <label key={field} className={`export-column-option${checked ? " is-active" : ""}`}>
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSpalte(field)}
                        />
                        <span>{column.title}</span>
                    </label>;
                })}
            </div>
        </section>

        <DataTable
            title="Vorschau Artikel-Export"
            selectableColumns={false}
            data={vorschauDaten}
            columns={sichtbareSpalten.map(column => ({
                field: String(column.field),
                title: column.title
            }))}
        />
        </>}

        {activeTab === "katalog" && <section className="module-panel">
            <h2>Artikelkatalog als PDF</h2>
            <p>Dieser Export erstellt einen nach Kategorien sortierten Katalog mit Artikelnummer, Name, Verkaufspreis, Beschreibung und hinterlegten Bildern.</p>
            <div className="thread-document-links">
                <button type="button" onClick={exportiereArtikelkatalogPdf} disabled={isPdfExporting || artikel.length === 0}>
                    {isPdfExporting ? "PDF wird vorbereitet..." : "Artikelkatalog als PDF"}
                </button>
            </div>
        </section>}
    </>;
}
