import { getBerlinDate } from "../../utils/dateTime";
import { getDefaultNummernkreise, type NummernkreisSchluessel } from "../verwaltung/nummernkreiseService";

const LEGACY_PREFIXES: Record<NummernkreisSchluessel, string[]> = {
    artikel: ["ART"],
    service: ["SER"],
    angebot: ["ANG"],
    auftrag: ["AU", "VK"],
    rechnung: ["RG", "RE"],
    lieferschein: ["LS"],
    bestellung: ["EK"],
    gutschrift: ["GS"],
    mahnung: ["MH"],
    zahlung: ["ZA"]
};

function getYearFromDate(dateValue?: string) {
    const source = dateValue || getBerlinDate();
    return Number(String(source).slice(0, 4)) || new Date().getFullYear();
}

function padSequence(sequence: number) {
    return String(sequence).padStart(3, "0");
}

export function getNumberPrefix(schluessel: NummernkreisSchluessel) {
    return getDefaultNummernkreise().find(item => item.schluessel === schluessel)?.kuerzel || LEGACY_PREFIXES[schluessel][0];
}

function getAcceptedPrefixes(schluessel: NummernkreisSchluessel) {
    return Array.from(new Set([getNumberPrefix(schluessel), ...LEGACY_PREFIXES[schluessel]]));
}

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPattern(prefixes: string[], includeRevision = false) {
    const prefixGroup = prefixes.map(escapeRegex).join("|");
    return new RegExp(`^(?:${prefixGroup})-(\\d{4})-(\\d+)${
        includeRevision ? "(?:\\.(\\d+))?" : ""
    }$`, "i");
}

function parseNumber(value: string, schluessel: NummernkreisSchluessel, includeRevision = false) {
    const match = String(value || "").trim().match(buildPattern(getAcceptedPrefixes(schluessel), includeRevision));
    if (!match) return null;

    return {
        year: Number(match[1]),
        sequence: Number(match[2]),
        revision: includeRevision ? Number(match[3] || 0) : 0
    };
}

function getMaxSequence(values: Array<string | undefined>, schluessel: NummernkreisSchluessel, year: number) {
    return values.reduce((maxValue, currentValue) => {
        const parsed = parseNumber(String(currentValue || ""), schluessel, schluessel === "angebot");
        if (!parsed || parsed.year !== year) return maxValue;
        return Math.max(maxValue, parsed.sequence);
    }, 0);
}

export function formatDocumentNumber(schluessel: NummernkreisSchluessel, sequence: number, dateValue?: string) {
    return `${getNumberPrefix(schluessel)}-${getYearFromDate(dateValue)}-${padSequence(sequence)}`;
}

export function formatMasterDataNumber(schluessel: "artikel" | "service", sequence: number) {
    return `${getNumberPrefix(schluessel)}${padSequence(sequence)}`;
}

export function formatOfferNumber(angebotsBasisNr: string, revision: number) {
    return `${angebotsBasisNr}.${Number(revision || 0)}`;
}

export function naechsteAuftragsnummer(auftraege: any[] = [], dateValue?: string) {
    const year = getYearFromDate(dateValue);
    const sequence = getMaxSequence(auftraege.map(item => item?.auftragNr), "auftrag", year) + 1;
    return formatDocumentNumber("auftrag", sequence, dateValue);
}

export function naechsteAngebotsrevision(angebote: any[] = [], vorgangId: string, dateValue?: string) {
    const eintraege = angebote.filter(item => item.vorgangId === vorgangId);
    if (eintraege.length === 0) {
        const year = getYearFromDate(dateValue);
        const sequence = getMaxSequence(angebote.map(item => item?.angebotsBasisNr || item?.angebotsNr), "angebot", year) + 1;
        const angebotsBasisNr = formatDocumentNumber("angebot", sequence, dateValue);
        return {
            angebotsBasisNr,
            revision: 0,
            angebotsNr: formatOfferNumber(angebotsBasisNr, 0)
        };
    }

    const basis = String(eintraege[0].angebotsBasisNr || "").split(".")[0];
    const revision = Math.max(...eintraege.map(item => Number(item.revision || parseNumber(String(item.angebotsNr || ""), "angebot", true)?.revision || 0))) + 1;

    return {
        angebotsBasisNr: basis,
        revision,
        angebotsNr: formatOfferNumber(basis, revision)
    };
}

export function getRechnungsnummer(auftragNr: string, dateValue?: string) {
    const parsed = parseNumber(String(auftragNr || ""), "auftrag");
    if (parsed) {
        return `${getNumberPrefix("rechnung")}-${parsed.year}-${padSequence(parsed.sequence)}`;
    }

    return formatDocumentNumber("rechnung", 1, dateValue);
}

export function getLieferscheinnummer(auftragNr: string, dateValue?: string) {
    const parsed = parseNumber(String(auftragNr || ""), "auftrag");
    if (parsed) {
        return `${getNumberPrefix("lieferschein")}-${parsed.year}-${padSequence(parsed.sequence)}`;
    }

    return formatDocumentNumber("lieferschein", 1, dateValue);
}

export function naechsteStammdatennummer(values: Array<string | undefined>, schluessel: "artikel" | "service") {
    const prefixes = getAcceptedPrefixes(schluessel);
    const prefixGroup = prefixes.map(escapeRegex).join("|");
    const pattern = new RegExp(`^(?:${prefixGroup})(\\d+)$`, "i");
    const maxSequence = values.reduce((maxValue, currentValue) => {
        const match = String(currentValue || "").trim().match(pattern);
        if (!match) return maxValue;
        return Math.max(maxValue, Number(match[1] || 0));
    }, 0);

    return formatMasterDataNumber(schluessel, maxSequence + 1);
}
