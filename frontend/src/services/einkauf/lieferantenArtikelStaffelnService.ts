import { createCRUDService } from "../core/genericService";

const service = createCRUDService("lieferantenArtikelStaffeln", []);

function normalizeStaffel(item: any = {}) {
    return {
        ...item,
        artikelId: item.artikelId || "",
        lieferantId: item.lieferantId || "",
        mindestbestellmenge: Number(item.mindestbestellmenge || 1),
        stueckpreis: Number(item.stueckpreis || 0),
        lieferzeitTage: Number(item.lieferzeitTage || 1),
        notiz: String(item.notiz || "").trim()
    };
}

export default {
    ...service,
    listByArtikel(artikelId: any) {
        return service.list()
            .filter(item => String(item.artikelId) === String(artikelId))
            .map(normalizeStaffel)
            .sort((a, b) => Number(a.mindestbestellmenge || 0) - Number(b.mindestbestellmenge || 0));
    },
    listByPair(artikelId: any, lieferantId: any) {
        return service.list()
            .filter(item => String(item.artikelId) === String(artikelId) && String(item.lieferantId) === String(lieferantId))
            .map(normalizeStaffel)
            .sort((a, b) => Number(a.mindestbestellmenge || 0) - Number(b.mindestbestellmenge || 0));
    },
    replaceForPair(artikelId: any, lieferantId: any, staffeln: any[] = []) {
        const vorhandene = service.list().filter(item =>
            String(item.artikelId) === String(artikelId) && String(item.lieferantId) === String(lieferantId)
        );

        vorhandene.forEach(item => {
            if (item.id != null) {
                service.remove(item.id);
            }
        });

        return (staffeln || []).map(staffel => service.create(normalizeStaffel({
            ...staffel,
            artikelId,
            lieferantId
        })));
    },
    listGrouped(artikelListe: any[] = [], lieferantenListe: any[] = []) {
        const gruppen = new Map();

        service.list().forEach(eintrag => {
            const key = `${eintrag.artikelId}-${eintrag.lieferantId}`;
            const artikel = artikelListe.find(item => String(item.id) === String(eintrag.artikelId));
            const lieferant = lieferantenListe.find(item => String(item.id) === String(eintrag.lieferantId));
            const vorhanden = gruppen.get(key) || {
                id: key,
                artikelId: eintrag.artikelId,
                lieferantId: eintrag.lieferantId,
                artikelNr: artikel?.artikelNr || "",
                artikel: artikel?.name || `Artikel ${eintrag.artikelId}`,
                lieferantenNr: lieferant?.lieferantenNr || "",
                lieferant: lieferant?.firma || `Lieferant ${eintrag.lieferantId}`,
                staffeln: []
            };

            vorhanden.staffeln.push(normalizeStaffel(eintrag));
            gruppen.set(key, vorhanden);
        });

        return [...gruppen.values()]
            .map(gruppe => ({
                ...gruppe,
                staffeln: gruppe.staffeln.sort((a, b) => Number(a.mindestbestellmenge || 0) - Number(b.mindestbestellmenge || 0)),
                staffeltext: gruppe.staffeln
                    .sort((a, b) => Number(a.mindestbestellmenge || 0) - Number(b.mindestbestellmenge || 0))
                    .map(item => String(Number(item.mindestbestellmenge || 0)))
                    .join(" | ")
            }))
            .sort((a, b) => `${a.artikelNr}${a.lieferant}`.localeCompare(`${b.artikelNr}${b.lieferant}`));
    },
    getSupplierIdsForArtikel(artikelId: any) {
        return [...new Set(this.listByArtikel(artikelId).map(item => String(item.lieferantId || "")).filter(Boolean))];
    },
    getBestStaffelForQuantity(artikelId: any, lieferantId: any, menge: any) {
        const staffeln = this.listByPair(artikelId, lieferantId);
        if (staffeln.length === 0) return null;
        const sortierteStaffeln = [...staffeln].sort((a, b) => Number(a.mindestbestellmenge || 0) - Number(b.mindestbestellmenge || 0));
        return sortierteStaffeln.filter(item => Number(item.mindestbestellmenge || 0) <= Number(menge || 0)).slice(-1)[0] || sortierteStaffeln[0];
    },
    getPreferredSupplierForArtikel(artikelId: any, menge: any, mode = "balanced") {
        const lieferantIds = this.getSupplierIdsForArtikel(artikelId);
        const optionen = lieferantIds.map(lieferantId => {
            const supplierStaffeln = this.listByPair(artikelId, lieferantId);
            return {
                lieferantId,
                besteStaffel: this.getBestStaffelForQuantity(artikelId, lieferantId, menge),
                maxMengenStaffel: [...supplierStaffeln].sort((a, b) => Number(b.mindestbestellmenge || 0) - Number(a.mindestbestellmenge || 0))[0] || null
            };
        }).filter(item => item.besteStaffel);

        if (optionen.length === 0) return null;
        if (mode === "maxQuantity") {
            return optionen.sort((a, b) => {
                const maxDelta = Number(b.maxMengenStaffel?.mindestbestellmenge || 0) - Number(a.maxMengenStaffel?.mindestbestellmenge || 0);
                if (maxDelta !== 0) return maxDelta;
                return Number(a.besteStaffel?.lieferzeitTage || 0) - Number(b.besteStaffel?.lieferzeitTage || 0);
            })[0];
        }

        return optionen.sort((a, b) => {
            const lieferzeitDelta = Number(a.besteStaffel?.lieferzeitTage || 0) - Number(b.besteStaffel?.lieferzeitTage || 0);
            if (lieferzeitDelta !== 0) return lieferzeitDelta;
            return Number(a.besteStaffel?.stueckpreis || 0) - Number(b.besteStaffel?.stueckpreis || 0);
        })[0];
    }
};


