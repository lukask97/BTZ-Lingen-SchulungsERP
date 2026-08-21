import { addDaysToIsoDate, getBerlinDate } from "../../utils/dateTime";
import { getOfferDemandByArtikel } from "../../utils/offerDemand";

const heute = getBerlinDate();
export const MWST_RATE = 0.19;
export const STATUS_FILTER_OPTIONS = [
    { value: "in vorbereitung", label: "In Vorbereitung", defaultSelected: true },
    { value: "wartet auf antwort", label: "Wartet auf Antwort", defaultSelected: true },
    { value: "angenommen", label: "Angenommen", defaultSelected: true },
    { value: "abgelehnt", label: "Abgelehnt", defaultSelected: true },
    { value: "beendet", label: "Beendet", defaultSelected: true }
];
export const STATUS_HELP = [
    { label: "In Vorbereitung", text: "Das Angebot wird intern vorbereitet und zaehlt noch nicht zu den offenen Angeboten beim Kunden." },
    { label: "Wartet auf Antwort", text: "Das Angebot liegt dem Kunden vor und wartet auf Rueckmeldung." },
    { label: "Angenommen", text: "Der Kunde hat das Angebot akzeptiert." },
    { label: "Abgelehnt", text: "Der Kunde hat das Angebot nicht angenommen." },
    { label: "Beendet", text: "Das Angebot ist abgeschlossen und fuer die weitere Bearbeitung nicht mehr aktiv." }
];

const AKTIVE_AUFTRAGSSTATUS = ["offen", "abgerechnet"];

export const calculatePositionenTotal = (positionen = []) => {
    return (positionen || []).reduce((summe, position) => {
        const menge = Number(position.menge);
        const einzelpreis = Number(position.einzelpreis);
        return summe + (Number.isFinite(menge) ? menge : 0) * (Number.isFinite(einzelpreis) ? einzelpreis : 0);
    }, 0);
};

export const calculatePreispositionenTotal = (positionen = [], preispositionen = []) => {
    const positionsTotal = calculatePositionenTotal(positionen);
    return (preispositionen || []).reduce((summe, preisposition) => {
        const rawWert = preisposition.wert;
        const wert = Number(rawWert);
        const numericWert = Number.isFinite(wert) ? wert : 0;
        if (preisposition.typ === "percent") {
            return summe + (positionsTotal * numericWert) / 100;
        }
        return summe + numericWert;
    }, 0);
};

export const calculateNetto = (positionen, preispositionen = [], rabattBetrag = 0) => {
    const positionsTotal = calculatePositionenTotal(positionen);
    const adjustmentTotal = calculatePreispositionenTotal(positionen, preispositionen);
    const rabatt = Number(rabattBetrag);
    return Math.max(0, positionsTotal + adjustmentTotal - (Number.isFinite(rabatt) ? rabatt : 0));
};

export const calculateMwSt = (positionen, preispositionen = [], rabattBetrag = 0) => {
    return Math.max(0, calculateNetto(positionen, preispositionen, rabattBetrag) * MWST_RATE);
};

export const gesamtNachAbzug = (positionen, preispositionen = [], rabattBetrag = 0) => {
    return Math.max(0, calculateNetto(positionen, preispositionen, rabattBetrag) + calculateMwSt(positionen, preispositionen, rabattBetrag));
};

export const istOffenesAngebot = angebot => ["wartet auf antwort"].includes(String(angebot.status || "").toLowerCase());

export function hatUnvollstaendigeKundenadresse(kunde) {
    if (!kunde) return false;
    return !String(kunde.anschrift || "").trim() || !String(kunde.plz || "").trim() || !String(kunde.ort || "").trim();
}

export const plusTage = tage => addDaysToIsoDate(heute, tage);

export const toLeistung = (item, typ) => ({
    id: item.id,
    leistungTyp: typ,
    nummer: typ === "Service" ? item.serviceNr : item.artikelNr,
    name: item.name,
    preis: Number(item.verkaufspreis || item.preis || 0),
    artikelTyp: typ === "Service" ? "Dienstleistung" : item.artikelTyp,
    berechnungstyp: typ === "Service" ? String(item.berechnungstyp || "Pauschal") : "",
    zeEinheit: typ === "Service" ? String(item.zeEinheit || "") : "",
    individualisierungen: item.individualisierungen || []
});

export function normalizeText(value = "") {
    return String(value || "").toLowerCase();
}

export function getDialogMessageVariant(nachricht) {
    const rolle = String(nachricht.senderRolle || "").toLowerCase();
    const betreff = String(nachricht.betreff || "").toLowerCase();
    const typ = String(nachricht.typ || "").toLowerCase();
    const text = String(nachricht.nachricht || "").toLowerCase();

    if (rolle.includes("kunde")) return "customer";
    if (typ.includes("intern") || betreff.includes("intern") || text.includes("wurde intern")) return "internal";
    if (
        typ === "angebot"
        || typ === "antwort"
        || betreff.startsWith("angebot ")
        || betreff.includes("an kunden")
        || betreff.includes("antwort der schuelerfirma")
    ) return "outbound";
    if (rolle.includes("verkauf") || rolle.includes("lehrkraft") || rolle.includes("geschaeftsfuehrung")) return "internal";
    return "internal";
}

