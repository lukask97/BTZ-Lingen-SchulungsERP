import { rollen } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import { resolveRolePermissions } from "../../auth/permissionResolver";
import rollenRechteService from "./rollenRechteService";

const rollenService = createCRUDService("rollen", rollen);

function enrichRole(role) {
    return {
        ...role,
        permissions: resolveRolePermissions(role, rollenRechteService.getAll())
    };
}

function syncRolePermissions(role) {
    rollenRechteService.removeByRole(role.id, role.name);
    (role.permissions || []).forEach(permission => {
        rollenRechteService.create({
            rolleId: role.id,
            rolleName: role.name,
            rechtName: permission
        });
    });
}

export const getRollen = () => rollenService.getAll().map(enrichRole);
export const addRolle = (rolle) => {
    const created = rollenService.add({ ...rolle, permissions: undefined });
    syncRolePermissions({ ...created, permissions: rolle.permissions || [] });
    return enrichRole(created);
};
export const updateRolle = (rolle) => {
    const updated = rollenService.update({ ...rolle, permissions: undefined });
    syncRolePermissions(rolle);
    return enrichRole(updated);
};
export const deleteRolle = (id) => {
    const rolle = rollenService.getById(id);
    if (rolle) {
        rollenRechteService.removeByRole(rolle.id, rolle.name);
    }
    return rollenService.delete(id);
};

export default {
    ...rollenService,
    list: () => getRollen(),
    getAll: () => getRollen(),
    getById: (id) => {
        const rolle = rollenService.getById(id);
        return rolle ? enrichRole(rolle) : undefined;
    },
    create: addRolle,
    add: addRolle,
    update: updateRolle,
    remove: deleteRolle,
    delete: deleteRolle
};
