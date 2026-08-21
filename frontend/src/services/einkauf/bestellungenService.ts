import { createCRUDService } from "../core/genericService";
import { createPositionTableService } from "../core/positionTableService";
import artikelService from "../logistik/artikelService";
import { getSupplierName } from "../../utils/supplierReferences";
import { getBerlinDate } from "../../utils/dateTime";
import lieferantenArtikelStaffelnService from "./lieferantenArtikelStaffelnService";

const bestellungenService = createCRUDService("bestellungen", []);
const positionService = createPositionTableService([], {
    tableName: "bestellpositionen",
    parentField: "bestellungId"
});

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
        einzelpreis: Number(position.einzelpreis || artikel?.einkaufspreis || 0),
        lieferzeitTage: Number(position.lieferzeitTage || 0)
    };
}

function splitPayload(payload: any = {}) {
    const { positionen = [], lieferant, ...basePayload } = payload;
    return {
        basePayload,
        positionen: positionen.map(normalizePosition)
    };
}

const OFFENE_BESTELLSTATUS = ["angefragt", "bestaetigt", "versendet"];

export function naechsteBestellnummer() {
    return `EK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

const service = {
    ...bestellungenService,
    list: () => withPermissionFallback(
        () => bestellungenService.list().map(hydrateBestellung),
        []
    ),
    getAll: () => withPermissionFallback(
        () => bestellungenService.list().map(hydrateBestellung),
        []
    ),
    getById: (id: any) => {
        const item = withPermissionFallback(() => bestellungenService.getById(id), undefined);
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
    update: (idOrItem: any, payload: any) => {
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

export function getOffeneBestellmengenProArtikel() {
    return service.getAll()
        .filter(bestellung => OFFENE_BESTELLSTATUS.includes(String(bestellung.status || "").toLowerCase()))
        .reduce((map: Record<string, number>, bestellung) => {
            (bestellung.positionen || []).forEach((position: any) => {
                const key = String(position.artikelId || "");
                if (!key) return;
                map[key] = Number(map[key] || 0) + Number(position.menge || 0);
            });
            return map;
        }, {});
}

export function getAutomatischeBedarfsmeldungen() {
    const offeneBestellmengen = getOffeneBestellmengenProArtikel();

    return artikelService.getAll()
        .filter(item => Number(item.bedarfsmeldungBei || 0) > 0)
        .filter(item => {
            const bestand = Number(item.bestand || 0);
            const imZulauf = Number(offeneBestellmengen[String(item.id)] || 0);
            const bedarfsmeldungBei = Number(item.bedarfsmeldungBei || 0);
            return bestand + imZulauf <= bedarfsmeldungBei;
        })
        .map(item => ({
            ...(() => {
                const empfohleneMenge = Math.max(
                    1,
                    Number(item.mindestmenge || 0) > (Number(item.bestand || 0) + Number(offeneBestellmengen[String(item.id)] || 0))
                        ? Number(item.mindestmenge || 0) - (Number(item.bestand || 0) + Number(offeneBestellmengen[String(item.id)] || 0))
                        : Number(item.bedarfsmeldungBei || 0) - (Number(item.bestand || 0) + Number(offeneBestellmengen[String(item.id)] || 0)) + 1
                );
                const schnellsteOption = lieferantenArtikelStaffelnService.getPreferredSupplierForArtikel(item.id, empfohleneMenge, "balanced");
                const groessteOption = lieferantenArtikelStaffelnService.getPreferredSupplierForArtikel(item.id, empfohleneMenge, "maxQuantity");
                return {
                    empfohleneMenge,
                    vorgeschlagenerLieferantId: schnellsteOption?.lieferantId || "",
                    vorgeschlageneLieferzeitTage: Number(schnellsteOption?.besteStaffel?.lieferzeitTage || 0),
                    vorgeschlagenerStueckpreis: Number(schnellsteOption?.besteStaffel?.stueckpreis || item.einkaufspreis || 0),
                    maximalMengenLieferantId: groessteOption?.lieferantId || "",
                    maximalMengenLieferzeitTage: Number(groessteOption?.besteStaffel?.lieferzeitTage || 0),
                    maximalMengenSchwelle: Number(groessteOption?.maxMengenStaffel?.mindestbestellmenge || 0)
                };
            })(),
            id: `auto-artikel-${item.id}`,
            artikelId: item.id,
            artikelNr: item.artikelNr,
            artikel: item.name,
            bestand: Number(item.bestand || 0),
            imZulauf: Number(offeneBestellmengen[String(item.id)] || 0),
            bedarfsmeldungBei: Number(item.bedarfsmeldungBei || 0),
            mindestmenge: Number(item.mindestmenge || 0)
        }));
}

export default service;
