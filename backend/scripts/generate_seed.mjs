import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const rootDir = path.resolve(process.cwd());
const mockDataPath = path.join(rootDir, "frontend", "src", "services", "mockup", "mockData.ts");
const mockMetaDataPath = path.join(rootDir, "frontend", "src", "services", "mockup", "mockMetaData.ts");
const outputPath = path.join(rootDir, "backend", "seed", "mock_seed.json");
const MOCK_DATA_EXPORTS = [
    "kunden",
    "artikel",
    "artikelStueckliste",
    "artikelIndividualisierung",
    "services",
    "benutzer",
    "rollen",
    "rechte",
    "rollenRechte",
    "lager",
    "lieferanten",
    "lieferantenArtikelStaffeln",
    "bestellungen",
    "bestellpositionen",
    "kategorien",
    "angebote",
    "angebotspositionen",
    "auftraege",
    "auftragspositionen",
    "reklamationen",
    "marketingaktionen",
    "abteilungen",
    "kundenanfragen",
    "nachrichten",
    "rechnungen",
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
    "firmenkonto",
    "lehrkraftOptionen",
    "fristenOptionen"
];
const MOCK_META_DATA_EXPORTS = [
    "feldMetadaten",
    "benutzerSpalten"
];

function evaluateExports(filePath, exportNames) {
    const source = fs.readFileSync(filePath, "utf8");
    const transformed = source
        .replace(/export let (\w+)\s*=/g, "globalThis.$1 =")
        .replace(/export const (\w+)\s*=/g, "globalThis.$1 =");

    const context = { globalThis: {} };
    vm.createContext(context);
    vm.runInContext(transformed, context);

    return Object.fromEntries(exportNames.map(name => [name, context.globalThis[name] || []]));
}

function addSequentialIds(items = []) {
    return items.map((item, index) => ({
        id: index + 1,
        ...item
    }));
}

const mockDataExports = evaluateExports(mockDataPath, MOCK_DATA_EXPORTS);
const mockMetaDataExports = evaluateExports(mockMetaDataPath, MOCK_META_DATA_EXPORTS);

const payload = {
    ...mockDataExports,
    ...mockMetaDataExports
};

payload.feldMetadaten = addSequentialIds(payload.feldMetadaten);
payload.benutzerSpalten = addSequentialIds(payload.benutzerSpalten);

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Seed-Datei geschrieben: ${outputPath}`);
