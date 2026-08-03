import kundenService from "../services/verkauf/customerService";

export function getCustomerById(kundeId: number | string) {
    try {
        return kundenService.list().find(item => String(item.id) === String(kundeId)) || null;
    } catch {
        return null;
    }
}

export function getCustomerName(kundeId: number | string, fallback = "") {
    if (fallback) {
        return fallback;
    }

    return getCustomerById(kundeId)?.firma || fallback;
}