export function getDialogMessageLabel(nachricht) {
    const variant = getDialogMessageVariant(nachricht);
    if (variant === "customer") return "Vom Kunden";
    if (variant === "outbound") return "Zum Kunden";
    return "Intern";
}

export function getVerplanteMengen(auftraege) {
    return auftraege
        .filter(auftrag => AKTIVE_AUFTRAGSSTATUS.includes(String(auftrag.status || "").toLowerCase()))
        .reduce((map, auftrag) => {
            (auftrag.positionen || [])
                .filter(position => position.leistungTyp !== "Service" && position.artikelId)
                .forEach(position => {
                    const key = String(position.artikelId);
                    map[key] = Number(map[key] || 0) + Number(position.menge || 0);
                });
            return map;
        }, {});
}

export function getAndereOffeneAngeboteMitArtikel(angebote, artikelId, currentPositionen = []) {
    const currentArtikelIds = new Set(
        currentPositionen
            .filter(position => String(position.leistungTyp || "").toLowerCase() !== "service")
            .map(position => String(position.artikelId || ""))
    );
    const targetArtikelId = String(artikelId || "");

    if (!targetArtikelId || !currentArtikelIds.has(targetArtikelId)) {
        return [];
    }

    return angebote
        .filter(angebot => istOffenesAngebot(angebot))
        .filter(angebot => (angebot.positionen || []).some(position =>
            String(position.leistungTyp || "").toLowerCase() !== "service"
            && String(position.artikelId || "") === targetArtikelId
        ))
        .map(angebot => angebot.angebotsNr)
        .filter(Boolean);
}

export function getOpenOfferCountByArtikel(angebote = [], artikel = []) {
    return getOfferDemandByArtikel(angebote, artikel, istOffenesAngebot);
}

export function getDefaultStatusFilter() {
    return STATUS_FILTER_OPTIONS.filter(option => option.defaultSelected).map(option => option.value);
}

export function createAngebotDraft(defaultLeistungId, defaultBearbeiter, brauchtFreigabe) {
    return {
        sourceInquiryId: "",
        kundeId: "",
        leistungId: defaultLeistungId,
        menge: 1,
        positionenDraft: [],
        gueltigBis: plusTage(14),
        rabattBetrag: 0,
        verguenstigungsGrund: "",
        preispositionenDraft: [],
        fehler: "",
        angebotsNrDraft: "",
        bearbeiter: defaultBearbeiter,
        selectedTemplateOfferId: "",
        direktSenden: brauchtFreigabe,
        freigabeDurchGf: false
    };
}

export function createAngebotPositionDraft(auswahl, menge) {
    const initialOptions = {};
    if (auswahl.artikelTyp === "Baugruppe" && auswahl.individualisierungen) {
        const groups = [...new Set(auswahl.individualisierungen.map(i => i.kategorieId))];
        groups.forEach(g => {
            const std = auswahl.individualisierungen.find(i => i.kategorieId === g && i.standard);
            if (std) {
                initialOptions[g] = std.individualArtikelId;
            }
        });
    }

    return {
        rowId: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        artikelId: auswahl.id,
        artikel: auswahl.name,
        artikelTyp: auswahl.artikelTyp,
        leistungTyp: auswahl.leistungTyp,
        serviceId: auswahl.leistungTyp === "Service" ? auswahl.id : "",
        menge: Number(menge),
        einzelpreis: auswahl.preis,
        berechnungstyp: auswahl.berechnungstyp || "",
        zeEinheit: auswahl.zeEinheit || "",
        selectedOptionen: initialOptions
    };
}

export function createPreispositionDraft() {
    return {
        id: `preis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        beschreibung: "",
        typ: "amount",
        wert: ""
    };
}

export function normalizeVorlagenPosition(position, leistungen = []) {
    const artikelId = position.artikelId || position.serviceId || position.id || "";
    const auswahl = leistungen.find(item =>
        String(item.id) === String(artikelId)
        || String(item.name) === String(position.artikel || position.name || "")
    );

    if (auswahl) {
        const draft = createAngebotPositionDraft(auswahl, Number(position.menge || 1));
        return {
            ...draft,
            rowId: position.rowId || draft.rowId,
            selectedOptionen: position.selectedOptionen || draft.selectedOptionen,
            isOptionForId: position.isOptionForId,
            optionKategorieId: position.optionKategorieId,
            einzelpreis: Number(position.einzelpreis || auswahl.preis || 0)
        };
    }

    return {
        rowId: position.rowId || `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        artikelId: artikelId || "",
        artikel: position.artikel || position.name || "Unbekannte Position",
        artikelTyp: position.artikelTyp || "Einzelartikel",
        leistungTyp: position.leistungTyp || "Artikel",
        serviceId: position.serviceId || "",
        menge: Number(position.menge || 1),
        einzelpreis: Number(position.einzelpreis || 0),
        berechnungstyp: position.berechnungstyp || "",
        zeEinheit: position.zeEinheit || "",
        selectedOptionen: position.selectedOptionen || {},
        isOptionForId: position.isOptionForId,
        optionKategorieId: position.optionKategorieId
    };
}

