import { bestellungen, bestellpositionen } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import { createPositionTableService } from "../core/positionTableService";
import artikelService from "../logistik/artikelService";
import { getSupplierName } from "../../utils/supplierReferences";
import { getBerlinDate } from "../../utils/dateTime";

const bestellungenService = createCRUDService("bestellungen", bestellungen);
const positionService = createPositionTableService(bestellpositionen, {
    tableName: "bestellpositionen",
    parentField: "bestellungId"
});

function hydrateBestellung(item: any = {}) {
    return {
        ...item,
        lieferant: getSupplierName(item.lieferantId, item.lieferant),
        positionen: positionService.listByParent(item.id || "")
            .map(position => {
                const normalized = normalizePosition(position);
                const { bestellungId, ...rest } = position;
                return {
                    ...rest,
                    artikel: normalized.artikel
                };
            })
    };
}

function normalizePosition(position: any = {}) {
    const artikel = artikelService.getAll().find(item => String(item.id) === String(position.artikelId));
    return {
        ...position,
        artikelNr: artikel?.artikelNr || position.artikelNr || "",
        artikel: artikel?.name || position.artikel || "",
        einzelpreis: Number(position.einzelpreis ?? artikel?.einkaufspreis ?? 0)
    };
}

function splitPayload(payload: any = {}) {
    const { positionen = [], lieferant, ...basePayload } = payload;
    return {
        basePayload,
        positionen: positionen.map(normalizePosition)
    };
}

export function naechsteBestellnummer() {
    return `EK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

const service = {
    ...bestellungenService,
    list: () => bestellungenService.list().map(hydrateBestellung),
    getAll: () => bestellungenService.list().map(hydrateBestellung),
    getById: (id: any) => {
        const item = bestellungenService.getById(id);
        return item ? hydrateBestellung(item) : undefined;
    },
    create: (payload: any) => {
        const { basePayload, positionen } = splitPayload(payload);
        const created = bestellungenService.create(basePayload);
        positionService.replaceForParent(created.id, positionen);
        return hydrateBestellung(created);
    },
    add: (payload: any) => {
        const { basePayload, positionen } = splitPayload(payload);
        const created = bestellungenService.create(basePayload);
        positionService.replaceForParent(created.id, positionen);
        return hydrateBestellung(created);
    },
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") {
            const { basePayload, positionen } = splitPayload(idOrItem);
            const updated = bestellungenService.update(basePayload);
            positionService.replaceForParent(updated.id, positionen);
            return hydrateBestellung(updated);
        }
        const { basePayload, positionen } = splitPayload(payload);
        const updated = bestellungenService.update(idOrItem, basePayload);
        positionService.replaceForParent(updated.id, positionen);
        return hydrateBestellung(updated);
    },
    remove: (id: any) => {
        positionService.removeByParent(id);
        return bestellungenService.remove(id);
    },
    delete: (id: any) => {
        positionService.removeByParent(id);
        return bestellungenService.remove(id);
    }
};

export function bestaetigeBestellung(bestellung: any) {
    return service.update(bestellung.id, {
        ...bestellung,
        status: "bestaetigt"
    });
}

export function versendeBestellung(bestellung: any) {
    return service.update(bestellung.id, {
        ...bestellung,
        status: "versendet",
        versendetAm: getBerlinDate()
    });
}

export default service;
