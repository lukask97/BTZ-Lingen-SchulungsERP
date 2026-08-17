import lieferantenService from "../services/einkauf/lieferantenService";

export function getSupplierById(lieferantId: number | string) {
    if (lieferantId === null || lieferantId === undefined || lieferantId === "") {
        return null;
    }

    try {
        return lieferantenService.list().find(item => String(item.id) === String(lieferantId)) || null;
    } catch {
        return null;
    }
}

export function getSupplierName(lieferantId: number | string, fallback = "") {
    if (fallback) {
        return fallback;
    }

    return getSupplierById(lieferantId)?.firma || fallback;
}
