import { mahnungen } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import rechnungenService from "./rechnungenService";
import { getCustomerName } from "../../utils/customerReferences";

const baseService = createCRUDService("mahnungen", mahnungen);

function hydrateMahnung(item: any = {}) {
    const rechnung = item.rechnungId ? rechnungenService.getById(item.rechnungId) : null;
    const referenceInvoice = rechnung || (item.rechnungsnr ? rechnungenService.list().find(entry => entry.rechnungsnr === item.rechnungsnr) : null);

    return {
        ...item,
        rechnungId: item.rechnungId || referenceInvoice?.id || "",
        rechnungsnr: item.rechnungsnr || referenceInvoice?.rechnungsnr || "",
        kundeId: referenceInvoice?.kundeId || "",
        kunde: getCustomerName(referenceInvoice?.kundeId, item.kunde || referenceInvoice?.kunde || "")
    };
}

function splitPayload(payload: any = {}) {
    const { kunde, rechnungsnr, kundeId, ...basePayload } = payload;
    return {
        ...basePayload,
        rechnungId: basePayload.rechnungId || ""
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
    create: (payload: any) => hydrateMahnung(baseService.create(splitPayload(payload))),
    add: (payload: any) => hydrateMahnung(baseService.create(splitPayload(payload))),
    update: (idOrItem: any, payload: any) => {
        if (typeof idOrItem === "object") {
            return hydrateMahnung(baseService.update(splitPayload(idOrItem)));
        }
        return hydrateMahnung(baseService.update(idOrItem, splitPayload(payload)));
    }
};
