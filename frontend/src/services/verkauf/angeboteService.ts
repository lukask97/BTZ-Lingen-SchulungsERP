import { angebote } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";

const baseService = createCRUDService("angebote", angebote);

function splitAngebotsnummer(value: any = "") {
    const text = String(value || "");
    const match = text.match(/^(.*)\.(\d+)$/);
    if (!match) return { basis: text, revision: 0 };
    return { basis: match[1], revision: Number(match[2] || 0) };
}

function normalizeAngebot(item: any = {}) {
    const nummer = String(item.angebotsNr || "");
    const nummerInfo = splitAngebotsnummer(nummer);
    const basis = item.angebotsBasisNr || nummerInfo.basis || nummer;
    const revision = Number(item.revision ?? nummerInfo.revision ?? 0);
    return {
        ...item,
        angebotsBasisNr: basis,
        revision,
        angebotsNr: basis ? `${basis}.${revision}` : nummer,
        vorgangId: item.vorgangId || (item.anfrageId ? `anfrage-${item.anfrageId}` : `angebot-${basis || item.id || "neu"}`)
    };
}

const angeboteService = {
    list: () => baseService.list().map(normalizeAngebot),
    getAll: () => baseService.list().map(normalizeAngebot),
    getById: (id: any) => {
        const item = baseService.getById(id);
        return item ? normalizeAngebot(item) : undefined;
    },
    create: (payload: any) => baseService.create(normalizeAngebot(payload)),
    add: (payload: any) => baseService.create(normalizeAngebot(payload)),
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") return baseService.update(normalizeAngebot(idOrItem));
        return baseService.update(idOrItem, normalizeAngebot(payload));
    },
    remove: (id: any) => baseService.remove(id),
    delete: (id: any) => baseService.remove(id)
};

export function naechsteAngebotsnummer() {
    return `ANG-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}.0`;
}

export function naechsteAngebotsrevision(vorgangId: any) {
    const eintraege = angeboteService.getAll().filter(item => item.vorgangId === vorgangId);
    if (eintraege.length === 0) return { angebotsBasisNr: `ANG-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`, revision: 0 };
    const basis = eintraege[0].angebotsBasisNr;
    const revision = Math.max(...eintraege.map(item => Number(item.revision || 0))) + 1;
    return { angebotsBasisNr: basis, revision };
}

export default angeboteService;
