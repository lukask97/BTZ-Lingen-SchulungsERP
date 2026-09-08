type UserImportRow = {
    vorname: string;
    nachname: string;
};

function normalizeCellValue(value: unknown) {
    return String(value ?? "").trim();
}

function normalizeForLookup(value: string) {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function sanitizeNamePart(value: string) {
    return value
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();
}

function randomLetters(length: number) {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function randomDigits(length: number) {
    const digits = "0123456789";
    return Array.from({ length }, () => digits[Math.floor(Math.random() * digits.length)]).join("");
}

export function generateSimplePassword() {
    return `${randomLetters(3)}${randomDigits(3)}`;
}

export function buildUsername(vorname: string, nachname: string, existingUsernames: string[]) {
    const firstPart = sanitizeNamePart(vorname).charAt(0) || "u";
    const lastPart = sanitizeNamePart(nachname) || "benutzer";
    const base = `${firstPart}.${lastPart}`;
    const existing = new Set(existingUsernames.map(item => item.toLowerCase()));

    if (!existing.has(base.toLowerCase())) return base;

    let suffix = 2;
    while (existing.has(`${base}${suffix}`.toLowerCase())) {
        suffix += 1;
    }
    return `${base}${suffix}`;
}

function getColumnValue(row: Record<string, unknown>, candidates: string[]) {
    const entries = Object.entries(row);
    for (const candidate of candidates) {
        const match = entries.find(([key]) => normalizeForLookup(key) === normalizeForLookup(candidate));
        if (match) return normalizeCellValue(match[1]);
    }
    return "";
}

function getCellText(value: unknown) {
    if (value == null) return "";
    if (typeof value === "object") {
        const candidate = value as { text?: unknown; result?: unknown; richText?: Array<{ text?: unknown }> };
        if (candidate.text != null) return normalizeCellValue(candidate.text);
        if (candidate.result != null) return normalizeCellValue(candidate.result);
        if (Array.isArray(candidate.richText)) {
            return candidate.richText.map(part => normalizeCellValue(part.text)).join("");
        }
    }
    return normalizeCellValue(value);
}

async function createExcelWorkbook() {
    const module = await import("exceljs");
    const ExcelJS = module.default ?? module;
    return new ExcelJS.Workbook();
}

async function downloadExcelRows(rows: Array<Record<string, unknown>>, sheetName: string, fileName: string) {
    const workbook = await createExcelWorkbook();
    const worksheet = workbook.addWorksheet(sheetName);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    worksheet.addRow(headers);
    rows.forEach(row => {
        worksheet.addRow(headers.map(header => row[header] ?? ""));
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
    link.download = `${fileName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export async function parseUserImportFile(file: File) {
    const buffer = await file.arrayBuffer();
    const workbook = await createExcelWorkbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];

    const headers = worksheet.getRow(1).values as unknown[];
    const rows: Array<Record<string, unknown>> = [];
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        const row = worksheet.getRow(rowNumber);
        const values = Object.fromEntries(
            headers.slice(1).map((header, index) => [
                normalizeCellValue(header),
                getCellText(row.getCell(index + 1).value)
            ]).filter(([header]) => header)
        );
        if (Object.values(values).some(value => normalizeCellValue(value))) {
            rows.push(values);
        }
    }

    if (rows.length === 0) return [];

    return rows
        .map(row => {
            const vorname = getColumnValue(row, ["Vorname", "First Name", "firstname", "vorname"]);
            const nachname = getColumnValue(row, ["Name", "Nachname", "Last Name", "lastname", "surname", "name"]);
            return {
                vorname,
                nachname
            };
        })
        .filter(row => row.vorname && row.nachname);
}

export function exportUsersToExcel(rows: Array<Record<string, unknown>>, fileName: string) {
    void downloadExcelRows(rows, "Benutzer", fileName);
}

export function normalizeImportedUsers(rows: UserImportRow[]) {
    return rows.map(row => {
        const vorname = normalizeCellValue(row.vorname);
        const nachname = normalizeCellValue(row.nachname);
        return {
            vorname,
            nachname
        };
    }).filter(row => row.vorname && row.nachname);
}
