function getOptionGroups(individualisierungen: any[] = []) {
    return Array.from(new Set((individualisierungen || []).map(item => String(item.kategorieId)))) as string[];
}

function addDemand(map: Record<string, number>, artikelId: any, menge: any) {
    if (!artikelId) return;
    const key = String(artikelId);
    map[key] = Number(map[key] || 0) + Number(menge || 0);
}

export function getOfferDemandByArtikel(
    angebote: any[] = [],
    artikelListe: any[] = [],
    isOfferOpen: (angebot: any) => boolean = () => true
) {
    return (angebote || [])
        .filter(angebot => isOfferOpen(angebot))
        .reduce((map: Record<string, number>, angebot) => {
            (angebot.positionen || []).forEach((position: any) => {
                if (String(position.leistungTyp || "").toLowerCase() === "service" || !position.artikelId || position.isOptionForId) {
                    return;
                }

                addDemand(map, position.artikelId, position.menge);

                const artikelEintrag = (artikelListe || []).find((item: any) => String(item.id) === String(position.artikelId));
                if (!artikelEintrag?.individualisierungen?.length) {
                    return;
                }

                getOptionGroups(artikelEintrag.individualisierungen).forEach(groupId => {
                    const gruppenOptionen = artikelEintrag.individualisierungen.filter((item: any) => String(item.kategorieId) === String(groupId));
                    const defaultOpt = gruppenOptionen.find((item: any) => item.standard) || gruppenOptionen[0];
                    const aktuelleOptionId = Number(position.selectedOptionen?.[String(groupId)] || defaultOpt?.individualArtikelId || 0);
                    const individuelleAuswahl = gruppenOptionen.find((item: any) => Number(item.individualArtikelId) === aktuelleOptionId);
                    if (!individuelleAuswahl?.individualArtikelId) {
                        return;
                    }

                    addDemand(
                        map,
                        individuelleAuswahl.individualArtikelId,
                        Number(position.menge || 0) * Number(individuelleAuswahl.anzahl || 0)
                    );
                });
            });

            return map;
        }, {});
}
