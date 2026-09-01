import ExcelJS from "exceljs";

function sanitizeSheetName(value: string) {
    return String(value || "Tabelle")
        .replace(/[\\/*?:[\]]/g, " ")
        .trim()
        .slice(0, 31) || "Tabelle";
}

function sanitizeFileName(value: string) {
    return String(value || "bestellung")
        .trim()
        .replace(/[\\/:*"<>|]+/g, "_")
        .replace(/\s+/g, "_");
}

function normalizeSupplierName(value: string) {
    return String(value || "").trim().replace(/\s+/g, " ");
}

function downloadBuffer(buffer: ArrayBuffer, fileName: string) {
    const blob = new Blob(
        [buffer],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFileName(fileName)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

type BedarfRow = {
    artikelId: string | number;
    artikelNr: string;
    artikel: string;
    bestand: number;
    verfuegbar: number;
    bedarfsmeldungBei: number;
    verkauftLetzterMonat: number;
};

type StaffelRow = {
    lieferant: string;
    mindestbestellmenge: number;
    stueckpreis: number;
    lieferzeitTage: number;
    notiz?: string;
};

type ArtikelSheetMeta = {
    sheetName: string;
    staffeln: StaffelRow[];
    suppliers: string[];
    supplierEndRow: number;
    groupedStaffeln: Array<{ supplier: string; rows: StaffelRow[] }>;
    bestellungRow: number;
};

function buildUniqueSheetName(usedSheetNames: Set<string>, artikelNr: string) {
    const baseName = sanitizeSheetName(artikelNr);
    let candidate = baseName;
    let suffix = 2;
    while (usedSheetNames.has(candidate)) {
        candidate = sanitizeSheetName(`${baseName.slice(0, 28)}${suffix}`);
        suffix += 1;
    }
    usedSheetNames.add(candidate);
    return candidate;
}

function applyHeaderStyle(row: ExcelJS.Row) {
    row.font = { bold: true };
    row.alignment = { vertical: "middle", horizontal: "center" };
}

function buildMatchRowFormula(sheetName: string, rowNumber: number, supplierRef: string) {
    const supplierIsValid = `COUNTIF('${sheetName}'!$H$3:$H$400,${supplierRef})>0`;
    const matchingRow = `LOOKUP(9.99999999999999E+307,1/(('${sheetName}'!$G$3:$G$400=${supplierRef})*('${sheetName}'!$B$3:$B$400<=$G${rowNumber})),'${sheetName}'!$I$3:$I$400)`;
    return `IF(OR($G${rowNumber}="",NOT(ISNUMBER($G${rowNumber})),$G${rowNumber}<=0,${supplierRef}="",${supplierRef}="Auswahl treffen",NOT(${supplierIsValid})),"",IFERROR(${matchingRow},""))`;
}

function buildResolvedLookupFormula(sheetName: string, rowNumber: number, returnColumn: "C" | "D" | "E", matchColumn = "M") {
    return `IF($${matchColumn}${rowNumber}="","",INDEX('${sheetName}'!$${returnColumn}:$${returnColumn},$${matchColumn}${rowNumber}))`;
}

function buildBestMatchQtyFormula(sheetName: string, rowNumber: number, supplierRef: string) {
    return `IF($N${rowNumber}="","",INDEX('${sheetName}'!$B:$B,$N${rowNumber}))`;
}

function buildSupplierValidFormula(sheetName: string, rowNumber: number, supplierRef: string) {
    return `COUNTIF('${sheetName}'!$H$3:$H$400,${supplierRef})`;
}

function buildNormalizedSupplierFormula(rowNumber: number, supplierRef: string) {
    return `IF(OR(${supplierRef}="",${supplierRef}="Auswahl treffen"),"",TRIM(SUBSTITUTE(${supplierRef},CHAR(160)," ")))`;
}

function buildBestMatchKeyFormula(rowNumber: number, supplierRef: string, bestQtyColumn: string) {
    return `IF(OR(${supplierRef}="",${supplierRef}="Auswahl treffen",$${bestQtyColumn}${rowNumber}=""),"",${supplierRef}&"|"&$${bestQtyColumn}${rowNumber})`;
}

function buildMaxIfsDebugFormula(sheetName: string, rowNumber: number, supplierRef: string) {
    return `IF($M${rowNumber}="","",INDEX('${sheetName}'!$B:$B,$M${rowNumber}))`;
}

function buildMatchIndexDebugFormula(sheetName: string, rowNumber: number, supplierRef: string, bestQtyColumn: string) {
    return `IF(OR(${supplierRef}="",${supplierRef}="Auswahl treffen",$${bestQtyColumn}${rowNumber}=""),"",IFERROR(MATCH($M${rowNumber},'${sheetName}'!$I$3:$I$400,0)+2,""))`;
}

function applySupplierValidation(cell: ExcelJS.Cell, sheetName: string, supplierEndRow: number) {
    cell.dataValidation = {
        type: "list",
        allowBlank: false,
        showErrorMessage: true,
        showInputMessage: true,
        errorStyle: "error",
        errorTitle: "Ungueltiger Lieferant",
        error: "Bitte nur einen Lieferanten aus der Liste auswaehlen.",
        promptTitle: "Lieferant auswaehlen",
        prompt: "Bitte Lieferant auswaehlen oder eintippen. Excel zeigt passende Vorschlaege aus der Liste.",
        formulae: [`'${sheetName}'!$H$3:$H$${supplierEndRow}`]
    };
}

function applyInvalidSupplierFormatting(sheet: ExcelJS.Worksheet, rowNumber: number, articleSheetName: string) {
    sheet.addConditionalFormatting({
        ref: `H${rowNumber}`,
        rules: [
            {
                type: "expression",
                formulae: [
                    `AND($H${rowNumber}<>"",$H${rowNumber}<>"Auswahl treffen",COUNTIF('${articleSheetName}'!$H$3:$H$400,$H${rowNumber})=0)`
                ],
                style: {
                    fill: {
                        type: "pattern",
                        pattern: "solid",
                        bgColor: { argb: "FFFDECEC" },
                        fgColor: { argb: "FFFDECEC" }
                    },
                    font: {
                        color: { argb: "FF9F1D1D" }
                    }
                }
            }
        ]
    });
}

function applyMinimumQuantityFormatting(sheet: ExcelJS.Worksheet, rowNumber: number, articleSheetName: string) {
    const minimumNotReachedFormula = `AND($G${rowNumber}>0,$H${rowNumber}<>"",$H${rowNumber}<>"Auswahl treffen",COUNTIF('${articleSheetName}'!$H$3:$H$400,$H${rowNumber})>0,$N${rowNumber}="",COUNTIF('${articleSheetName}'!$G$3:$G$400,$H${rowNumber})>0)`;

    sheet.addConditionalFormatting({
        ref: `G${rowNumber}:M${rowNumber}`,
        rules: [
            {
                type: "expression",
                formulae: [minimumNotReachedFormula],
                style: {
                    fill: {
                        type: "pattern",
                        pattern: "solid",
                        bgColor: { argb: "FFFDECEC" },
                        fgColor: { argb: "FFFDECEC" }
                    },
                    font: {
                        color: { argb: "FF9F1D1D" }
                    }
                }
            }
        ]
    });
}

function applyMinimumQuantityFormattingForColumns(
    sheet: ExcelJS.Worksheet,
    rowNumber: number,
    articleSheetName: string,
    supplierColumn: string,
    matchColumn: string
) {
    const minimumNotReachedFormula = `AND($G${rowNumber}>0,$${supplierColumn}${rowNumber}<>"",$${supplierColumn}${rowNumber}<>"Auswahl treffen",COUNTIF('${articleSheetName}'!$H$3:$H$400,$${supplierColumn}${rowNumber})>0,$${matchColumn}${rowNumber}="",COUNTIF('${articleSheetName}'!$G$2:$G$400,$${supplierColumn}${rowNumber})>0)`;

    sheet.addConditionalFormatting({
        ref: `G${rowNumber}:L${rowNumber}`,
        rules: [
            {
                type: "expression",
                formulae: [minimumNotReachedFormula],
                style: {
                    fill: {
                        type: "pattern",
                        pattern: "solid",
                        bgColor: { argb: "FFFDECEC" },
                        fgColor: { argb: "FFFDECEC" }
                    },
                    font: {
                        color: { argb: "FF9F1D1D" }
                    }
                }
            }
        ]
    });
}

function applyComparisonFormatting(sheet: ExcelJS.Worksheet, rowNumber: number, articleSheetName: string) {
    const noMatchFormula = `AND($G${rowNumber}>0,$H${rowNumber}<>"",$H${rowNumber}<>"Auswahl treffen",$N${rowNumber}="")`;
    const supplierUnavailableFormula = `AND($G${rowNumber}>0,$H${rowNumber}<>"",$H${rowNumber}<>"Auswahl treffen",COUNTIF('${articleSheetName}'!$H$3:$H$400,$H${rowNumber})=0)`;

    sheet.addConditionalFormatting({
        ref: `G${rowNumber}:M${rowNumber}`,
        rules: [
            {
                type: "expression",
                formulae: [supplierUnavailableFormula],
                style: {
                    fill: {
                        type: "pattern",
                        pattern: "solid",
                        bgColor: { argb: "FF7F1D1D" },
                        fgColor: { argb: "FF7F1D1D" }
                    },
                    font: {
                        color: { argb: "FFFFFFFF" }
                    }
                }
            },
            {
                type: "expression",
                formulae: [noMatchFormula],
                style: {
                    fill: {
                        type: "pattern",    
                        pattern: "solid",
                        bgColor: { argb: "FFFDECEC" },
                        fgColor: { argb: "FFFDECEC" }
                    },
                    font: {
                        color: { argb: "FF9F1D1D" }
                    }
                }
            }
        ]
    });
}

function applySupplierGroupBorder(sheet: ExcelJS.Worksheet, startRow: number, endRow: number) {
    for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
        for (let col = 1; col <= 5; col += 1) {
            const cell = sheet.getCell(rowNumber, col);
            cell.border = {
                ...cell.border,
                left: col === 1 ? { style: "thin", color: { argb: "FF9CA3AF" } } : cell.border?.left,
                right: col === 5 ? { style: "thin", color: { argb: "FF9CA3AF" } } : cell.border?.right
            };
        }
    }

    const firstRow = sheet.getRow(startRow);
    for (let col = 1; col <= 5; col += 1) {
        const cell = firstRow.getCell(col);
        cell.border = {
            ...cell.border,
            top: { style: "medium", color: { argb: "FF4B5563" } }
        };
    }

    const lastRow = sheet.getRow(endRow);
    for (let col = 1; col <= 5; col += 1) {
        const cell = lastRow.getCell(col);
        cell.border = {
            ...cell.border,
            bottom: { style: "medium", color: { argb: "FF4B5563" } }
        };
    }
}

export async function exportPurchaseDemandWorkbook(options: {
    fileName: string;
    bedarfe: BedarfRow[];
    staffelnByArtikelId: Record<string, StaffelRow[]>;
}) {
    const { fileName, bedarfe, staffelnByArtikelId } = options;
    const workbook = new ExcelJS.Workbook();
    workbook.calcProperties.fullCalcOnLoad = true;

    const artikelSheetMeta = new Map<string, ArtikelSheetMeta>();
    const usedSheetNames = new Set<string>();
    const allSuppliers = new Set<string>();

    bedarfe.forEach((item, index) => {
        const artikelId = String(item.artikelId);
        if (artikelSheetMeta.has(artikelId)) {
            return;
        }

        const staffeln = staffelnByArtikelId[artikelId] || [];
        const suppliers = [...new Set(staffeln.map(entry => normalizeSupplierName(entry.lieferant)).filter(Boolean))];
        suppliers.forEach(supplier => allSuppliers.add(supplier));
        const groupedStaffeln = suppliers.map(supplier => ({
            supplier,
            rows: staffeln
                .filter(entry => normalizeSupplierName(entry.lieferant) === supplier)
                .sort((a, b) => Number(a.mindestbestellmenge || 0) - Number(b.mindestbestellmenge || 0))
        }));

        artikelSheetMeta.set(artikelId, {
            sheetName: buildUniqueSheetName(usedSheetNames, item.artikelNr),
            staffeln,
            suppliers,
            supplierEndRow: Math.max(3, suppliers.length + 3),
            groupedStaffeln,
            bestellungRow: index + 2
        });
    });

    const bestellungSheet = workbook.addWorksheet("Bestellung");
    bestellungSheet.columns = [
        { width: 14 },
        { width: 28 },
        { width: 10 },
        { width: 10 },
        { width: 18 },
        { width: 20 },
        { width: 12 },
        { width: 24 },
        { width: 14 },
        { width: 14 },
        { width: 24 },
        { width: 24 },
        { width: 50 },
        { width: 14 },
        { width: 14 },
        { width: 24 },
        { width: 18 },
        { width: 24 },
        { width: 18 }
    ];

    bestellungSheet.addRow([
        "Artikelnummer",
        "Artikel",
        "Lager-Bestand",
        "Bestand",
        "Nachbestellen ab",
        "Verkauft letzter Monat",
        "Menge",
        "Lieferantenauswahl",
        "Beste Staffel",
        "Preis pro Stueck",
        "Gesamtpreis",
        "Erwartete Lieferzeit",
        "Hinweis/Notiz",
        "Trefferzeile",
        "Lieferant gueltig",
        "Lieferant normalisiert",
        "MAXIFS direkt",
        "Match-Schluessel",
        "Match-Index"
    ]);
    applyHeaderStyle(bestellungSheet.getRow(1));
    bestellungSheet.views = [{ state: "frozen", ySplit: 1 }];
    bestellungSheet.getColumn(10).numFmt = "#,##0.00";
    bestellungSheet.getColumn(11).numFmt = "#,##0.00";
    bestellungSheet.getColumn(12).numFmt = `0 "Tag(e)"`;
    bestellungSheet.getColumn(14).hidden = true;
    bestellungSheet.getColumn(15).hidden = true;
    bestellungSheet.getColumn(16).hidden = true;
    bestellungSheet.getColumn(17).hidden = true;
    bestellungSheet.getColumn(18).hidden = true;
    bestellungSheet.getColumn(19).hidden = true;

    bedarfe.forEach((item, index) => {
        const rowNumber = index + 2;
        const articleSheetName = artikelSheetMeta.get(String(item.artikelId))?.sheetName || "Artikel";

        bestellungSheet.getCell(`A${rowNumber}`).value = item.artikelNr;
        bestellungSheet.getCell(`B${rowNumber}`).value = item.artikel;
        bestellungSheet.getCell(`C${rowNumber}`).value = Number(item.bestand || 0);
        bestellungSheet.getCell(`D${rowNumber}`).value = Number(item.verfuegbar || 0);
        bestellungSheet.getCell(`E${rowNumber}`).value = Number(item.bedarfsmeldungBei || 0);
        bestellungSheet.getCell(`F${rowNumber}`).value = Number(item.verkauftLetzterMonat || 0);
        bestellungSheet.getCell(`G${rowNumber}`).value = "";
        bestellungSheet.getCell(`H${rowNumber}`).value = "Auswahl treffen";
        bestellungSheet.getCell(`N${rowNumber}`).value = { formula: buildMatchRowFormula(articleSheetName, rowNumber, `$H${rowNumber}`) };
        bestellungSheet.getCell(`O${rowNumber}`).value = { formula: buildSupplierValidFormula(articleSheetName, rowNumber, `$H${rowNumber}`) };
        bestellungSheet.getCell(`I${rowNumber}`).value = { formula: buildBestMatchQtyFormula(articleSheetName, rowNumber, `$H${rowNumber}`) };
        bestellungSheet.getCell(`P${rowNumber}`).value = { formula: buildNormalizedSupplierFormula(rowNumber, `$H${rowNumber}`) };
        bestellungSheet.getCell(`Q${rowNumber}`).value = { formula: buildMaxIfsDebugFormula(articleSheetName, rowNumber, `$H${rowNumber}`) };
        bestellungSheet.getCell(`R${rowNumber}`).value = { formula: buildBestMatchKeyFormula(rowNumber, `$H${rowNumber}`, "I") };
        bestellungSheet.getCell(`S${rowNumber}`).value = { formula: buildMatchIndexDebugFormula(articleSheetName, rowNumber, `$H${rowNumber}`, "I") };
        bestellungSheet.getCell(`J${rowNumber}`).value = { formula: buildResolvedLookupFormula(articleSheetName, rowNumber, "C", "N") };
        bestellungSheet.getCell(`K${rowNumber}`).value = {
            formula: `IF(OR($J${rowNumber}="",$G${rowNumber}="",NOT(ISNUMBER($G${rowNumber})),$G${rowNumber}<=0),"",ROUND($G${rowNumber}*$J${rowNumber},2))`
        };
        bestellungSheet.getCell(`L${rowNumber}`).value = { formula: buildResolvedLookupFormula(articleSheetName, rowNumber, "D", "N") };
        bestellungSheet.getCell(`M${rowNumber}`).value = { formula: buildResolvedLookupFormula(articleSheetName, rowNumber, "E", "N") };

        bestellungSheet.getCell(`G${rowNumber}`).protection = { locked: false };
        bestellungSheet.getCell(`H${rowNumber}`).protection = { locked: false };
    });

    const dataEndRow = bedarfe.length + 1;
    bestellungSheet.addRow([]);
    bestellungSheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Summe",
        { formula: `SUM(K2:K${dataEndRow})` },
        { formula: `MAX(L2:L${dataEndRow})` },
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
    ]);
    const summaryRow = bestellungSheet.lastRow;
    if (summaryRow) {
        summaryRow.getCell(10).font = { bold: true };
        summaryRow.getCell(11).numFmt = "#,##0.00";
        summaryRow.getCell(12).numFmt = `0 "Tag(e)"`;
        summaryRow.eachCell({ includeEmpty: true }, cell => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF3F4F6" }
            };
            cell.alignment = { vertical: "middle", horizontal: cell.col === 10 ? "left" : "center" };
        });
    }

    bedarfe.forEach((item, index) => {
        const rowNumber = index + 2;
        const meta = artikelSheetMeta.get(String(item.artikelId));
        const articleSheetName = meta?.sheetName || "Artikel";
        const supplierEndRow = meta?.supplierEndRow || 2;
        const supplierCell = bestellungSheet.getCell(`H${rowNumber}`);

        applySupplierValidation(supplierCell, articleSheetName, supplierEndRow);
        applyInvalidSupplierFormatting(bestellungSheet, rowNumber, articleSheetName);
        applyMinimumQuantityFormatting(bestellungSheet, rowNumber, articleSheetName);

        bestellungSheet.getCell(`M${rowNumber}`).value = {
            formula: `IF(AND($G${rowNumber}>0,$H${rowNumber}<>"",$H${rowNumber}<>"Auswahl treffen",COUNTIF('${articleSheetName}'!$H$3:$H$400,$H${rowNumber})=0),"Lieferant bietet diesen Artikel nicht an",IF(AND($G${rowNumber}>0,$H${rowNumber}<>"",$H${rowNumber}<>"Auswahl treffen",COUNTIF('${articleSheetName}'!$H$3:$H$400,$H${rowNumber})>0,$N${rowNumber}=""),"Mindestbestellmenge nicht erreicht",${buildResolvedLookupFormula(articleSheetName, rowNumber, "E", "N")}))`
        };
        bestellungSheet.getCell(`I${rowNumber}`).alignment = { horizontal: "center", vertical: "middle" };
        bestellungSheet.getCell(`J${rowNumber}`).alignment = { horizontal: "center", vertical: "middle" };
        bestellungSheet.getCell(`K${rowNumber}`).alignment = { horizontal: "center", vertical: "middle" };
        bestellungSheet.getCell(`L${rowNumber}`).alignment = { horizontal: "center", vertical: "middle" };
        bestellungSheet.getCell(`M${rowNumber}`).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    });

    const bestellungV2Sheet = workbook.addWorksheet("BestellungV2");
    bestellungV2Sheet.columns = [
        { width: 14 },
        { width: 28 },
        { width: 10 },
        { width: 10 },
        { width: 18 },
        { width: 20 },
        { width: 12 },
        { width: 24 },
        { width: 14 },
        { width: 14 },
        { width: 24 },
        { width: 24 },
        { width: 50 },
        { width: 24 },
        { width: 14 },
        { width: 14 },
        { width: 24 },
        { width: 18 },
        { width: 24 },
        { width: 18 }
    ];
    bestellungV2Sheet.views = [{ state: "frozen", ySplit: 1 }];
    bestellungV2Sheet.getColumn(10).numFmt = "#,##0.00";
    bestellungV2Sheet.getColumn(11).numFmt = "#,##0.00";
    bestellungV2Sheet.getColumn(12).numFmt = `0 "Tag(e)"`;

    const supplierList = ["Auswahl treffen", ...Array.from(allSuppliers).sort((a, b) => a.localeCompare(b))];
    bestellungV2Sheet.addRow([
        "Artikelnummer",
        "Artikel",
        "Lager-Bestand",
        "Bestand",
        "Nachbestellen ab",
        "Verkauft letzter Monat",
        "Menge",
        "Lieferantenauswahl",
        "Beste Staffel",
        "Preis pro Stueck",
        "Gesamtpreis",
        "Erwartete Lieferzeit",
        "Hinweis/Notiz",
        "Trefferzeile",
        "Lieferantenliste",
        "Lieferant gueltig",
        "Lieferant normalisiert",
        "MAXIFS direkt",
        "Match-Schluessel",
        "Match-Index"
    ]);
    applyHeaderStyle(bestellungV2Sheet.getRow(1));
    bestellungV2Sheet.getColumn(14).hidden = true;
    bestellungV2Sheet.getColumn(15).hidden = true;
    bestellungV2Sheet.getColumn(16).hidden = true;
    bestellungV2Sheet.getColumn(17).hidden = true;
    bestellungV2Sheet.getColumn(18).hidden = true;
    bestellungV2Sheet.getColumn(19).hidden = true;
    bestellungV2Sheet.getColumn(20).hidden = true;

    bedarfe.forEach((item, index) => {
        const rowNumber = index + 2;
        const articleSheetName = artikelSheetMeta.get(String(item.artikelId))?.sheetName || "Artikel";

        bestellungV2Sheet.getCell(`A${rowNumber}`).value = item.artikelNr;
        bestellungV2Sheet.getCell(`B${rowNumber}`).value = item.artikel;
        bestellungV2Sheet.getCell(`C${rowNumber}`).value = Number(item.bestand || 0);
        bestellungV2Sheet.getCell(`D${rowNumber}`).value = Number(item.verfuegbar || 0);
        bestellungV2Sheet.getCell(`E${rowNumber}`).value = Number(item.bedarfsmeldungBei || 0);
        bestellungV2Sheet.getCell(`F${rowNumber}`).value = Number(item.verkauftLetzterMonat || 0);
        bestellungV2Sheet.getCell(`G${rowNumber}`).value = "";
        bestellungV2Sheet.getCell(`H${rowNumber}`).value = { formula: `$H${bedarfe.length + 3}` };
        bestellungV2Sheet.getCell(`N${rowNumber}`).value = { formula: buildMatchRowFormula(articleSheetName, rowNumber, `$H${rowNumber}`) };
        bestellungV2Sheet.getCell(`O${rowNumber}`).value = { formula: buildSupplierValidFormula(articleSheetName, rowNumber, `$H${rowNumber}`) };
        bestellungV2Sheet.getCell(`I${rowNumber}`).value = { formula: buildBestMatchQtyFormula(articleSheetName, rowNumber, `$H${rowNumber}`) };
        bestellungV2Sheet.getCell(`P${rowNumber}`).value = { formula: buildNormalizedSupplierFormula(rowNumber, `$H${rowNumber}`) };
        bestellungV2Sheet.getCell(`Q${rowNumber}`).value = { formula: buildMaxIfsDebugFormula(articleSheetName, rowNumber, `$H${rowNumber}`) };
        bestellungV2Sheet.getCell(`R${rowNumber}`).value = { formula: buildBestMatchKeyFormula(rowNumber, `$H${rowNumber}`, "I") };
        bestellungV2Sheet.getCell(`S${rowNumber}`).value = { formula: buildMatchIndexDebugFormula(articleSheetName, rowNumber, `$H${rowNumber}`, "I") };
        bestellungV2Sheet.getCell(`J${rowNumber}`).value = { formula: buildResolvedLookupFormula(articleSheetName, rowNumber, "C", "N") };
        bestellungV2Sheet.getCell(`K${rowNumber}`).value = {
            formula: `IF(OR($J${rowNumber}="",$G${rowNumber}="",NOT(ISNUMBER($G${rowNumber})),$G${rowNumber}<=0),"",ROUND($G${rowNumber}*$J${rowNumber},2))`
        };
        bestellungV2Sheet.getCell(`L${rowNumber}`).value = { formula: buildResolvedLookupFormula(articleSheetName, rowNumber, "D", "N") };
        bestellungV2Sheet.getCell(`M${rowNumber}`).value = {
            formula: `IF(AND($G${rowNumber}>0,$H${rowNumber}<>"",$H${rowNumber}<>"Auswahl treffen",COUNTIF('${articleSheetName}'!$H$3:$H$400,$H${rowNumber})=0),"Lieferant bietet diesen Artikel nicht an",IF(AND($G${rowNumber}>0,$H${rowNumber}<>"",$H${rowNumber}<>"Auswahl treffen",$N${rowNumber}=""),"Mindestbestellmenge nicht erreicht",${buildResolvedLookupFormula(articleSheetName, rowNumber, "E", "N")}))`
        };

        bestellungV2Sheet.getCell(`G${rowNumber}`).protection = { locked: false };
        bestellungV2Sheet.getCell(`H${rowNumber}`).protection = { locked: false };
        bestellungV2Sheet.getCell(`I${rowNumber}`).alignment = { horizontal: "center", vertical: "middle" };
        bestellungV2Sheet.getCell(`J${rowNumber}`).alignment = { horizontal: "center", vertical: "middle" };
        bestellungV2Sheet.getCell(`K${rowNumber}`).alignment = { horizontal: "center", vertical: "middle" };
        bestellungV2Sheet.getCell(`L${rowNumber}`).alignment = { horizontal: "center", vertical: "middle" };
        bestellungV2Sheet.getCell(`M${rowNumber}`).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    });

    const dataStartRowV2 = 2;
    const dataEndRowV2 = bedarfe.length + 1;
    bestellungV2Sheet.addRow([]);
    bestellungV2Sheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "",
        "Lieferant:",
        "Auswahl treffen",
        "",
        "Summe",
        { formula: `SUM(K${dataStartRowV2}:K${dataEndRowV2})` },
        { formula: `MAX(L${dataStartRowV2}:L${dataEndRowV2})` },
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
    ]);
    const summaryRowV2 = bestellungV2Sheet.lastRow;
    if (summaryRowV2) {
        summaryRowV2.getCell(7).font = { bold: true };
        summaryRowV2.getCell(8).dataValidation = {
            type: "list",
            allowBlank: false,
            showErrorMessage: true,
            errorStyle: "error",
            errorTitle: "Ungueltiger Lieferant",
            error: "Bitte nur einen Lieferanten aus der Liste auswaehlen.",
            formulae: [`$N$1:$N$${supplierList.length}`]
        };
        summaryRowV2.getCell(8).protection = { locked: false };
        summaryRowV2.getCell(8).alignment = { vertical: "middle", horizontal: "left" };
        summaryRowV2.getCell(10).font = { bold: true };
        summaryRowV2.getCell(11).numFmt = "#,##0.00";
        summaryRowV2.getCell(12).numFmt = `0 "Tag(e)"`;
        summaryRowV2.eachCell({ includeEmpty: true }, cell => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF3F4F6" }
            };
            cell.alignment = { vertical: "middle", horizontal: cell.col === 8 || cell.col === 10 ? "left" : "center" };
        });
    }

    const supplierListStartRowV2 = dataEndRowV2 + 4;
    supplierList.forEach((supplier, index) => {
        bestellungV2Sheet.getCell(`N${supplierListStartRowV2 + index}`).value = supplier;
    });
    if (summaryRowV2) {
        summaryRowV2.getCell(8).dataValidation = {
            type: "list",
            allowBlank: false,
            showErrorMessage: true,
            errorStyle: "error",
            errorTitle: "Ungueltiger Lieferant",
            error: "Bitte nur einen Lieferanten aus der Liste auswaehlen.",
            formulae: [`$N$${supplierListStartRowV2}:$N$${supplierListStartRowV2 + supplierList.length - 1}`]
        };
    }

    bedarfe.forEach((item, index) => {
        const rowNumber = index + 2;
        const meta = artikelSheetMeta.get(String(item.artikelId));
        const articleSheetName = meta?.sheetName || "Artikel";

        applyComparisonFormatting(bestellungV2Sheet, rowNumber, articleSheetName);
    });

    artikelSheetMeta.forEach(({ sheetName: articleSheetName, suppliers, groupedStaffeln, bestellungRow }) => {
        const articleSheet = workbook.addWorksheet(articleSheetName);
        articleSheet.columns = [
            { width: 24 },
            { width: 10 },
            { width: 12 },
            { width: 20 },
            { width: 40 },
            { width: 24 },
            { width: 2 },
            { width: 24 },
            { width: 12 },
            { width: 14 },
            { width: 12 },
            { width: 12 },
            { width: 14 },
            { width: 14 }
        ];

        articleSheet.getCell("J1").value = "Debug Lieferant";
        articleSheet.getCell("K1").value = { formula: `'Bestellung'!$H$${bestellungRow}` };
        articleSheet.getCell("L1").value = "Debug Menge";
        articleSheet.getCell("M1").value = { formula: `'Bestellung'!$G$${bestellungRow}` };
        articleSheet.getCell("N1").value = "Debug Treffer";
        articleSheet.getCell("O1").value = { formula: `'Bestellung'!$N$${bestellungRow}` };
        applyHeaderStyle(articleSheet.getRow(1));

        articleSheet.addRow([
            "Lieferant",
            "Menge",
            "Preis/Stk",
            "Erwartete Lieferzeit in Tag(e)",
            "Notiz",
            "Schluessel",
            "",
            "Lieferantenliste",
            "Treffer-ID",
            "Lieferant passt",
            "Menge passt",
            "Kandidat",
            "Debug Reihenfolge",
            "Ist Treffer"
        ]);
        applyHeaderStyle(articleSheet.getRow(2));
        articleSheet.views = [{ state: "frozen", ySplit: 2 }];
        articleSheet.getColumn(6).hidden = true;
        articleSheet.getColumn(7).hidden = true;
        articleSheet.getColumn(8).hidden = true;
        articleSheet.getColumn(9).hidden = true;
        articleSheet.getColumn(10).hidden = true;
        articleSheet.getColumn(11).hidden = true;
        articleSheet.getColumn(12).hidden = true;
        articleSheet.getColumn(13).hidden = true;
        articleSheet.getColumn(14).hidden = true;

        articleSheet.getCell("H3").value = "Auswahl treffen";
        suppliers.forEach((supplier, index) => {
            articleSheet.getCell(`H${index + 4}`).value = supplier;
        });

        let targetRow = 3;
        groupedStaffeln.forEach(({ supplier, rows: supplierRows }, supplierIndex) => {
            const startRow = targetRow;

            supplierRows.forEach((entry, entryIndex) => {
                const normalizedSupplier = normalizeSupplierName(entry.lieferant);
                articleSheet.getCell(`A${targetRow}`).value = entryIndex === 0 ? supplier : "";
                articleSheet.getCell(`B${targetRow}`).value = Number(entry.mindestbestellmenge || 0);
                articleSheet.getCell(`C${targetRow}`).value = Number(entry.stueckpreis || 0);
                articleSheet.getCell(`D${targetRow}`).value = Number(entry.lieferzeitTage || 0);
                articleSheet.getCell(`E${targetRow}`).value = entry.notiz || "";
                articleSheet.getCell(`F${targetRow}`).value = `${normalizedSupplier}|${Number(entry.mindestbestellmenge || 0)}`;
                articleSheet.getCell(`G${targetRow}`).value = normalizedSupplier;
                articleSheet.getCell(`I${targetRow}`).value = targetRow;
                articleSheet.getCell(`J${targetRow}`).value = { formula: `--($G${targetRow}=$K$1)` };
                articleSheet.getCell(`K${targetRow}`).value = { formula: `--($B${targetRow}<=$M$1)` };
                articleSheet.getCell(`L${targetRow}`).value = { formula: `IF(AND($J${targetRow}=1,$K${targetRow}=1),$I${targetRow},"")` };
                articleSheet.getCell(`M${targetRow}`).value = targetRow;
                articleSheet.getCell(`N${targetRow}`).value = { formula: `--($I${targetRow}=$O$1)` };
                targetRow += 1;
            });

            const endRow = targetRow - 1;
            if (endRow > startRow) {
                articleSheet.mergeCells(`A${startRow}:A${endRow}`);
            }
            articleSheet.getCell(`A${startRow}`).alignment = { vertical: "middle", horizontal: "left" };
            articleSheet.getCell(`A${startRow}`).font = { bold: true };
            applySupplierGroupBorder(articleSheet, startRow, endRow);

            if (supplierIndex < suppliers.length - 1) {
                targetRow += 1;
            }
        });
    });

    await bestellungSheet.protect("schueler", {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false
    });

    bestellungV2Sheet.getRow(1).eachCell(cell => {
        cell.protection = { locked: true };
    });

    await bestellungV2Sheet.protect("schueler", {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false
    });

    for (const sheet of workbook.worksheets) {
        if (sheet.name === "Bestellung" || sheet.name === "BestellungV2") {
            continue;
        }
        await sheet.protect("schueler", {
            selectLockedCells: true,
            selectUnlockedCells: true,
            formatCells: false,
            formatColumns: false,
            formatRows: false,
            insertColumns: false,
            insertRows: false,
            insertHyperlinks: false,
            deleteColumns: false,
            deleteRows: false,
            sort: false,
            autoFilter: false,
            pivotTables: false
        });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    downloadBuffer(buffer as ArrayBuffer, fileName);
}
