import * as XLSX from "xlsx";

type ExcelColumn = {
    key: string;
    label: string;
};

function sanitizeFileName(value: string) {
    return String(value || "export")
        .trim()
        .replace(/[\\/:*"<>|]+/g, "_")
        .replace(/\s+/g, "_");
}

export function exportRowsToExcel(options: {
    fileName: string;
    sheetName: string;
    columns: ExcelColumn[];
    rows: Array<Record<string, unknown>>;
}) {
    const { fileName, sheetName, columns, rows } = options;
    const exportRows = rows.map(row => Object.fromEntries(
        columns.map(column => [column.label, row[column.key] ?? ""])
    ));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${sanitizeFileName(fileName)}.xlsx`);
}
