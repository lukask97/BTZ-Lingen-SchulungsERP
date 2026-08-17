import * as XLSX from "xlsx";

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

export async function parseUserImportFile(file: File) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: ""
    });

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
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Benutzer");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
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
