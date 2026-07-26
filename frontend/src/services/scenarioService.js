import angeboteService, { naechsteAngebotsnummer } from "./angeboteService";
import auftraegeService from "./auftraegeService";
import belegeService from "./belegeService";
import customerInquiryService from "./customerInquiryService";
import freigabenService from "./freigabenService";
import kundenService from "./customerService";
import marketingService from "./marketingService";
import reklamationenService, { naechsteReklamationsnummer } from "./reklamationenService";

const today = () => new Date().toISOString().slice(0, 10);
const nextOrderNumber = () => `VK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

function findOrCreateCustomer(name) {
    const existing = kundenService.list().find(item => item.firma.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    return kundenService.create({
        kundenNr: `DB${String(Date.now()).slice(-5)}`,
        firma: name,
        anschrift: "",
        plz: "",
        ort: "",
        segment: "Neukunde",
        website: "",
        optionen: [],
        notiz: "Automatisch aus einem Verkaufsszenario angelegt.",
        aktiv: true
    });
}

function createOrder({ kunde, positionen, status = "offen", notiz = "" }) {
    return auftraegeService.create({
        auftragNr: nextOrderNumber(),
        kundeId: kunde.id,
        kunde: kunde.firma,
        datum: today(),
        status,
        positionen,
        notiz
    });
}

export function createRegionalOrder({ kunde, produkt, menge, liefertermin, transport }) {
    const customer = findOrCreateCustomer(kunde.trim());
    const order = createOrder({
        kunde: customer,
        positionen: [{ artikelId: 0, artikel: produkt.trim(), menge: Number(menge) }],
        notiz: `Liefertermin: ${liefertermin}. Transport: ${transport}.`
    });
    return { message: `Regionaler Auftrag ${order.auftragNr} für ${customer.firma} wurde angelegt.` };
}

export function createBulkOrder({ kunde, produkt, menge, zubehoer, rabatt }) {
    const customer = findOrCreateCustomer(kunde.trim());
    const angebot = angeboteService.create({
        angebotsNr: naechsteAngebotsnummer(),
        kundeId: customer.id,
        kunde: customer.firma,
        datum: today(),
        status: "offen",
        positionen: [
            { artikelId: 0, artikel: produkt.trim(), menge: Number(menge), einzelpreis: 1000 - Number(rabatt || 0) },
            { artikelId: 0, artikel: zubehoer.trim() || "Zubehörpaket", menge: 1, einzelpreis: 250 }
        ],
        notiz: `Großbestellung mit Mengenrabatt ${rabatt} %.`
    });
    return { message: `Angebot ${angebot.angebotsNr} für eine Großbestellung wurde angelegt.` };
}

export function createFleetOrder({ kunde, flotte, wartung, status }) {
    const customer = findOrCreateCustomer(kunde.trim());
    const order = createOrder({
        kunde: customer,
        positionen: [{ artikelId: 0, artikel: "Flottenauftrag", menge: Number(flotte) }],
        status: status || "offen",
        notiz: `Wartung: ${wartung}.`
    });
    return { message: `Firmenauftrag ${order.auftragNr} mit Wartungspaket wurde gespeichert.` };
}

export function createEventOrder({ kunde, eventname, menge, koordinierung }) {
    const customer = findOrCreateCustomer(kunde.trim());
    const order = createOrder({
        kunde: customer,
        positionen: [{ artikelId: 0, artikel: `Eventpaket ${eventname.trim()}`, menge: Number(menge) }],
        notiz: `Koordination: ${koordinierung}.`
    });
    belegeService.create({ typ: "Eventbriefing", bezug: order.auftragNr, datum: today(), status: "archiviert", beschreibung: `Briefing für ${eventname.trim()}` });
    return { message: `Eventauftrag ${order.auftragNr} und das passende Briefing wurden erstellt.` };
}

export function createServiceCase({ kunde, problem, wartung }) {
    const customer = findOrCreateCustomer(kunde.trim());
    const complaint = reklamationenService.create({
        reklamationsNr: naechsteReklamationsnummer(),
        kundeId: customer.id,
        kunde: customer.firma,
        datum: today(),
        beschreibung: `${problem}. Wartung: ${wartung}.`,
        status: "Ersatzlieferung geplant"
    });
    return { message: `Servicefall ${complaint.reklamationsNr} wurde erfasst und als Ersatzlieferung geplant markiert.` };
}

export function createDelayCase({ kunde, auftrag, info, alternative }) {
    const customer = findOrCreateCustomer(kunde.trim());
    customerInquiryService.create({
        typ: "Transportverzögerung",
        kundeId: customer.id,
        kunde: customer.firma,
        kanal: "E-Mail",
        status: "erledigt",
        datum: today(),
        anliegen: `Auftrag ${auftrag}: ${info}. Alternative: ${alternative}.`
    });
    return { message: `Die Transportverzögerung zu ${auftrag} wurde dokumentiert und der Kunde informiert.` };
}

export function createCooperationCase({ partner, aktion, angebot }) {
    marketingService.create({
        typ: "Kundenaktion",
        titel: `Kooperation mit ${partner}`,
        datum: today(),
        status: "geplant",
        beschreibung: `${aktion}. Gemeinsames Angebot: ${angebot}.`
    });
    freigabenService.create({
        titel: `Freigabe Kooperation ${partner}`,
        bereich: "marketing",
        status: "offen",
        verantwortung: "Geschäftsführung",
        datum: today()
    });
    return { message: `Kooperation mit ${partner} wurde als Marketingaktion und Freigabe angelegt.` };
}
