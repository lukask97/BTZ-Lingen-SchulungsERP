import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const rootDir = path.resolve(process.cwd());
const mockDataPath = path.join(rootDir, "frontend", "src", "services", "mockup", "mockData.ts");
const mockMetaDataPath = path.join(rootDir, "frontend", "src", "services", "mockup", "mockMetaData.ts");
const outputPath = path.join(rootDir, "backend", "seed", "mock_seed.json");

function evaluateExports(filePath, exportNames) {
    const source = fs.readFileSync(filePath, "utf8");
    const transformed = source
        .replace(/^\/\/ @ts-nocheck\s*/m, "")
        .replace(/export let (\w+)\s*=/g, "globalThis.$1 =")
        .replace(/export const (\w+)\s*=/g, "globalThis.$1 =");

    const context = { globalThis: {} };
    vm.createContext(context);
    vm.runInContext(transformed, context);

    return Object.fromEntries(exportNames.map(name => [name, context.globalThis[name] || []]));
}

const mockDataExports = evaluateExports(mockDataPath, [
    "kunden",
    "artikel",
    "services",
    "benutzer",
    "rollen",
    "rechte",
    "lager",
    "lieferanten",
    "bestellungen",
    "kategorien",
    "angebote",
    "auftraege",
    "reklamationen",
    "marketingaktionen",
    "abteilungen",
    "kundenanfragen",
    "nachrichten",
    "zahlungen",
    "mahnungen",
    "belege",
    "freigaben",
    "berichte",
    "versandauftraege",
    "retouren",
    "bewerber",
    "mitarbeiter",
    "arbeitszeiten",
    "urlaubsantraege",
    "krankmeldungen",
    "schulungen",
    "personalakten",
    "vertriebsdokumente",
    "einkaufsdokumente",
    "firmenkonto"
]);

const mockMetaDataExports = evaluateExports(mockMetaDataPath, [
    "feldMetadaten",
    "benutzerSpalten"
]);

const payload = {
    ...mockDataExports,
    ...mockMetaDataExports
};

payload.feldMetadaten = payload.feldMetadaten.map((item, index) => ({
    id: index + 1,
    ...item
}));

payload.benutzerSpalten = payload.benutzerSpalten.map((item, index) => ({
    id: index + 1,
    ...item
}));

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Seed-Datei geschrieben: ${outputPath}`);
