import { apiRequest } from "../core/api";

export async function listKlassen() {
    const result = await apiRequest("/admin/klassen");
    return result.items || [];
}

export async function createKlasse(payload) {
    const result = await apiRequest("/admin/klassen", {
        method: "POST",
        body: JSON.stringify(payload)
    });
    return result.item;
}

export async function updateKlasse(id, payload) {
    const result = await apiRequest(`/admin/klassen/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
    });
    return result.item;
}

export async function deleteKlasseWithPassword(id, password) {
    const result = await apiRequest(`/admin/klassen/${id}/delete-with-password`, {
        method: "POST",
        body: JSON.stringify({ password })
    });
    return result.item;
}
