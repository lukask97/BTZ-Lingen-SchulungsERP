import kundenService from "../services/customerService";

export function getCustomerById(kundeId: number | string) {
    return kundenService.list().find(item => String(item.id) === String(kundeId)) || null;
}

export function getCustomerName(kundeId: number | string, fallback = "") {
    return getCustomerById(kundeId)?.firma || fallback;
}
