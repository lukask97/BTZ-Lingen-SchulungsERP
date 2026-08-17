import { firmenkonto } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";

const baseService = createCRUDService("firmenkonto", firmenkonto);

export const KONTO_TYPEN = {
    FIRMA: "firma",
    VERKAUF: "verkauf",
    EINKAUF: "einkauf"
} as const;

export const STANDARD_EINKAUFSKONTO_ZIEL = 3000;
const SETTINGS_STORAGE_KEY = "firmenkonto-settings";

function normalizeAccountType(value: unknown) {
    const normalized = String(value || "").toLowerCase();
    if (normalized === KONTO_TYPEN.VERKAUF) return KONTO_TYPEN.VERKAUF;
    if (normalized === KONTO_TYPEN.EINKAUF) return KONTO_TYPEN.EINKAUF;
    return KONTO_TYPEN.FIRMA;
}

function normalizeNumber(value: unknown) {
    return Number(value || 0);
}

function normalizeRow(item: any = {}) {
    return {
        ...item,
        konto: normalizeAccountType(item.konto),
        soll: normalizeNumber(item.soll),
        haben: normalizeNumber(item.haben)
    };
}

function readSettings() {
    if (typeof window === "undefined") {
        return { einkaufskontoZiel: STANDARD_EINKAUFSKONTO_ZIEL };
    }

    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return {
            einkaufskontoZiel: normalizeNumber(parsed.einkaufskontoZiel) || STANDARD_EINKAUFSKONTO_ZIEL
        };
    } catch {
        return { einkaufskontoZiel: STANDARD_EINKAUFSKONTO_ZIEL };
    }
}

function writeSettings(settings: { einkaufskontoZiel: number }) {
    if (typeof window === "undefined") {
        return settings;
    }

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
        einkaufskontoZiel: normalizeNumber(settings.einkaufskontoZiel)
    }));
    return settings;
}

function buildTransferRows({
    datum,
    betrag,
    von,
    nach,
    betreff,
    info
}: {
    datum: string;
    betrag: number;
    von: string;
    nach: string;
    betreff: string;
    info: string;
}) {
    return [
        normalizeRow({
            datum,
            konto: von,
            betreff,
            info,
            soll: betrag,
            haben: 0
        }),
        normalizeRow({
            datum,
            konto: nach,
            betreff,
            info,
            soll: 0,
            haben: betrag
        })
    ];
}

const firmenkontoService = {
    list: () => baseService.list().map(normalizeRow),
    getAll: () => baseService.list().map(normalizeRow),
    getById: (id: number | string) => {
        const item = baseService.getById(id);
        return item ? normalizeRow(item) : undefined;
    },
    create: (payload: any) => normalizeRow(baseService.create(normalizeRow(payload))),
    update: (idOrItem: any, payload: any) => {
        if (typeof idOrItem === "object") {
            return normalizeRow(baseService.update(normalizeRow(idOrItem)));
        }
        return normalizeRow(baseService.update(idOrItem, normalizeRow(payload)));
    },
    remove: (id: number | string) => baseService.remove(id),
    delete: (id: number | string) => baseService.remove(id),
    getSaldoByAccount: (konto: string) => firmenkontoService
        .list()
        .filter(item => item.konto === konto)
        .reduce((sum, item) => sum + item.haben - item.soll, 0),
    getSettings: () => readSettings(),
    updateSettings: (payload: { einkaufskontoZiel: number }) => {
        const current = readSettings();
        return writeSettings({
            ...current,
            einkaufskontoZiel: normalizeNumber(payload.einkaufskontoZiel) || STANDARD_EINKAUFSKONTO_ZIEL
        });
    },
    transferSalesToCompany: (datum: string) => {
        const verkaufssaldo = firmenkontoService.getSaldoByAccount(KONTO_TYPEN.VERKAUF);
        if (verkaufssaldo <= 0) {
            return { amount: 0, rows: [] as any[] };
        }

        const rows = buildTransferRows({
            datum,
            betrag: verkaufssaldo,
            von: KONTO_TYPEN.VERKAUF,
            nach: KONTO_TYPEN.FIRMA,
            betreff: "Wochentransfer Verkauf -> Firmenkonto",
            info: "Automatischer Abschluss der Verkaufseinnahmen"
        }).map(row => firmenkontoService.create(row));

        return { amount: verkaufssaldo, rows };
    },
    topUpPurchasingAccount: (datum: string, zielbetrag: number) => {
        const target = normalizeNumber(zielbetrag) || readSettings().einkaufskontoZiel;
        const einkaufssaldo = firmenkontoService.getSaldoByAccount(KONTO_TYPEN.EINKAUF);
        const differenz = Math.max(0, target - einkaufssaldo);

        if (differenz <= 0) {
            return { amount: 0, rows: [] as any[], target };
        }

        const rows = buildTransferRows({
            datum,
            betrag: differenz,
            von: KONTO_TYPEN.FIRMA,
            nach: KONTO_TYPEN.EINKAUF,
            betreff: "Auffuellung Firmenkonto -> Einkauf",
            info: `Zielbestand Einkaufskonto: ${target.toFixed(2)} EUR`
        }).map(row => firmenkontoService.create(row));

        return { amount: differenz, rows, target };
    },
    runWeeklyTransfer: (datum: string, zielbetrag: number) => {
        const salesTransfer = firmenkontoService.transferSalesToCompany(datum);
        const purchasingTransfer = firmenkontoService.topUpPurchasingAccount(datum, zielbetrag);
        return {
            salesTransfer,
            purchasingTransfer
        };
    }
};

export default firmenkontoService;
