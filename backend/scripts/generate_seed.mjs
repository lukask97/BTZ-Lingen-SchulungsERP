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
    "services",
    "benutzer",
    "rollen",
    "rechte",
    "rollenRechte",
    "nummernkreise",
    "fristenOptionen",
    "unternehmen",
    "lehrkraftOptionen",
    "lager",
    "lieferanten",
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
payload.fristenOptionen = [
    {
        id: 1,
        skontoTage: 14,
        skontoProzent: 5,
        angebotGfFreigabeAbweichungProzent: 10,
        zahlungszielTage: 28,
        zahlungserinnerungTage: 21,
        mahnung1AbTage: 1,
        mahnung2AbTage: 8,
        inkassoAbTage: 22
    }
];
payload.lehrkraftOptionen = [
    {
        id: 1,
        autoLieferannahmeNach1Tag: false,
        autoDebitorenzahlungNach1Tag: false,
        debitorenzahlungRegeln: [
            { id: "regel-1", startTag: 0, endTag: 0, gewichtung: 1 },
            { id: "regel-2", startTag: 3, endTag: 14, gewichtung: 35 },
            { id: "regel-3", startTag: 15, endTag: 28, gewichtung: 61 },
            { id: "regel-4", startTag: 29, endTag: 42, gewichtung: 2 },
            { id: "regel-5", startTag: 43, endTag: 56, gewichtung: 1 }
        ]
    }
];

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Seed-Datei geschrieben: ${outputPath}`);
