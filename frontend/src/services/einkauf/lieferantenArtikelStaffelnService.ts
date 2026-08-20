import { createCRUDService } from "../core/genericService";
import { lieferantenArtikelStaffeln } from "../mockup/mockData";

const service = createCRUDService("lieferantenArtikelStaffeln", lieferantenArtikelStaffeln);

function normalizeStaffel(item = {}) {
    return {
        ...item,
        artikelId: item.artikelId || "",
        lieferantId: item.lieferantId || "",
        mindestbestellmenge: Number(item.mindestbestellmenge || 1),
        stueckpreis: Number(item.stueckpreis || 0)
    };
}

export default {
    ...service,
    listByPair(artikelId, lieferantId) {
        return service.list()
            .filter(item => String(item.artikelId) === String(artikelId) && String(item.lieferantId) === String(lieferantId))
            .map(normalizeStaffel)
            .sort((a, b) => Number(a.mindestbestellmenge || 0) - Number(b.mindestbestellmenge || 0));
    },
    replaceForPair(artikelId, lieferantId, staffeln = []) {
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
    listGrouped(artikelListe = [], lieferantenListe = []) {
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
                    .map(item => `ab ${Number(item.mindestbestellmenge || 0)} Stk: ${Number(item.stueckpreis || 0).toFixed(2)} EUR`)
                    .join(" | ")
            }))
            .sort((a, b) => `${a.artikelNr}${a.lieferant}`.localeCompare(`${b.artikelNr}${b.lieferant}`));
    }
};
