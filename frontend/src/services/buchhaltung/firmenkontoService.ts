import { createCRUDService } from "../core/genericService";
import kundenService from "../verkauf/customerService";
import lieferantenService from "../einkauf/lieferantenService";
import unternehmenService from "../verwaltung/unternehmenService";

const baseService = createCRUDService("firmenkonto", []);

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

function buildReferencePurpose(zahlung: any) {
    if (zahlung?.rechnungsnr) {
        return String(zahlung.rechnungsnr || "").startsWith("ER-")
            ? `Eingangsrechnung ${zahlung.rechnungsnr}`
            : `Rechnung ${zahlung.rechnungsnr}`;
    }
    if (zahlung?.bestellNr) return `Bestellung ${zahlung.bestellNr}`;
    return String(zahlung?.verwendungszweck || "").trim();
}

function getCompanyAccountMeta(konto: string) {
    const unternehmen = unternehmenService.get();
    if (konto === KONTO_TYPEN.VERKAUF) {
        return {
            id: unternehmen.id || 1,
            typ: "unternehmen",
            name: unternehmen.verkaufKontoname || unternehmen.firmenname || "Verkaufskonto",
            iban: unternehmen.verkaufIban || ""
        };
    }
    if (konto === KONTO_TYPEN.EINKAUF) {
        return {
            id: unternehmen.id || 1,
            typ: "unternehmen",
            name: unternehmen.einkaufKontoname || unternehmen.firmenname || "Einkaufskonto",
            iban: unternehmen.einkaufIban || ""
        };
    }
    return {
        id: unternehmen.id || 1,
        typ: "unternehmen",
        name: unternehmen.firmaKontoname || unternehmen.firmenname || "Firmenkonto",
        iban: unternehmen.firmaIban || ""
    };
}

function getPartyMeta({
    id,
    typ,
    name,
    iban
}: {
    id?: number | string;
    typ?: string;
    name?: string;
    iban?: string;
}) {
    return {
        id: id || "",
        typ: typ || "",
        name: name || "",
        iban: iban || ""
    };
}

function resolveCounterpartyForPayment(zahlung: any, isIncoming: boolean) {
    if (isIncoming && zahlung.kundeId) {
        const kunde = kundenService.getById(zahlung.kundeId);
        return getPartyMeta({
            id: kunde?.id || zahlung.kundeId,
            typ: "kunde",
            name: kunde?.firma || zahlung.name || "",
            iban: kunde?.iban || zahlung.iban || ""
        });
    }
    if (!isIncoming && zahlung.lieferantId) {
        const lieferant = lieferantenService.getById(zahlung.lieferantId);
        return getPartyMeta({
            id: lieferant?.id || zahlung.lieferantId,
            typ: "lieferant",
            name: lieferant?.firma || zahlung.name || "",
            iban: lieferant?.iban || zahlung.iban || ""
        });
    }

    return getPartyMeta({
        id: "",
        typ: isIncoming ? "kunde" : "lieferant",
        name: zahlung.name || "",
        iban: zahlung.iban || ""
    });
}

