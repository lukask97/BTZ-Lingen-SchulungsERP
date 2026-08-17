import { kundenanfragen } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import { getCustomerName } from "../../utils/customerReferences";

const baseService = createCRUDService("kundenanfragen", kundenanfragen);

function withPermissionFallback<T>(reader: () => T, fallback: T) {
    try {
        return reader();
    } catch (error) {
        if (error instanceof Error && error.message.startsWith("Keine Berechtigung")) {
            return fallback;
        }

        throw error;
    }
}

function withSafeLookup<T>(reader: () => T, fallback: T) {
    try {
        return reader();
    } catch (error) {
        if (
            error instanceof Error
            && (
                error.message.startsWith("Keine Berechtigung")
                || error.message.includes("nicht gefunden")
                || error.message.includes("nicht vorbereitet")
                || error.message.toLowerCase().includes("api request failed with status 404")
            )
        ) {
            return fallback;
        }

        throw error;
    }
}

function hydrateInquiry(item: any = {}) {
    return {
        ...item,
        kunde: withPermissionFallback(() => getCustomerName(item.kundeId, item.kunde), item.kunde || "")
    };
}

function splitPayload(payload: any = {}) {
    const { kunde, ...basePayload } = payload;
    return basePayload;
}

export default {
    ...baseService,
    list: () => baseService.list().map(hydrateInquiry),
    getAll: () => baseService.list().map(hydrateInquiry),
    getById: (id: any) => {
        const item = withSafeLookup(() => baseService.getById(id), undefined);
        return item ? hydrateInquiry(item) : undefined;
    },
    create: (payload: any) => hydrateInquiry(baseService.create(splitPayload(payload))),
    add: (payload: any) => hydrateInquiry(baseService.create(splitPayload(payload))),
    update: (idOrItem: any, payload: any) => {
        if (typeof idOrItem === "object") {
            return hydrateInquiry(baseService.update(splitPayload(idOrItem)));
        }
        return hydrateInquiry(baseService.update(idOrItem, splitPayload(payload)));
    }
};
