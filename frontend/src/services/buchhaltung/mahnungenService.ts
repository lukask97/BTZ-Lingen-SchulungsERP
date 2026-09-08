import { createCRUDService } from "../core/genericService";
import rechnungenService from "./rechnungenService";
import { getCustomerName } from "../../utils/customerReferences";
import { canCreateReminder, canTransferToInkasso, getHighestMahnstufe, getMahnlaufPhase, getNextMahnstufe } from "../../utils/accountingWorkflow";
import { getBerlinDate } from "../../utils/dateTime";

const baseService = createCRUDService("mahnungen", []);
const paymentBaseService = createCRUDService("zahlungen", []);

function safeGetInvoiceById(rechnungId: number | string) {
    try {
        return rechnungenService.getById(rechnungId) || null;
    } catch {
        return null;
    }
}

function safeFindInvoiceByNumber(rechnungsnr: string) {
    try {
        return rechnungenService.list().find(entry => entry.rechnungsnr === rechnungsnr) || null;
    } catch {
        return null;
    }
}

function hydrateMahnung(item: any = {}) {
    const rechnung = item.rechnungId ? safeGetInvoiceById(item.rechnungId) : null;
    const referenceInvoice = rechnung || (item.rechnungsnr ? safeFindInvoiceByNumber(item.rechnungsnr) : null);

    return {
        ...item,
        rechnungId: item.rechnungId || referenceInvoice?.id || "",
        rechnungsnr: item.rechnungsnr || referenceInvoice?.rechnungsnr || "",
        kundeId: referenceInvoice?.kundeId || "",
        kunde: getCustomerName(referenceInvoice?.kundeId, item.kunde || referenceInvoice?.kunde || ""),
        fristPhase: item.fristPhase || (referenceInvoice ? getMahnlaufPhase(referenceInvoice) : ""),
        eskalationsgrund: item.eskalationsgrund || ""
    };
}

function splitPayload(payload: any = {}) {
    const { kunde: _kunde, rechnungsnr: _rechnungsnr, kundeId: _kundeId, ...basePayload } = payload;
    return {
        ...basePayload,
        rechnungId: basePayload.rechnungId || "",
        datum: basePayload.datum || getBerlinDate(),
        status: basePayload.status || "gesendet"
    };
}

function getActiveReminders(rechnungId: number | string) {
    return baseService.list()
        .map(hydrateMahnung)
        .filter(item => String(item.rechnungId || "") === String(rechnungId) && String(item.status || "").toLowerCase() !== "storniert");
}

function syncInvoiceStage(rechnungId: number | string) {
    const rechnung = rechnungenService.getById(rechnungId);
    if (!rechnung) return;

    const mahnungen = getActiveReminders(rechnungId);
    const highestStage = getHighestMahnstufe(mahnungen);
    rechnungenService.update({
        ...rechnung,
        mahnstufe: highestStage,
        inkassoStatus: highestStage === "Inkasso" ? "uebergeben" : (rechnung.inkassoStatus || ""),
        inkassoAm: highestStage === "Inkasso"
            ? (mahnungen.find(item => item.stufe === "Inkasso")?.datum || rechnung.inkassoAm || "")
            : (rechnung.inkassoAm || ""),
        status: highestStage === "Inkasso" ? "inkasso" : rechnung.status
    });
}

function validateReminderPayload(payload: any = {}) {
    const rechnung = payload.rechnungId ? safeGetInvoiceById(payload.rechnungId) : null;
    if (!rechnung) {
        throw new Error("Die Rechnung fuer die Mahnung wurde nicht gefunden.");
    }

    const payments = paymentBaseService.list().filter(item => String(item.rechnungId || "") === String(rechnung.id));
    const activeReminders = getActiveReminders(rechnung.id);
    const expectedStage = getNextMahnstufe(activeReminders);
    const requestedStage = payload.stufe || expectedStage;

    if (requestedStage === "Inkasso") {
        if (!canTransferToInkasso(rechnung, payments, activeReminders)) {
            throw new Error("Inkasso ist erst nach der zweiten Mahnung und ausreichender Frist moeglich.");
        }
    } else if (!canCreateReminder(rechnung, payments, activeReminders)) {
        throw new Error("Fuer diese Rechnung ist aktuell keine neue Mahnstufe zulaessig.");
    }

    if (requestedStage !== expectedStage) {
        throw new Error(`Die naechste zulaessige Mahnstufe ist ${expectedStage}.`);
    }

    return {
        ...payload,
        stufe: requestedStage,
        fristPhase: getMahnlaufPhase(rechnung),
        eskalationsgrund: payload.eskalationsgrund || (requestedStage === "Inkasso" ? "Forderung extern / letzte Eskalationsstufe" : "")
    };
}

export default {
    ...baseService,
    list: () => baseService.list().map(hydrateMahnung),
    getAll: () => baseService.list().map(hydrateMahnung),
    getById: (id: any) => {
        const item = baseService.getById(id);
        return item ? hydrateMahnung(item) : undefined;
    },
    create: (payload: any) => {
        const created = hydrateMahnung(baseService.create(splitPayload(validateReminderPayload(payload))));
        syncInvoiceStage(created.rechnungId);
        return created;
    },
    add: (payload: any) => {
        const created = hydrateMahnung(baseService.create(splitPayload(validateReminderPayload(payload))));
        syncInvoiceStage(created.rechnungId);
        return created;
    },
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") {
            const updated = hydrateMahnung(baseService.update(splitPayload(idOrItem)));
            syncInvoiceStage(updated.rechnungId);
            return updated;
        }
        const updated = hydrateMahnung(baseService.update(idOrItem, splitPayload(payload)));
        syncInvoiceStage(updated.rechnungId);
        return updated;
    }
};
