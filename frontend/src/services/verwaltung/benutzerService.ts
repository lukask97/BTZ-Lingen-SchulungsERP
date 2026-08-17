import { benutzer } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import { getUserFullName } from "../../utils/userDisplay";

const benutzerService = createCRUDService("benutzer", benutzer);

function normalizeUser(item) {
    if (!item) return item;
    const vorname = String(item.vorname || "").trim();
    const nachname = String(item.nachname || "").trim();

    return {
        ...item,
        vorname,
        nachname,
        name: getUserFullName({ ...item, vorname, nachname })
    };
}

export const getBenutzer = () => benutzerService.getAll().map(normalizeUser);
export const addBenutzer = (benutzer) => normalizeUser(benutzerService.add(normalizeUser(benutzer)));
export const updateBenutzer = (benutzer) => normalizeUser(benutzerService.update(normalizeUser(benutzer)));
export const deleteBenutzer = (id) => benutzerService.delete(id);

export default {
    ...benutzerService,
    list: () => benutzerService.list().map(normalizeUser),
    getAll: () => benutzerService.getAll().map(normalizeUser),
    getById: id => normalizeUser(benutzerService.getById(id)),
    create: payload => normalizeUser(benutzerService.create(normalizeUser(payload))),
    add: payload => normalizeUser(benutzerService.add(normalizeUser(payload))),
    update: (idOrItem, payload) => normalizeUser(benutzerService.update(
        typeof idOrItem === "object" ? normalizeUser(idOrItem) : idOrItem,
        payload ? normalizeUser(payload) : payload
    )),
    delete: benutzerService.delete,
    remove: benutzerService.remove
};
