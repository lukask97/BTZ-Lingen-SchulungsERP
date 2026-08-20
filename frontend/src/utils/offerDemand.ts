function getOptionGroups(individualisierungen = []) {
    return [...new Set((individualisierungen || []).map(item => item.kategorieId))];
}

function addDemand(map, artikelId, menge) {
    if (!artikelId) return;
    const key = String(artikelId);
    map[key] = Number(map[key] || 0) + Number(menge || 0);
}

export function getOfferDemandByArtikel(angebote = [], artikelListe = [], isOfferOpen = () => true) {
    return (angebote || [])
        .filter(angebot => isOfferOpen(angebot))
        .reduce((map, angebot) => {
            (angebot.positionen || []).forEach(position => {
                if (String(position.leistungTyp || "").toLowerCase() === "service" || !position.artikelId || position.isOptionForId) {
                    return;
                }

                addDemand(map, position.artikelId, position.menge);

                const artikelEintrag = (artikelListe || []).find(item => String(item.id) === String(position.artikelId));
                if (!artikelEintrag?.individualisierungen?.length) {
                    return;
                }

                getOptionGroups(artikelEintrag.individualisierungen).forEach(groupId => {
                    const gruppenOptionen = artikelEintrag.individualisierungen.filter(item => item.kategorieId === groupId);
                    const defaultOpt = gruppenOptionen.find(item => item.standard) || gruppenOptionen[0];
                    const aktuelleOptionId = Number(position.selectedOptionen?.[groupId] || defaultOpt?.individualArtikelId || 0);
                    const individuelleAuswahl = gruppenOptionen.find(item => Number(item.individualArtikelId) === aktuelleOptionId);
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
