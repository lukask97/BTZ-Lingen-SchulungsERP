import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const rootDir = path.resolve(process.cwd());
const seedSourcePaths = [
    path.join(rootDir, "frontend", "src", "services", "seed", "data", "stammdaten.ts"),
    path.join(rootDir, "frontend", "src", "services", "seed", "data", "einkaufLogistik.ts"),
    path.join(rootDir, "frontend", "src", "services", "seed", "data", "verkauf.ts"),
    path.join(rootDir, "frontend", "src", "services", "seed", "data", "verwaltung.ts")
];
const fieldMetadataPath = path.join(rootDir, "frontend", "src", "services", "seed", "fieldMetadata.ts");
const outputPath = path.join(rootDir, "backend", "seed", "mock_seed.json");

const SEED_EXPORTS = [
    "kunden",
    "artikel",
    "artikelStueckliste",
    "artikelIndividualisierung",
    "services",
    "benutzer",
    "rollen",
    "rechte",
    "rollenRechte",
    "nummernkreise",
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
    "unternehmen",
    "lehrkraftOptionen",
    "fristenOptionen"
];

const FIELD_METADATA_EXPORTS = [
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

function evaluateExportsFromFiles(filePaths, exportNames) {
    const context = { globalThis: {} };
    vm.createContext(context);

    filePaths.forEach(filePath => {
        const source = fs.readFileSync(filePath, "utf8");
        const transformed = source
            .replace(/export let (\w+)\s*=/g, "globalThis.$1 =")
            .replace(/export const (\w+)\s*=/g, "globalThis.$1 =");
        vm.runInContext(transformed, context);
    });

    return Object.fromEntries(exportNames.map(name => [name, context.globalThis[name] || []]));
}

function addSequentialIds(items = []) {
    return items.map((item, index) => ({
        id: index + 1,
        ...item
    }));
}

const seedExports = evaluateExportsFromFiles(seedSourcePaths, SEED_EXPORTS);
const fieldMetadataExports = evaluateExports(fieldMetadataPath, FIELD_METADATA_EXPORTS);

const payload = {
    ...seedExports,
    ...fieldMetadataExports
};

payload.feldMetadaten = addSequentialIds(payload.feldMetadaten);
payload.benutzerSpalten = addSequentialIds(payload.benutzerSpalten);

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Seed-Datei geschrieben: ${outputPath}`);