function normalizeRow(item: any = {}) {
    return {
        ...item,
        konto: normalizeAccountType(item.konto),
        valuta: item.valuta || item.datum || "",
        verwendungszweck: item.verwendungszweck || item.info || item.betreff || "",
        senderId: item.senderId || "",
        senderTyp: item.senderTyp || "",
        senderName: item.senderName || "",
        senderIban: item.senderIban || "",
        empfaengerId: item.empfaengerId || "",
        empfaengerTyp: item.empfaengerTyp || "",
        empfaengerName: item.empfaengerName || "",
        empfaengerIban: item.empfaengerIban || "",
        soll: normalizeNumber(item.soll),
        haben: normalizeNumber(item.haben),
        statusBearbeitung: item.statusBearbeitung || "",
        bankbewegungTyp: item.bankbewegungTyp || "",
        bearbeitetAm: item.bearbeitetAm || "",
        matchResult: item.matchResult || "",
        zahlungId: item.zahlungId || "",
        rechnungId: item.rechnungId || "",
        restbetrag: normalizeNumber(item.restbetrag),
        ueberzahlung: normalizeNumber(item.ueberzahlung)
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
    valuta,
    betrag,
    von,
    nach,
    verwendungszweck
}: {
    valuta: string;
    betrag: number;
    von: string;
    nach: string;
    verwendungszweck: string;
}) {
    const sender = getCompanyAccountMeta(von);
    const empfaenger = getCompanyAccountMeta(nach);

    return [
        normalizeRow({
            valuta,
            konto: von,
            verwendungszweck,
            senderId: sender.id,
            senderTyp: "konto-intern",
            senderName: sender.name,
            senderIban: sender.iban,
            empfaengerId: empfaenger.id,
            empfaengerTyp: "konto-intern",
            empfaengerName: empfaenger.name,
            empfaengerIban: empfaenger.iban,
            soll: betrag,
            haben: 0,
            bankbewegungTyp: "transfer"
        }),
        normalizeRow({
            valuta,
            konto: nach,
            verwendungszweck,
            senderId: sender.id,
            senderTyp: "konto-intern",
            senderName: sender.name,
            senderIban: sender.iban,
            empfaengerId: empfaenger.id,
            empfaengerTyp: "konto-intern",
            empfaengerName: empfaenger.name,
            empfaengerIban: empfaenger.iban,
            soll: 0,
            haben: betrag,
            bankbewegungTyp: "transfer"
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
    update: (idOrItem: any, payload?: any) => {
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
    transferSalesToCompany: (valuta: string) => {
        const verkaufssaldo = firmenkontoService.getSaldoByAccount(KONTO_TYPEN.VERKAUF);
        if (verkaufssaldo <= 0) {
            return { amount: 0, rows: [] as any[] };
        }

        const rows = buildTransferRows({
            valuta,
            betrag: verkaufssaldo,
            von: KONTO_TYPEN.VERKAUF,
            nach: KONTO_TYPEN.FIRMA,
            verwendungszweck: "Wochentransfer Verkauf -> Firmenkonto"
        }).map(row => firmenkontoService.create(row));

        return { amount: verkaufssaldo, rows };
    },
    topUpPurchasingAccount: (valuta: string, zielbetrag: number) => {
        const target = normalizeNumber(zielbetrag) || readSettings().einkaufskontoZiel;
        const einkaufssaldo = firmenkontoService.getSaldoByAccount(KONTO_TYPEN.EINKAUF);
        const differenz = Math.max(0, target - einkaufssaldo);

        if (differenz <= 0) {
            return { amount: 0, rows: [] as any[], target };
        }

        const rows = buildTransferRows({
            valuta,
            betrag: differenz,
            von: KONTO_TYPEN.FIRMA,
            nach: KONTO_TYPEN.EINKAUF,
            verwendungszweck: `Auffuellung Firmenkonto -> Einkauf (${target.toFixed(2)} EUR Zielbestand)`
        }).map(row => firmenkontoService.create(row));

        return { amount: differenz, rows, target };
    },
    runWeeklyTransfer: (valuta: string, zielbetrag: number) => {
        const salesTransfer = firmenkontoService.transferSalesToCompany(valuta);
        const purchasingTransfer = firmenkontoService.topUpPurchasingAccount(valuta, zielbetrag);
        return {
            salesTransfer,
            purchasingTransfer
        };
    },
    findByPaymentId: (zahlungId: number | string) => firmenkontoService.list()
        .find(item => String(item.zahlungId || "") === String(zahlungId)) || null,
    ensureBookingForPayment: (zahlung: any) => {
        if (!zahlung || String(zahlung.status || "").toLowerCase() !== "ausgefuehrt") return null;

        const existing = firmenkontoService.findByPaymentId(zahlung.id);
        const isIncoming = String(zahlung.zahlungsart || "").toLowerCase() !== "ausgang";
        const konto = isIncoming ? KONTO_TYPEN.VERKAUF : KONTO_TYPEN.EINKAUF;
        const ownParty = getCompanyAccountMeta(konto);
        const otherParty = resolveCounterpartyForPayment(zahlung, isIncoming);

        const payload = normalizeRow({
            ...(existing || {}),
            valuta: zahlung.ausfuehrungsdatum || zahlung.ausfuehrenAm || zahlung.datum || "",
            konto,
            verwendungszweck: buildReferencePurpose(zahlung),
            senderId: isIncoming ? otherParty.id : ownParty.id,
            senderTyp: isIncoming ? otherParty.typ : "unternehmen",
            senderName: isIncoming ? otherParty.name : ownParty.name,
            senderIban: isIncoming ? otherParty.iban : ownParty.iban,
            empfaengerId: isIncoming ? ownParty.id : otherParty.id,
            empfaengerTyp: isIncoming ? "unternehmen" : otherParty.typ,
            empfaengerName: isIncoming ? ownParty.name : otherParty.name,
            empfaengerIban: isIncoming ? ownParty.iban : otherParty.iban,
            soll: isIncoming ? 0 : Number(zahlung.betrag || 0),
            haben: isIncoming ? Number(zahlung.betrag || 0) : 0,
            zahlungId: zahlung.id,
            rechnungId: zahlung.rechnungId || "",
            statusBearbeitung: isIncoming ? (existing?.statusBearbeitung || "unbearbeitet") : (existing?.statusBearbeitung || "bearbeitet"),
            bankbewegungTyp: isIncoming ? "zahlungseingang" : "zahlungsausgang"
        });

        return existing
            ? firmenkontoService.update(existing.id, payload)
            : firmenkontoService.create(payload);
    },
    listSalesPaymentEntries: () => firmenkontoService.list()
        .filter(item => item.konto === KONTO_TYPEN.VERKAUF && item.bankbewegungTyp === "zahlungseingang"),
    markSalesPaymentProcessed: (entryId: number | string, payload: any = {}) => {
        const current = firmenkontoService.getById(entryId);
        if (!current) return null;
        return firmenkontoService.update(entryId, {
            ...current,
            ...payload,
            statusBearbeitung: payload.statusBearbeitung || "bearbeitet"
        });
    }
};

export default firmenkontoService;
