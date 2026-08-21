import { createCRUDService } from "../core/genericService";
import { getCustomerName } from "../../utils/customerReferences";

const reklamationenService = createCRUDService("reklamationen", []);

function hydrateReklamation(item: any = {}) {
    return {
        ...item,
        kunde: getCustomerName(item.kundeId, item.kunde)
    };
}

export function naechsteReklamationsnummer() {
    return `REK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

export default {
    ...reklamationenService,
    list: () => reklamationenService.list().map(hydrateReklamation),
    getAll: () => reklamationenService.list().map(hydrateReklamation),
    getById: (id: any) => {
        const item = reklamationenService.getById(id);
        return item ? hydrateReklamation(item) : undefined;
    },
    create: (payload: any) => hydrateReklamation(reklamationenService.create((( { kunde, ...rest }) => rest)(payload))),
    add: (payload: any) => hydrateReklamation(reklamationenService.create((( { kunde, ...rest }) => rest)(payload))),
    update: (idOrItem: any, payload: any) => {
        if (typeof idOrItem === "object") {
            const { kunde, ...rest } = idOrItem;
            return hydrateReklamation(reklamationenService.update(rest));
        }
        const { kunde, ...rest } = payload || {};
        return hydrateReklamation(reklamationenService.update(idOrItem, rest));
    }
};


