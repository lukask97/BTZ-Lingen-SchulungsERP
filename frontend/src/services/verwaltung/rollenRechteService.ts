import { createCRUDService } from "../core/genericService";

export type RollenRecht = {
    id: number | string | null;
    rolleId: number | string | null;
    rolleName: string;
    rechtName: string;
};
type RollenRechtPayload = Partial<RollenRecht> & Omit<RollenRecht, "id">;

const baseService = createCRUDService<RollenRecht>("rollenRechte", []);

function normalizeAssignment(item: RollenRecht) {
    return {
        ...item,
        rolleName: String(item.rolleName || "").trim(),
        rechtName: String(item.rechtName || "").trim()
    };
}

const rollenRechteService = {
    list: () => baseService.list().map(normalizeAssignment),
    getAll: () => baseService.list().map(normalizeAssignment),
    getById: (id: number | string) => {
        const item = baseService.getById(id);
        return item ? normalizeAssignment(item) : undefined;
    },
    create: (payload: RollenRechtPayload) => baseService.create(normalizeAssignment({ id: null, ...payload })),
    add: (payload: RollenRechtPayload) => baseService.create(normalizeAssignment({ id: null, ...payload })),
    update: (idOrItem: number | string | RollenRecht, payload?: Partial<RollenRecht>) => {
        if (typeof idOrItem === "object") {
            return baseService.update(normalizeAssignment(idOrItem));
        }
        return baseService.update(idOrItem, normalizeAssignment({ ...(payload as RollenRecht), id: idOrItem }));
    },
    remove: (id: number | string) => baseService.remove(id),
    delete: (id: number | string) => baseService.remove(id),
    removeByRole(roleId: number | string, roleName = "") {
        this.getAll()
            .filter(item =>
                String(item.rolleId ?? "") === String(roleId)
                || String(item.rolleName || "").toLowerCase() === String(roleName || "").toLowerCase()
            )
            .forEach(item => {
                if (item.id != null) {
                    this.remove(item.id);
                }
            });
    }
};

export default rollenRechteService;


