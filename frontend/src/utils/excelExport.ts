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
    import("exceljs").then(async module => {
        const ExcelJS = module.default ?? module;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);
        worksheet.addRow(columns.map(column => column.label));
        rows.forEach(row => {
            worksheet.addRow(columns.map(column => row[column.key] ?? ""));
        });
        worksheet.columns.forEach(column => {
            column.width = 20;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer as ArrayBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${sanitizeFileName(fileName)}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    });
}
