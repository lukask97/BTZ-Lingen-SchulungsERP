import { createCRUDService } from "../core/genericService";

const kundenService = createCRUDService("kunden", []);

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
    return [];
}

export const getKunden = () => withPermissionFallback(() => kundenService.getAll(), getFallbackCustomers());
export const addKunde = (kunde) => kundenService.add(kunde);
export const updateKunde = (kunde) => kundenService.update(kunde);
export const deleteKunde = (id) => kundenService.delete(id);
export const getKundeById = (id) => withPermissionFallback(
    () => (id == null || id === "" ? undefined : kundenService.getById(id)),
    undefined
);
export const searchKunden = (query) => withPermissionFallback(
    () => kundenService.search(query),
    []
);

export default {
    ...kundenService,
    list: () => withPermissionFallback(() => kundenService.list(), getFallbackCustomers()),
    getAll: () => withPermissionFallback(() => kundenService.getAll(), getFallbackCustomers()),
    getById: (id) => withPermissionFallback(
        () => (id == null || id === "" ? undefined : kundenService.getById(id)),
        undefined
    ),
    search: (query) => withPermissionFallback(
        () => kundenService.search(query),
        []
    )
};