export function cloneAngebotspositionen(positionen = [], leistungen = []) {
    return positionen.map(position => normalizeVorlagenPosition(position, leistungen));
}

export function getOptionGroups(individualisierungen = []) {
    return [...new Set((individualisierungen || []).map(item => item.kategorieId))];
}

export function calculateOptionAufpreisProEinheit(position, leistung) {
    if (!leistung?.individualisierungen?.length) return 0;
    return getOptionGroups(leistung.individualisierungen).reduce((summe, groupId) => {
        const gruppenOptionen = leistung.individualisierungen.filter(item => item.kategorieId === groupId);
        const defaultOpt = gruppenOptionen.find(item => item.standard) || gruppenOptionen[0];
        const aktuelleOptionId = Number(position.selectedOptionen?.[groupId] || defaultOpt?.individualArtikelId || 0);
        const individuelleAuswahl = gruppenOptionen.find(item => Number(item.individualArtikelId) === aktuelleOptionId);
        return summe + Number(individuelleAuswahl?.preisaenderung || 0) * Number(individuelleAuswahl?.anzahl || 0);
    }, 0);
}

export function hasIndividualisierungen(leistung) {
    return Boolean(leistung && Array.isArray(leistung.individualisierungen) && leistung.individualisierungen.length > 0);
}

export function getAktuellenAngebotsbedarf(positionen = [], leistungen = []) {
    return (positionen || []).reduce((map, position) => {
        if (position.leistungTyp === "Service" || !position.artikelId || position.isOptionForId) {
            return map;
        }

        const key = String(position.artikelId);
        map[key] = Number(map[key] || 0) + Number(position.menge || 0);

        const leistung = leistungen.find(item =>
            String(item.id) === String(position.serviceId || position.artikelId || "")
            && String(item.leistungTyp || "") === String(position.leistungTyp || "")
        );

        if (!leistung?.individualisierungen?.length) {
            return map;
        }

        getOptionGroups(leistung.individualisierungen).forEach(groupId => {
            const gruppenOptionen = leistung.individualisierungen.filter(item => item.kategorieId === groupId);
            const defaultOpt = gruppenOptionen.find(item => item.standard) || gruppenOptionen[0];
            const aktuelleOptionId = Number(position.selectedOptionen?.[groupId] || defaultOpt?.individualArtikelId || 0);
            const individuelleAuswahl = gruppenOptionen.find(item => Number(item.individualArtikelId) === aktuelleOptionId);
            if (!individuelleAuswahl?.individualArtikelId) {
                return;
            }

            const optionKey = String(individuelleAuswahl.individualArtikelId);
            map[optionKey] = Number(map[optionKey] || 0) + (Number(position.menge || 0) * Number(individuelleAuswahl.anzahl || 0));
        });

        return map;
    }, {});
}

export function createOptionRow(parentPosition, optionArtikel, individualisierung, kategorieId) {
    return {
        ...createAngebotPositionDraft({ ...optionArtikel, leistungTyp: "Artikel" }, Number(parentPosition.menge || 0) * Number(individualisierung.anzahl || 0)),
        rowId: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        einzelpreis: Number(individualisierung.preisaenderung || 0),
        isOptionForId: parentPosition.rowId,
        optionKategorieId: kategorieId,
        artikel: `${optionArtikel.name} (Option fuer ${parentPosition.artikel})`
    };
}

export function syncOptionRows(positionen, parentPosition, leistung, artikel) {
    const optionenOhneKinder = positionen.filter(item => item.rowId === parentPosition.rowId || item.isOptionForId !== parentPosition.rowId);
    const parentIndex = optionenOhneKinder.findIndex(item => item.rowId === parentPosition.rowId);
    if (parentIndex === -1 || !leistung?.individualisierungen?.length) {
        return optionenOhneKinder;
    }

    const neueOptionRows = [];
    const gruppenIds = [...new Set(leistung.individualisierungen.map(item => item.kategorieId))];

    gruppenIds.forEach(groupId => {
        const gruppenOptionen = leistung.individualisierungen.filter(item => item.kategorieId === groupId);
        const defaultOpt = gruppenOptionen.find(item => item.standard) || gruppenOptionen[0];
        const aktuelleOptionId = Number(parentPosition.selectedOptionen?.[groupId] || defaultOpt?.individualArtikelId || 0);
        const individuelleAuswahl = gruppenOptionen.find(item => Number(item.individualArtikelId) === aktuelleOptionId);
        if (!individuelleAuswahl || individuelleAuswahl.standard) {
            return;
        }

        const optionArtikel = artikel.find(item => String(item.id) === String(individuelleAuswahl.individualArtikelId));
        if (!optionArtikel) {
            return;
        }

        neueOptionRows.push(createOptionRow(parentPosition, optionArtikel, individuelleAuswahl, groupId));
    });

    optionenOhneKinder.splice(parentIndex + 1, 0, ...neueOptionRows);
    return optionenOhneKinder;
}
