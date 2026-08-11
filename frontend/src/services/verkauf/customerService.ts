import { kunden } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";

const kundenService = createCRUDService("kunden", kunden);

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

function getFallbackCustomers() {
    return kunden;
}

export const getKunden = () => withPermissionFallback(() => kundenService.getAll(), getFallbackCustomers());
export const addKunde = (kunde) => kundenService.add(kunde);
export const updateKunde = (kunde) => kundenService.update(kunde);
export const deleteKunde = (id) => kundenService.delete(id);
export const getKundeById = (id) => withPermissionFallback(
    () => (id == null || id === "" ? undefined : kundenService.getById(id)),
    getFallbackCustomers().find(item => String(item.id) === String(id))
);
export const searchKunden = (query) => withPermissionFallback(
    () => kundenService.search(query),
    getFallbackCustomers().filter(item => JSON.stringify(item).toLowerCase().includes(String(query || "").toLowerCase()))
);

export default {
    ...kundenService,
    list: () => withPermissionFallback(() => kundenService.list(), getFallbackCustomers()),
    getAll: () => withPermissionFallback(() => kundenService.getAll(), getFallbackCustomers()),
    getById: (id) => withPermissionFallback(
        () => (id == null || id === "" ? undefined : kundenService.getById(id)),
        getFallbackCustomers().find(item => String(item.id) === String(id))
    ),
    search: (query) => withPermissionFallback(
        () => kundenService.search(query),
        getFallbackCustomers().filter(item => JSON.stringify(item).toLowerCase().includes(String(query || "").toLowerCase()))
    )
};
