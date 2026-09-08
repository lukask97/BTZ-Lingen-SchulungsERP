import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Fragment, useEffect, useMemo, useState } from "react";
import useAuth from "../../auth/useAuth";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import OfferApprovalDialog from "../../components/OfferApprovalDialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import SaveButton from "../../components/SaveButton";
import Checkbox from "../../components/form/Checkbox";
import SalesFlowBar from "../../components/SalesFlowBar";
import MultiStatusFilter from "./MultiStatusFilter";
import angeboteService, { naechsteAngebotsrevision } from "../../services/verkauf/angeboteService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import kundenService from "../../services/verkauf/customerService";
import benutzerService from "../../services/verwaltung/benutzerService";
import artikelService from "../../services/logistik/artikelService";
import servicesService from "../../services/verkauf/servicesService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import versandService from "../../services/logistik/versandService";
import { getOffeneBestellmengenProArtikel } from "../../services/einkauf/bestellungenService";
import { getCustomerName } from "../../utils/customerReferences";
import nachrichtenService, { listNachrichtenZuVorgang } from "../../services/verkauf/nachrichtenService";
import { formatTimestampForDisplay, getBerlinDate, getBerlinTimestamp } from "../../utils/dateTime";
import { getInquiryForOffer, getOffersForVorgang, getSalesStep, getSalesStepLabel, getVorgangId } from "../../utils/processFlow";
import { openDocumentPdf } from "../../utils/documentPdf";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";
import { ACCESS, PERMISSIONS } from "../../constants/permissions";
import freigabenService from "../../services/gf/freigabenService";
import fristenOptionenService from "../../services/verwaltung/fristenOptionenService";
import tagesversandService from "../../services/verkauf/tagesversandService";
import { getUserDisplayNameWithRole } from "../../utils/userDisplay";
import { getKategoriePfad } from "../../services/logistik/kategorienService";
import {
    calculateMwSt,
    calculateNetto,
    calculatePositionenTotal,
    gesamtNachAbzug,
    getOpenOfferCountByArtikel as getOpenOfferCountByArtikelForArtikel,
    hatUnvollstaendigeKundenadresse,
    istOffenesAngebot,
    plusTage,
    MWST_RATE
} from "./angeboteHelpers";

const heute = getBerlinDate();

const STATUS_FILTER_OPTIONS = [
    { value: "in vorbereitung", label: "In Vorbereitung", defaultSelected: true },
    { value: "wartet auf antwort", label: "Wartet auf Antwort", defaultSelected: true },
    { value: "wiedervorlage", label: "Wiedervorlage", defaultSelected: true },
    { value: "angenommen", label: "Angenommen", defaultSelected: true },
    { value: "abgelehnt", label: "Abgelehnt", defaultSelected: true },
    { value: "beendet", label: "Beendet", defaultSelected: true }
];
const STATUS_HELP = [
    { label: "In Vorbereitung", text: "Das Angebot wird intern vorbereitet und zählt noch nicht zu den offenen Angeboten beim Kunden." },
    { label: "Wartet auf Antwort", text: "Das Angebot liegt dem Kunden vor und wartet auf Rückmeldung." },
    { label: "Wiedervorlage", text: "Das Angebot soll zu einem festgelegten Prüfdatum erneut vorgelegt werden." },
    { label: "Angenommen", text: "Der Kunde hat das Angebot akzeptiert." },
    { label: "Abgelehnt", text: "Der Kunde hat das Angebot nicht angenommen." },
    { label: "Beendet", text: "Das Angebot ist abgeschlossen und für die weitere Bearbeitung nicht mehr aktiv." }
];
const AKTIVE_AUFTRAGSSTATUS = ["offen", "abgerechnet"];
const toLeistung = (item, typ) => ({
    id: item.id,
    leistungTyp: typ,
    nummer: typ === "Service" ? item.serviceNr : item.artikelNr,
    name: item.name,
    preis: Number(item.verkaufspreis || item.preis || 0),
    artikelTyp: typ === "Service" ? "Dienstleistung" : item.artikelTyp,
    berechnungstyp: typ === "Service" ? String(item.berechnungstyp || "Pauschal") : "",
    zeEinheit: typ === "Service" ? String(item.zeEinheit || "") : "",
    kategorie: typ === "Service" ? String(item.kategorie || "") : "",
    individualisierungen: item.individualisierungen || []
});

const istVertragsService = service => String(service?.kategorie || "").toLowerCase() === "vertrag";

function normalizeText(value = "") {
    return String(value || "").toLowerCase();
}

function getDialogMessageVariant(nachricht) {
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
        || betreff.includes("antwort der schülerfirma")
    ) return "outbound";
    if (rolle.includes("verkauf") || rolle.includes("lehrkraft") || rolle.includes("geschaeftsfuehrung")) return "internal";
    return "internal";
}

function getDialogMessageLabel(nachricht) {
    const variant = getDialogMessageVariant(nachricht);
    if (variant === "customer") return "Vom Kunden";
    if (variant === "outbound") return "Zum Kunden";
    return "Intern";
}

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

function getVerplanteMengen(auftraege) {
    return auftraege
        .reduce((map, auftrag) => {
            (auftrag.positionen || [])
                .filter(position => position.leistungTyp !== "Service" && position.artikelId)
                .filter(position => position.istMietBaugruppe
                    ? !["beendet", "abgeschlossen"].includes(String(auftrag.status || "").toLowerCase())
                    : AKTIVE_AUFTRAGSSTATUS.includes(String(auftrag.status || "").toLowerCase())
                )
                .forEach(position => {
                    const key = String(position.artikelId);
                    map[key] = Number(map[key] || 0) + Number(position.menge || 0);
                });
            return map;
        }, {});
}

function getDefaultStatusFilter() {
    return STATUS_FILTER_OPTIONS.filter(option => option.defaultSelected).map(option => option.value);
}

function createAngebotDraft(defaultLeistungId, defaultBearbeiter, brauchtFreigabe) {
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
        alsVorbereitetSpeichern: false,
        direktSenden: brauchtFreigabe,
        freigabeDurchGf: false
    };
}

function createAngebotPositionDraft(auswahl, menge) {
    const initialOptions: Record<string, any> = {};
    if (auswahl.artikelTyp === "Baugruppe" && auswahl.individualisierungen) {
        const groups = Array.from(new Set(auswahl.individualisierungen.map(i => String(i.kategorieId)))) as string[];
        groups.forEach(g => {
            const std = auswahl.individualisierungen.find(i => String(i.kategorieId) === g && i.standard);
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
        selectedOptionen: initialOptions,
        pendingOptionen: { ...initialOptions }
    };
}

function createMietBaugruppenPosition(servicePosition, baugruppe) {
    return {
        rowId: `miete-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        artikelId: baugruppe.id,
        artikel: `${baugruppe.name} (Mietbaugruppe)`,
        artikelTyp: "Baugruppe",
        leistungTyp: "Artikel",
        serviceId: "",
        menge: Number(servicePosition.menge || 1),
        einzelpreis: 0,
        selectedOptionen: {},
        istMietBaugruppe: true,
        mietvertragServiceRowId: servicePosition.rowId
    };
}

function createPreispositionDraft() {
    return {
        id: `preis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        beschreibung: "",
        typ: "amount",
        wert: ""
    };
}

function normalizeVorlagenPosition(position, leistungen = []) {
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
            pendingOptionen: position.selectedOptionen || draft.selectedOptionen,
            isOptionForId: position.isOptionForId,
            optionKategorieId: position.optionKategorieId,
            einzelpreis: Number(position.einzelpreis || auswahl.preis || 0),
            vertragsStart: position.vertragsStart || "",
            vertragsEnde: position.vertragsEnde || "",
            mietArtikelId: position.mietArtikelId || "",
            mietArtikelName: position.mietArtikelName || "",
            istMietBaugruppe: Boolean(position.istMietBaugruppe),
            mietvertragServiceRowId: position.mietvertragServiceRowId || ""
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
        pendingOptionen: position.selectedOptionen || {},
        isOptionForId: position.isOptionForId,
        optionKategorieId: position.optionKategorieId,
        vertragsStart: position.vertragsStart || "",
        vertragsEnde: position.vertragsEnde || "",
        mietArtikelId: position.mietArtikelId || "",
        mietArtikelName: position.mietArtikelName || "",
        istMietBaugruppe: Boolean(position.istMietBaugruppe),
        mietvertragServiceRowId: position.mietvertragServiceRowId || ""
    };
}

function cloneAngebotspositionen(positionen = [], leistungen = []) {
    return positionen.map(position => normalizeVorlagenPosition(position, leistungen));
}

function getOptionGroups(individualisierungen = []) {
    return [...new Set((individualisierungen || []).map(item => item.kategorieId))];
}

function calculateOptionAufpreisProEinheit(position, leistung) {
    if (!leistung?.individualisierungen?.length) return 0;
    return getOptionGroups(leistung.individualisierungen).reduce((summe, groupId) => {
        const gruppenOptionen = leistung.individualisierungen.filter(item => item.kategorieId === groupId);
        const defaultOpt = gruppenOptionen.find(item => item.standard) || gruppenOptionen[0];
        const aktuelleOptionId = Number(position.selectedOptionen?.[groupId] || defaultOpt?.individualArtikelId || 0);
        const individuelleAuswahl = gruppenOptionen.find(item => Number(item.individualArtikelId) === aktuelleOptionId);
        return summe + Number(individuelleAuswahl?.preisaenderung || 0) * Number(individuelleAuswahl?.anzahl || 0);
    }, 0);
}

function hasIndividualisierungen(leistung) {
    return Boolean(leistung && Array.isArray(leistung.individualisierungen) && leistung.individualisierungen.length > 0);
}

function getAktuellenAngebotsbedarf(positionen = [], leistungen = []) {
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
            if (!individuelleAuswahl?.individualArtikelId || individuelleAuswahl.standard) {
                return;
            }

            const optionKey = String(individuelleAuswahl.individualArtikelId);
            map[optionKey] = Number(map[optionKey] || 0) + (Number(position.menge || 0) * Number(individuelleAuswahl.anzahl || 0));
        });

        return map;
    }, {});
}

function createOptionRow(parentPosition, optionArtikel, individualisierung, kategorieId) {
    return {
        ...createAngebotPositionDraft({ ...optionArtikel, leistungTyp: "Artikel" }, Number(parentPosition.menge || 0) * Number(individualisierung.anzahl || 0)),
        rowId: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        einzelpreis: Number(individualisierung.preisaenderung || 0),
        isOptionForId: parentPosition.rowId,
        optionKategorieId: kategorieId,
        artikel: `${optionArtikel.name} (Option für ${parentPosition.artikel})`
    };
}

function syncOptionRows(positionen, parentPosition, leistung, artikel) {
    const optionenOhneKinder = positionen.filter(item => item.rowId === parentPosition.rowId || item.isOptionForId !== parentPosition.rowId);
    const parentIndex = optionenOhneKinder.findIndex(item => item.rowId === parentPosition.rowId);
    if (parentIndex === -1 || !leistung?.individualisierungen?.length) {
        return optionenOhneKinder;
    }

    const neueOptionRows = [];
    const gruppenIds = Array.from(new Set(leistung.individualisierungen.map(item => String(item.kategorieId)))) as string[];

    gruppenIds.forEach(groupId => {
        const gruppenOptionen = leistung.individualisierungen.filter(item => String(item.kategorieId) === groupId);
        const defaultOpt = gruppenOptionen.find(item => item.standard) || gruppenOptionen[0];
        const aktuelleOptionId = Number(parentPosition.selectedOptionen?.[String(groupId)] || defaultOpt?.individualArtikelId || 0);
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

export default function Angebote() {
    const syncTick = useDataSyncRefresh([
        "angebote", "auftraege", "vertriebsdokumente", "versandauftraege",
        "kundenanfragen", "kunden", "benutzer", "artikel", "services", "nachrichten", "bestellungen", "bestellpositionen", "tagesversandprotokolle"
    ]);
    const { user, hasAccess, hasFullAccess } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState("laufend");
    const [open, setOpen] = useState(false);
    const [editingOfferId, setEditingOfferId] = useState("");
    const [approvalOpen, setApprovalOpen] = useState(false);
    const [approvalOffer, setApprovalOffer] = useState<any>(null);
    const [approvalNote, setApprovalNote] = useState("");
    const [tagesabschlussBestaetigungOpen, setTagesabschlussBestaetigungOpen] = useState(false);
    const [tagesversandProtokolle, setTagesversandProtokolle] = useState<any[]>([]);
    const [tagesversandFehler, setTagesversandFehler] = useState("");
    const [pendingEditOffer, setPendingEditOffer] = useState<any>(null);
    const [selectedStatuses, setSelectedStatuses] = useState(getDefaultStatusFilter);

    const canReadLogistik = hasAccess(ACCESS.LOGISTIK);
    const canReadBenutzer = hasAccess(ACCESS.BENUTZER);

    const angebote = useMemo(() => withPermissionFallback(() => angeboteService.getAll(), []), [refreshKey, syncTick]);
    const auftraege = useMemo(() => withPermissionFallback(() => auftraegeService.getAll(), []), [refreshKey, syncTick]);
    const vertriebsdokumente = useMemo(() => vertriebsdokumenteService.list(), [refreshKey, syncTick]);
    const versandauftraege = useMemo(() => canReadLogistik ? versandService.list() : [], [canReadLogistik, refreshKey, syncTick]);
    const anfragen = useMemo(() => withPermissionFallback(() => customerInquiryService.list(), []), [refreshKey, syncTick]);
    const kunden = useMemo(() => withPermissionFallback(() => kundenService.list(), []), [refreshKey, syncTick]);
    const benutzer = useMemo(() => canReadBenutzer ? withPermissionFallback(() => benutzerService.list(), []) : [], [canReadBenutzer, refreshKey, syncTick]);
    const artikel = useMemo(
        () => withPermissionFallback(() => artikelService.getAll(), []).filter(item => item.istVerkaeuflich),
        [refreshKey, syncTick]
    );
    const services = useMemo(() => withPermissionFallback(() => servicesService.getAll(), []), [refreshKey, syncTick]);
    const offeneBestellmengen = useMemo(() => getOffeneBestellmengenProArtikel(), [syncTick]);
    const verplanteMengen = useMemo(() => getVerplanteMengen(auftraege), [auftraege]);
    const leistungen = useMemo(() => [
        ...artikel.map(item => toLeistung(item, "Artikel")),
        ...services.map(item => toLeistung(item, "Service"))
    ], [artikel, services]);
    const offeneAngeboteJeArtikel = useMemo(
        () => getOpenOfferCountByArtikelForArtikel(angebote, artikelService.getAll()),
        [angebote]
    );
    const bearbeiterOptionen = benutzer.map(item => ({ value: String(item.username || item.id), label: getUserDisplayNameWithRole(item, String(item.username || "Team")) }));
    const leistungsOptionen = [...leistungen]
        .sort((a, b) => {
            const aKonfigurierbar = hasIndividualisierungen(a) ? 0 : 1;
            const bKonfigurierbar = hasIndividualisierungen(b) ? 0 : 1;
            if (aKonfigurierbar !== bKonfigurierbar) return aKonfigurierbar - bKonfigurierbar;
            return String(a.nummer || "").localeCompare(String(b.nummer || ""));
        })
        .map(item => ({
            value: `${item.leistungTyp}:${item.id}`,
            label: `${hasIndividualisierungen(item) ? "[Konfigurierbar] " : ""}${item.nummer} - ${item.name} (${item.preis.toFixed(2)} EUR)`
        }));
    const getIndividualisierungsLabel = (kategorieId) => getKategoriePfad(kategorieId, `Kategorie ${kategorieId}`) || `Kategorie ${kategorieId}`;
    const newMode = searchParams.get("new");
    const inquiryIdFromQuery = searchParams.get("anfrageId") || "";
    const kundeIdFromQuery = searchParams.get("kundeId") || "";
    const templateOfferIdFromQuery = searchParams.get("templateOfferId") || "";
    const editOfferIdFromQuery = searchParams.get("editOfferId") || "";
    const approveOfferIdFromQuery = searchParams.get("approveOfferId") || "";
    const defaultKundeId = String(kunden[0]?.id || "");
    const defaultLeistungId = leistungen[0] ? `${leistungen[0].leistungTyp}:${leistungen[0].id}` : "";
    const istErfahrenerVerkaeufer = useMemo(() => {
        const rolle = normalizeText(user.rolle || user.username || user.name || "");
        return Boolean(
            hasFullAccess()
            || rolle.includes("admin")
            || rolle.includes("senior")
            || rolle.includes("leitung")
            || rolle.includes("erfahren")
        );
    }, [hasFullAccess, user]);
    const brauchtFreigabe = !istErfahrenerVerkaeufer;
    const defaultBearbeiter = String(user.username || benutzer[0]?.username || benutzer[0]?.id || "");
    const [draft, setDraft] = useState(() => createAngebotDraft(defaultLeistungId, defaultBearbeiter, brauchtFreigabe));
    const aktuellerAngebotsbedarf = useMemo(() => getAktuellenAngebotsbedarf(draft.positionenDraft, leistungen), [draft.positionenDraft, leistungen]);
    const optionen = fristenOptionenService.get();
    const positionsZwischensumme = calculatePositionenTotal(draft.positionenDraft);
    const nettoGesamtImDialog = calculateNetto(draft.positionenDraft, draft.preispositionenDraft, draft.rabattBetrag);
    const abweichungZurZwischensumme =
        positionsZwischensumme > 0
             ? Math.abs(nettoGesamtImDialog - positionsZwischensumme) / positionsZwischensumme
            : 0;
    const gfFreigabeSchwelle = Number(optionen.angebotGfFreigabeAbweichungProzent || 10) / 100;

    useEffect(() => {
        let active = true;
        tagesversandService.list()
            .then(items => {
                if (active) setTagesversandProtokolle(items);
            })
            .catch(() => {
                if (active) setTagesversandProtokolle([]);
            });
        return () => {
            active = false;
        };
    }, [refreshKey, syncTick]);

    const sendeAngebotAnKunden = (angebot) => {
        if (!angebot.anfrageId) return;
        const anfrage = getInquiryForOffer(angebot, anfragen);
        if (!anfrage) return;
        const verkaufAbsenderName = getUserDisplayNameWithRole(user, String(user.username || "Schülerfirma Verkauf"));
        const text = `Wir senden Ihnen das Angebot ${angebot.angebotsNr} zur Prüfung zu.`;

        nachrichtenService.create({
            vorgangId: getVorgangId(angebot) || getVorgangId(anfrage),
            anfrageId: anfrage.id,
            angebotId: angebot.id,
            kundeId: angebot.kundeId || anfrage.kundeId || "",
            datum: heute,
            zeitpunkt: getBerlinTimestamp(),
            senderRolle: "Verkauf",
            senderName: verkaufAbsenderName,
            kanal: anfrage.kanal || "E-Mail",
            betreff: `Angebot ${angebot.angebotsNr}`,
            nachricht: text,
            typ: "Angebot"
        });

        customerInquiryService.update({
            ...anfrage,
            status: "beantwortet",
            angebotId: angebot.id,
            antwort: text,
            beantwortetAm: heute
        });
    };

    const initialisiereDialog = (anfrageId = "", kunde = "", templateOfferId = "") => {
        const inquiry = anfragen.find(item => String(item.id) === String(anfrageId)) || null;
        const vorgangId = getVorgangId(inquiry) || (anfrageId ? `anfrage-${anfrageId}` : "");
        const revisionInfo = naechsteAngebotsrevision(vorgangId || `angebot-${Date.now()}`);
        const templateOffer = templateOfferId ? angeboteService.getById(templateOfferId) : null;
        const templatePositionen = cloneAngebotspositionen(templateOffer?.positionen || [], leistungen);

        setDraft({
            sourceInquiryId: anfrageId,
            kundeId: String(kunde || inquiry?.kundeId || defaultKundeId),
            leistungId: defaultLeistungId,
            menge: 1,
            positionenDraft: templatePositionen,
            gueltigBis: templateOffer?.gueltigBis || plusTage(14),
            rabattBetrag: Number(templateOffer?.rabattBetrag || 0),
            verguenstigungsGrund: templateOffer?.verguenstigungsGrund || "",
            preispositionenDraft: templateOffer?.preispositionen || [],
            fehler: "",
            angebotsNrDraft: `${revisionInfo.angebotsBasisNr}.${revisionInfo.revision}`,
            bearbeiter: defaultBearbeiter,
            selectedTemplateOfferId: String(templateOfferId || ""),
            alsVorbereitetSpeichern: false,
            direktSenden: brauchtFreigabe,
            freigabeDurchGf: false
        });
        setOpen(true);
    };

    const angebotAlsVorlageUebernehmen = (templateOfferId: string) => {
        const templateOffer = angeboteService.getById(templateOfferId);
        if (!templateOffer) return;
        const templatePositionen = cloneAngebotspositionen(templateOffer.positionen || [], leistungen);
        const ersteVorlagenPosition = templatePositionen[0];
        const leistungId = ersteVorlagenPosition
             ? `${ersteVorlagenPosition.leistungTyp}:${ersteVorlagenPosition.serviceId || ersteVorlagenPosition.artikelId}`
            : draft.leistungId;

        setDraft(current => ({
            ...current,
            leistungId,
            positionenDraft: templatePositionen,
            gueltigBis: templateOffer.gueltigBis || current.gueltigBis,
            rabattBetrag: Number(templateOffer.rabattBetrag || 0),
            verguenstigungsGrund: templateOffer.verguenstigungsGrund || "",
            preispositionenDraft: templateOffer.preispositionen || [],
            fehler: "",
            selectedTemplateOfferId: String(templateOfferId)
        }));
    };

    const angebotBearbeiten = angebot => {
        const positionen = cloneAngebotspositionen(angebot.positionen || [], leistungen);
        const erstePosition = positionen[0];

        setEditingOfferId(String(angebot.id));
        setDraft({
            sourceInquiryId: String(angebot.anfrageId || ""),
            kundeId: String(angebot.kundeId || defaultKundeId),
            leistungId: erstePosition
                 ? `${erstePosition.leistungTyp}:${erstePosition.serviceId || erstePosition.artikelId}`
                : defaultLeistungId,
            menge: 1,
            positionenDraft: positionen,
            gueltigBis: angebot.gueltigBis || plusTage(14),
            rabattBetrag: Number(angebot.rabattBetrag || 0),
            verguenstigungsGrund: angebot.verguenstigungsGrund || "",
            preispositionenDraft: angebot.preispositionen || [],
            fehler: "",
            angebotsNrDraft: angebot.angebotsNr || "",
            bearbeiter: String(angebot.bearbeiter || defaultBearbeiter),
            selectedTemplateOfferId: "",
            alsVorbereitetSpeichern: Boolean(angebot.alsVorbereitetGespeichert),
            direktSenden: Boolean(angebot.direktSendenGewuenscht),
            freigabeDurchGf: String(angebot.freigabeStatus || "") === "weitergeleitet"
        });
        setOpen(true);
    };

    useEffect(() => {
        if (newMode !== "fromInquiry") return;
        initialisiereDialog(inquiryIdFromQuery, kundeIdFromQuery, templateOfferIdFromQuery);
    }, [newMode, inquiryIdFromQuery, kundeIdFromQuery, templateOfferIdFromQuery, defaultLeistungId, brauchtFreigabe]);

    useEffect(() => {
        if (!editOfferIdFromQuery || open || approvalOpen) return;
        const angebot = angebote.find(item => String(item.id) === String(editOfferIdFromQuery));
        if (!angebot) return;
        angebotBearbeiten(angebot);
    }, [editOfferIdFromQuery, angebote, open, approvalOpen]);

    useEffect(() => {
        if (!approveOfferIdFromQuery || approvalOpen || open) return;
        const angebot = angebote.find(item => String(item.id) === String(approveOfferIdFromQuery));
        if (!angebot) return;
        setApprovalOffer(angebot);
        setApprovalNote(String(angebot.freigabeNotiz || ""));
        setApprovalOpen(true);
    }, [approveOfferIdFromQuery, angebote, approvalOpen, open]);

    useEffect(() => {
        if (!pendingEditOffer || approvalOpen) return;
        angebotBearbeiten(pendingEditOffer);
        setPendingEditOffer(null);
    }, [approvalOpen, pendingEditOffer]);

    const schliesseFreigabeDialog = () => {
        setApprovalOpen(false);
        setApprovalOffer(null);
        setApprovalNote("");
        if (!approveOfferIdFromQuery) return;
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.delete("approveOfferId");
        const search = nextSearchParams.toString();
        navigate({ search: search ? `?${search}` : "" }, { replace: true });
    };

    const angebotColumns = [
        { field: "angebotsNr", title: "Angebotsnummer", render: row => <button type="button" className="thread-inline-link" onClick={event => {
            event.stopPropagation();
            angebotAlsPdf(row);
        }}>{row.angebotsNr}</button> },
        { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
        { field: "datum", title: "Datum" },
        { field: "gueltigBis", title: "Gültig bis", render: row => row.gueltigBis || "-" },
        { field: "status", title: "Status", helpText: "Zeigt, ob das Angebot intern vorbereitet wird, beim Kunden liegt oder bereits abgeschlossen ist." },
        { field: "freigabeText", title: "Freigabe", helpText: "Zeigt, ob für das Angebot noch eine Freigabe durch eine höhere Rolle nötig ist." },
        { field: "freigabeNotiz", title: "Notiz", helpText: "Zeigt Rückmeldungen aus der internen Prüfung oder Hinweise zur Überarbeitung." },
        { field: "anliegenText", title: "Anliegen", helpText: "Kurzbeschreibung der ursprünglichen Kundenanfrage." },
        { field: "prozess", title: "Prozess", helpText: "Ordnet das Angebot in den gesamten Verkaufsablauf ein." },
        { field: "gesamt", title: "Gesamt" },
        { field: "positionenText", title: "Positionen" }
    ];

    const neuesteAngebote = useMemo(() => {
        const gruppiert = new Map();

        angebote.forEach(angebot => {
            const key = String(angebot.anfrageId || angebot.vorgangId || angebot.id);
            const vorhanden = gruppiert.get(key);
            if (!vorhanden || Number(angebot.revision || 0) > Number(vorhanden.revision || 0)) {
                gruppiert.set(key, angebot);
            }
        });

        return Array.from(gruppiert.values())
            .map(angebot => ({
                ...angebot,
                statusNormalized: normalizeText(angebot.status),
                freigabeStatus: angebot.freigabeStatus || "keine",
                freigabeText: angebot.freigabeStatus === "angefragt"
                     ? "Freigabe offen"
                    : angebot.freigabeStatus === "weitergeleitet"
                         ? `Gesperrt: ${angebot.freigabeNotiz || "Grund siehe Notiz"}`
                    : angebot.freigabeStatus === "intern_abgelehnt"
                             ? "Überarbeitung erforderlich"
                            : angebot.freigabeStatus === "rueckgestellt"
                                 ? "Rückgestellt"
                            : angebot.freigabeStatus === "freigegeben"
                                 ? "Freigegeben"
                                : "-",
                freigabeNotiz: angebot.freigabeNotiz || "-",
                kunde: getCustomerName(angebot.kundeId, angebot.kunde),
                anliegenText: getInquiryForOffer(angebot, anfragen)?.anliegen || "-",
                positionenText: (angebot.positionen || []).map(position => `${position.artikel} (${position.menge})`).join(", "),
                gesamt: `${gesamtNachAbzug(angebot.positionen, angebot.preispositionen || [], angebot.rabattBetrag).toFixed(2)} EUR`,
                prozess: getSalesStepLabel(getSalesStep(angebot, auftraege, vertriebsdokumente, versandauftraege))
            }))
            .sort((a, b) => String(b.datum || "").localeCompare(String(a.datum || "")));
    }, [angebote, anfragen, auftraege, vertriebsdokumente, versandauftraege]);

    const angebotAlsPdf = angebot => {
        openDocumentPdf({
            title: `Angebot ${angebot.angebotsNr}`,
            subject: "Automatisch erzeugtes Angebotsdokument für den Schulungseinsatz.",
            date: angebot.datum,
            note: angebot.verguenstigungsGrund || "Kein zusätzlicher Hinweis hinterlegt.",
            referenceLabel: "Angebot",
            referenceValue: angebot.angebotsNr,
            partnerLabel: "Kunde",
            partnerValue: angebot.kunde,
            positions: angebot.positionen || [],
            preispositionen: angebot.preispositionen || [],
            deductionAmount: angebot.rabattBetrag || 0,
            deductionReason: angebot.verguenstigungsGrund || ""
        });
    };

    const anfrageImDialog = anfragen.find(item => String(item.id) === String(draft.sourceInquiryId)) || null;
    const kundeImDialog = useMemo(
        () => kunden.find(item => String(item.id) === String(draft.kundeId || anfrageImDialog?.kundeId || "")) || null,
        [anfrageImDialog, draft.kundeId, kunden]
    );
    const chatNachrichten = anfrageImDialog?.vorgangId ? listNachrichtenZuVorgang(anfrageImDialog.vorgangId) : [];
    const weiterleitungsAusschnitt = chatNachrichten;
    const bearbeiterLabel = bearbeiterOptionen.find(item => item.value === String(draft.bearbeiter))?.label || "Noch nicht zugewiesen";
    const bisherigeAngeboteImDialog = anfrageImDialog?.vorgangId
        ? getOffersForVorgang(anfrageImDialog.vorgangId, angebote)
            .sort((a, b) => Number(a.revision || 0) - Number(b.revision || 0))
        : [];

    const getMindestmengenWarnungen = (positionen = []) => {
        const bedarf = getAktuellenAngebotsbedarf(positionen, leistungen);
        return Object.entries(bedarf).map(([artikelId, menge]) => {
            const artikelEintrag: any = artikel.find((item: any) => String(item.id) === String(artikelId));
            if (!artikelEintrag) return null;
            const bestand = Number(artikelEintrag.bestand || 0);
            const verplant = Number(verplanteMengen[String(artikelId)] || 0);
            const projected = bestand - verplant - Number(menge || 0);
            return projected < Number(artikelEintrag.mindestmenge || 0)
                ? {
                    artikelId,
                    artikel: artikelEintrag.name,
                    projected,
                    sicherheitsbestand: Number(artikelEintrag.mindestmenge || 0)
                }
                : null;
        }).filter(Boolean);
    };

    const getVerfuegbarkeitFuerPosition = position => {
        if (position.leistungTyp === "Service") {
            const berechnungstyp = String(position.berechnungstyp || "Pauschal");
            const zeEinheit = String(position.zeEinheit || "").trim();
            return {
                text: berechnungstyp === "ZE" && zeEinheit
                     ? `Berechnungstyp: ${berechnungstyp} | Zeiteinheit: ${zeEinheit}`
                    : `Berechnungstyp: ${berechnungstyp}`,
                istKritisch: false,
                andereAngeboteText: ""
            };
        }

        const artikelEintrag: any = artikel.find((item: any) => String(item.id) === String(position.artikelId));
        const bestand = Number(artikelEintrag.bestand || 0);
        const verplant = Number(verplanteMengen[String(position.artikelId)] || 0);
        const verfuegbar = bestand - verplant;
        const inAngeboten = Number(offeneAngeboteJeArtikel[String(position.artikelId)] || 0);
        const imZulauf = Number(offeneBestellmengen[String(position.artikelId)] || 0);
        const gesamtbedarfImDialog = Number(aktuellerAngebotsbedarf[String(position.artikelId)] || 0);
        const projected = verfuegbar - gesamtbedarfImDialog;
        const sicherheitsbestand = Number(artikelEintrag.mindestmenge || 0);
        const unterschreitetSicherheitsbestand = projected < sicherheitsbestand;

        return {
            text: `Bestand: ${verfuegbar} | Lager-Bestand: ${bestand} | Für Aufträge reserviert: ${verplant} | Nachbestellt: ${imZulauf} | In offenen Angeboten: ${inAngeboten}${unterschreitetSicherheitsbestand ? ` | Eiserner Bestand von ${sicherheitsbestand} wird unterschritten` : ""}`,
            istKritisch: gesamtbedarfImDialog > verfuegbar || unterschreitetSicherheitsbestand
        };
    };

    const positionHinzufuegen = () => {
        const auswahl = leistungen.find(item => `${item.leistungTyp}:${item.id}` === String(draft.leistungId));
        if (!auswahl || Number(draft.menge) <= 0) return;
        setDraft(vorherige => {
            const positionSeparat = hasIndividualisierungen(auswahl) || istVertragsService(auswahl);
            const vorhanden = positionSeparat
                ? null
                : vorherige.positionenDraft.find(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp && !item.isOptionForId);
            const aktualisiertePositionen = vorhanden
                ? vorherige.positionenDraft.map(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp && !item.isOptionForId
                    ? { ...item, menge: Number(item.menge) + Number(vorherige.menge) }
                    : item)
                : [...vorherige.positionenDraft, createAngebotPositionDraft(auswahl, vorherige.menge)];
            const parentPosition = vorhanden
                ? aktualisiertePositionen.find(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp && !item.isOptionForId)
                : aktualisiertePositionen[aktualisiertePositionen.length - 1];
            return {
                ...vorherige,
                positionenDraft: parentPosition ? syncOptionRows(aktualisiertePositionen, parentPosition, auswahl, artikel) : aktualisiertePositionen
            };
        });
    };

    const handleOptionChange = (positionRowId, kategorieId, newOptionId) => {
        setDraft(current => {
            return {
                ...current,
                positionenDraft: current.positionenDraft.map(position => position.rowId === positionRowId
                    ? {
                        ...position,
                        pendingOptionen: { ...(position.pendingOptionen || position.selectedOptionen || {}), [kategorieId]: Number(newOptionId) }
                    }
                    : position)
            };
        });
    };

    const optionenUebernehmen = positionRowId => {
        setDraft(current => {
            const posList = [...current.positionenDraft];
            const parentIndex = posList.findIndex(position => position.rowId === positionRowId);
            if (parentIndex === -1) return current;

            const parentPos = {
                ...posList[parentIndex],
                selectedOptionen: { ...(posList[parentIndex].pendingOptionen || posList[parentIndex].selectedOptionen || {}) }
            };
            parentPos.pendingOptionen = { ...parentPos.selectedOptionen };
            const leistung = leistungen.find(item => item.id === parentPos.artikelId && item.leistungTyp === parentPos.leistungTyp);
            posList[parentIndex] = parentPos;
            return { ...current, positionenDraft: syncOptionRows(posList, parentPos, leistung, artikel) };
        });
    };

    const handleMietBaugruppeChange = (serviceRowId, artikelId) => {
        const baugruppe = artikel.find(item => String(item.id) === String(artikelId));
        if (!baugruppe) return;
        setDraft(current => {
            const servicePosition = current.positionenDraft.find(item => item.rowId === serviceRowId);
            if (!servicePosition) return current;
            const aktualisierterService = { ...servicePosition, mietArtikelId: baugruppe.id, mietArtikelName: baugruppe.name };
            return {
                ...current,
                positionenDraft: current.positionenDraft
                    .filter(item => item.mietvertragServiceRowId !== serviceRowId)
                    .map(item => item.rowId === serviceRowId ? aktualisierterService : item)
                    .concat(createMietBaugruppenPosition(aktualisierterService, baugruppe))
            };
        });
    };

    const speichern = (aktion: "vorbereiten" | "zurueckstellen" | "freigabeBeantragen") => {
        const kunde = kunden.find(item => String(item.id) === String(draft.kundeId));
        const anfrage = anfragen.find(item => String(item.id) === String(draft.sourceInquiryId));
        const vorgangId = getVorgangId(anfrage) || (draft.sourceInquiryId ? `anfrage-${draft.sourceInquiryId}` : `angebot-${Date.now()}`);
        const mindestmengenWarnungen = getMindestmengenWarnungen(draft.positionenDraft);
        const mindestmengenFreigabeNoetig = mindestmengenWarnungen.length > 0;
        const automatischeGfFreigabe = mindestmengenFreigabeNoetig || (positionsZwischensumme > 0 && abweichungZurZwischensumme >= gfFreigabeSchwelle);
        const gfFreigabeAktiv = draft.freigabeDurchGf || automatischeGfFreigabe;
        const gfFreigabeNoetig = gfFreigabeAktiv;

        const unvollstaendigerVertrag = draft.positionenDraft.find(position => {
            if (position.leistungTyp !== "Service") return false;
            const service = leistungen.find(item => item.leistungTyp === "Service" && String(item.id) === String(position.serviceId || position.artikelId));
            const mietbaugruppen = draft.positionenDraft.filter(item => item.mietvertragServiceRowId === position.rowId);
            return istVertragsService(service) && (!position.vertragsStart || !position.vertragsEnde || !position.mietArtikelId || position.vertragsEnde < position.vertragsStart || mietbaugruppen.length !== 1);
        });
        if (unvollstaendigerVertrag) {
            setDraft(current => ({ ...current, fehler: "Fuer Mietvertraege bitte Vertragsbeginn, Vertragsende und eine Baugruppe angeben. Das Ende darf nicht vor dem Beginn liegen." }));
            return false;
        }

        if (!kunde || draft.positionenDraft.length === 0) {
            setDraft(current => ({ ...current, fehler: "Bitte einen Kunden und mindestens eine Position auswählen." }));
            return false;
        }

        if (editingOfferId) {
            const bestehendesAngebot = angeboteService.getById(editingOfferId);
            if (!bestehendesAngebot) {
                setDraft(current => ({ ...current, fehler: "Das Angebot konnte nicht mehr gefunden werden." }));
                return false;
            }

            const vorbereitetSpeichern = aktion === "vorbereiten";
            const zurueckgestelltSpeichern = aktion === "zurueckstellen";
            const kommtAusRueckstellung = Boolean(bestehendesAngebot.tagesabschlussZurueckgehalten)
                || String(bestehendesAngebot.freigabeStatus || "") === "rueckgestellt";
            const freigabeFuerTagesversandErteilt = vorbereitetSpeichern
                && !brauchtFreigabe
                && draft.direktSenden
                && !kommtAusRueckstellung
                && !mindestmengenFreigabeNoetig
                && !gfFreigabeNoetig;
            const freigabeDirektErteilen = (vorbereitetSpeichern || zurueckgestelltSpeichern)
                ? false
                : (mindestmengenFreigabeNoetig || gfFreigabeNoetig) ? false : (!kommtAusRueckstellung && !brauchtFreigabe && draft.direktSenden);
            const freigabeNoetig = zurueckgestelltSpeichern
                ? false
                : vorbereitetSpeichern
                ? !freigabeFuerTagesversandErteilt
                : !freigabeDirektErteilen;
            const status = freigabeDirektErteilen ? "wartet auf Antwort" : "in Vorbereitung";
            const verkaufAbsenderName = getUserDisplayNameWithRole(user, String(user.username || "Schülerfirma Verkauf"));

            const referenzierteAnfrageId = anfrage?.id || "";
            const aktualisiert = {
                ...bestehendesAngebot,
                kundeId: kunde.id,
                gueltigBis: draft.gueltigBis,
                rabattBetrag: Number(draft.rabattBetrag || 0),
                verguenstigungsGrund: draft.verguenstigungsGrund.trim(),
                gesamtbetrag: gesamtNachAbzug(draft.positionenDraft, draft.preispositionenDraft, draft.rabattBetrag),
                status,
                positionen: draft.positionenDraft,
                preispositionen: draft.preispositionenDraft,
                bearbeiter: draft.bearbeiter,
                alsVorbereitetGespeichert: vorbereitetSpeichern || zurueckgestelltSpeichern,
                tagesabschlussZurueckgehalten: zurueckgestelltSpeichern,
                direktSendenGewuenscht: freigabeDirektErteilen,
                freigabeStatus: zurueckgestelltSpeichern ? "rueckgestellt" : freigabeNoetig ? ((mindestmengenFreigabeNoetig || gfFreigabeNoetig) ? "weitergeleitet" : "angefragt") : "freigegeben",
                freigabeNotiz: zurueckgestelltSpeichern
                     ? ""
                    : mindestmengenFreigabeNoetig
                     ? `Eiserner Bestand unterschritten: ${mindestmengenWarnungen.map(item => `${item.artikel} (${item.projected}/${item.sicherheitsbestand})`).join(", ")}`
                    : gfFreigabeNoetig
                         ? `Freigabe durch GF erforderlich: Gesamtpreis weicht um ${(abweichungZurZwischensumme * 100).toFixed(1)} % von der Artikelsumme ab.`
                    : "",
                freigegebenVon: freigabeDirektErteilen || freigabeFuerTagesversandErteilt
                    ? (user.username || "")
                    : "",
                anfrageId: bestehendesAngebot.anfrageId || referenzierteAnfrageId
            };

            angeboteService.update(aktualisiert);

            if (zurueckgestelltSpeichern) {
                const verknuepfteAnfrage = anfrage || getInquiryForOffer(bestehendesAngebot, anfragen);
                if (verknuepfteAnfrage) {
                    customerInquiryService.update({
                        ...verknuepfteAnfrage,
                        status: "offen",
                        angebotId: bestehendesAngebot.id,
                        vorgangId: bestehendesAngebot.vorgangId || vorgangId
                    });
                }
            }

            nachrichtenService.create({
                vorgangId: bestehendesAngebot.vorgangId || vorgangId,
                anfrageId: bestehendesAngebot.anfrageId || referenzierteAnfrageId,
                angebotId: bestehendesAngebot.id,
                kundeId: kunde.id,
                datum: heute,
                zeitpunkt: getBerlinTimestamp(),
                senderRolle: "Verkauf",
                senderName: verkaufAbsenderName,
                betreff: `Angebot ${bestehendesAngebot.angebotsNr} überarbeitet`,
                nachricht: freigabeDirektErteilen
                     ? "Das Angebot wurde überarbeitet und direkt an den Kunden gesendet."
                    : zurueckgestelltSpeichern
                         ? "Das Angebot wurde zurückgestellt und nicht zum Tagesversand vorgemerkt."
                        : vorbereitetSpeichern
                         ? "Das Angebot wurde aktualisiert und als vorbereitet gespeichert."
                        : "Das Angebot wurde nach der internen Rückmeldung überarbeitet und erneut zur Freigabe vorbereitet.",
                typ: "Interne Freigabe"
            });

            if (freigabeDirektErteilen && !freigabeNoetig) {
                sendeAngebotAnKunden(aktualisiert);
            }

            setRefreshKey(value => value + 1);
            return true;
        }

        const revisionInfo = naechsteAngebotsrevision(vorgangId);
        const vorbereitetSpeichern = aktion === "vorbereiten";
        const zurueckgestelltSpeichern = aktion === "zurueckstellen";
        const freigabeFuerTagesversandErteilt = vorbereitetSpeichern
            && !brauchtFreigabe
            && draft.direktSenden
            && !mindestmengenFreigabeNoetig
            && !gfFreigabeNoetig;
        const freigabeDirektErteilen = (vorbereitetSpeichern || zurueckgestelltSpeichern)
            ? false
            : (mindestmengenFreigabeNoetig || gfFreigabeNoetig) ? false : (!brauchtFreigabe && draft.direktSenden);
        const freigabeNoetig = zurueckgestelltSpeichern
            ? false
            : vorbereitetSpeichern
            ? !freigabeFuerTagesversandErteilt
            : !freigabeDirektErteilen;
        const status = freigabeDirektErteilen ? "wartet auf Antwort" : "in Vorbereitung";
        const referenzierteAnfrageId = anfrage?.id || "";
        const verkaufAbsenderName = getUserDisplayNameWithRole(user, String(user.username || "Schülerfirma Verkauf"));
        const neuesAngebot = angeboteService.add({
            angebotsNr: `${revisionInfo.angebotsBasisNr}.${revisionInfo.revision}`,
            angebotsBasisNr: revisionInfo.angebotsBasisNr,
            revision: revisionInfo.revision,
            vorgangId,
            anfrageId: referenzierteAnfrageId,
            kundeId: kunde.id,
            datum: heute,
            gueltigBis: draft.gueltigBis,
            rabattBetrag: Number(draft.rabattBetrag || 0),
            verguenstigungsGrund: draft.verguenstigungsGrund.trim(),
            gesamtbetrag: gesamtNachAbzug(draft.positionenDraft, draft.preispositionenDraft, draft.rabattBetrag),
            status,
            positionen: draft.positionenDraft,
            preispositionen: draft.preispositionenDraft,
            bearbeiter: draft.bearbeiter,
            alsVorbereitetGespeichert: vorbereitetSpeichern || zurueckgestelltSpeichern,
            tagesabschlussZurueckgehalten: zurueckgestelltSpeichern,
            direktSendenGewuenscht: freigabeDirektErteilen,
            freigabeStatus: zurueckgestelltSpeichern ? "rueckgestellt" : freigabeNoetig ? ((mindestmengenFreigabeNoetig || gfFreigabeNoetig) ? "weitergeleitet" : "angefragt") : "freigegeben",
            freigabeAngefragtVon: user.username || draft.bearbeiter,
            freigegebenVon: freigabeDirektErteilen || freigabeFuerTagesversandErteilt ? (user.username || "") : "",
            freigabeNotiz: zurueckgestelltSpeichern
                 ? ""
                : mindestmengenFreigabeNoetig
                 ? `Eiserner Bestand unterschritten: ${mindestmengenWarnungen.map(item => `${item.artikel} (${item.projected}/${item.sicherheitsbestand})`).join(", ")}`
                : gfFreigabeNoetig
                     ? `Freigabe durch GF erforderlich: Gesamtpreis weicht um ${(abweichungZurZwischensumme * 100).toFixed(1)} % von der Artikelsumme ab.`
                : ""
        });

        if (!zurueckgestelltSpeichern && (mindestmengenFreigabeNoetig || gfFreigabeNoetig)) {
            freigabenService.create({
                titel: `${mindestmengenFreigabeNoetig ? "Freigabe Eiserner Bestand" : "Preisfreigabe"} ${neuesAngebot.angebotsNr}`,
                bereich: "verkauf",
                verantwortung: "Geschäftsführung",
                status: "offen",
                datum: heute,
                bezug: neuesAngebot.angebotsNr,
                angebotId: neuesAngebot.id,
                vorgangId,
                notiz: mindestmengenFreigabeNoetig
                     ? `Eiserner Bestand unterschritten: ${mindestmengenWarnungen.map(item => `${item.artikel} (${item.projected}/${item.sicherheitsbestand})`).join(", ")}`
                    : `Freigabe durch GF erforderlich: Gesamtpreis weicht um ${(abweichungZurZwischensumme * 100).toFixed(1)} % von der Artikelsumme ab.`
            });
        }

        if (anfrage) {
            customerInquiryService.update({
                ...anfrage,
                kundeId: kunde.id,
                vorgangId,
                ...(zurueckgestelltSpeichern ? {
                    status: "offen",
                    angebotId: neuesAngebot.id
                } : {})
            });
        }

        if (freigabeDirektErteilen && !freigabeNoetig) {
            sendeAngebotAnKunden(neuesAngebot);
        }

        if (draft.sourceInquiryId && anfrage.vorgangId && !freigabeDirektErteilen && !zurueckgestelltSpeichern) {
            nachrichtenService.create({
                vorgangId: anfrage.vorgangId,
                anfrageId: anfrage.id,
                angebotId: "",
                kundeId: anfrage.kundeId || kunde.id,
                datum: heute,
                zeitpunkt: getBerlinTimestamp(),
                senderRolle: "Verkauf",
                senderName: verkaufAbsenderName,
                betreff: `Interne Weiterleitung an ${bearbeiterLabel}`,
                nachricht: `Die Anfrage wurde intern an ${bearbeiterLabel} zur Angebotserstellung weitergeleitet.`,
                typ: "Interne Weiterleitung"
            });
        }

        setRefreshKey(value => value + 1);
        return true;
    };

    const handleClose = () => {
        setOpen(false);
        setEditingOfferId("");
        setDraft(current => ({ ...current, fehler: "", selectedTemplateOfferId: "", alsVorbereitetSpeichern: false, direktSenden: brauchtFreigabe, freigabeDurchGf: false }));
        if (newMode || editOfferIdFromQuery || approveOfferIdFromQuery) {
            navigate("/angebote", { replace: true });
        }
    };

    const toggleStatus = value => {
        setSelectedStatuses(currentValues => (
            currentValues.includes(value)
                 ? currentValues.filter(entry => entry !== value)
                : [...currentValues, value]
        ));
    };

    const [wiedervorlageFilter, setWiedervorlageFilter] = useState("faellig");

    const laufendeAngebote = neuesteAngebote.filter(item => istOffenesAngebot(item));
    const vorbereiteteAngebote = neuesteAngebote.filter(item =>
        Boolean(item.alsVorbereitetGespeichert)
        && !item.tagesabschlussZurueckgehalten
        && String(item.freigabeStatus || "") === "freigegeben"
    );
    const gespeicherteAngebote = neuesteAngebote.filter(item =>
        Boolean(item.alsVorbereitetGespeichert) && Boolean(item.tagesabschlussZurueckgehalten)
    );
    const freizugebendeAngebote = neuesteAngebote.filter(item =>
        item.statusNormalized === "in vorbereitung"
        || (item.statusNormalized === "wiedervorlage" && String(item.wiedervorlageAm || "") <= heute)
    );
    const ueberarbeitungen = neuesteAngebote.filter(item =>
        item.statusNormalized === "in vorbereitung" && String(item.freigabeStatus || "") === "intern_abgelehnt"
    );
    const wiedervorlagen = neuesteAngebote.filter(item => item.statusNormalized === "wiedervorlage");
    const faelligeWiedervorlagen = wiedervorlagen.filter(item => String(item.wiedervorlageAm || "") <= heute);
    const gefilterteWiedervorlagen = wiedervorlagen.filter(item => {
        if (wiedervorlageFilter === "heute") return String(item.wiedervorlageAm || "") === heute;
        if (wiedervorlageFilter === "zukuenftig") return String(item.wiedervorlageAm || "") > heute;
        if (wiedervorlageFilter === "alle") return true;
        return String(item.wiedervorlageAm || "") <= heute;
    });
    const freigabeOffenAngebote = freizugebendeAngebote.filter(item => !["intern_abgelehnt", "freigegeben", "weitergeleitet", "rueckgestellt"].includes(String(item.freigabeStatus || "")));
    const alleAngebote = neuesteAngebote.filter(item => selectedStatuses.includes(item.statusNormalized));
    const zumChatNavigieren = row => {
        const anfrage = getInquiryForOffer(row, anfragen);
        if (!anfrage) {
            navigate("/kundenanfragen");
            return;
        }
        navigate(`/kundenanfragen?focus=${anfrage.id}`);
    };
    const angebotFreigeben = (angebot, fuerTagesversand = false) => {
        const aktualisiert = {
            ...angebot,
            freigabeStatus: "freigegeben",
            freigabeNotiz: approvalNote.trim() || angebot.freigabeNotiz || "",
            freigegebenVon: user.username || user.name || "verkauf",
            direktSendenGewuenscht: !fuerTagesversand,
            alsVorbereitetGespeichert: fuerTagesversand,
            tagesabschlussZurueckgehalten: false,
            status: fuerTagesversand ? "in Vorbereitung" : "wartet auf Antwort"
        };
        angeboteService.update(aktualisiert);
        if (!fuerTagesversand && aktualisiert.anfrageId) {
            sendeAngebotAnKunden(aktualisiert);
        }
        setRefreshKey(value => value + 1);
        schliesseFreigabeDialog();
    };
    const brauchtGfFreigabeFuerAngebot = angebot => {
        const positionen = angebot.positionen || [];
        const positionssumme = calculatePositionenTotal(positionen);
        const nettoGesamt = calculateNetto(positionen, angebot.preispositionen || [], angebot.rabattBetrag);
        const preisabweichung = positionssumme > 0 && Math.abs(nettoGesamt - positionssumme) / positionssumme >= gfFreigabeSchwelle;
        return getMindestmengenWarnungen(positionen).length > 0 || preisabweichung;
    };
    const vorbereitetesAngebotSofortSenden = angebot => {
        const istBlockiert = ["angefragt", "weitergeleitet", "intern_abgelehnt"].includes(String(angebot.freigabeStatus || ""));
        if (brauchtFreigabe || istBlockiert || brauchtGfFreigabeFuerAngebot(angebot)) return;
        const aktualisiert = {
            ...angebot,
            status: "wartet auf Antwort",
            freigabeStatus: "freigegeben",
            direktSendenGewuenscht: true,
            alsVorbereitetGespeichert: false,
            tagesabschlussZurueckgehalten: false,
            freigegebenVon: user.username || user.name || "verkauf"
        };
        angeboteService.update(aktualisiert);
        sendeAngebotAnKunden(aktualisiert);
        setRefreshKey(value => value + 1);
    };
    const tagesabschlussAngebote = vorbereiteteAngebote.filter(angebot => {
        const istBlockiert = ["angefragt", "weitergeleitet", "intern_abgelehnt"].includes(String(angebot.freigabeStatus || ""));
        return !istBlockiert && String(angebot.gueltigBis || "") >= heute && !brauchtGfFreigabeFuerAngebot(angebot);
    });
    const tagesabschlussDurchfuehren = async () => {
        if (brauchtFreigabe) return;
        try {
            const result = await tagesversandService.ausfuehren();
            if (result.protocol) {
                setTagesversandProtokolle(current => [result.protocol, ...current.filter(item => item.id !== result.protocol.id)]);
            }
            setRefreshKey(value => value + 1);
            setTagesabschlussBestaetigungOpen(false);
            setTagesversandFehler("");
        } catch (error) {
            setTagesversandFehler(error instanceof Error ? error.message : "Der Testlauf konnte nicht ausgeführt werden.");
        }
    };
    const angebotZumTagesabschlussZurueckhalten = angebot => {
        angeboteService.update({
            ...angebot,
            tagesabschlussZurueckgehalten: true,
            direktSendenGewuenscht: false
        });
        setRefreshKey(value => value + 1);
    };
    const angebotZurUeberarbeitungZurueckgeben = (angebot, status = "in Vorbereitung", freigabeStatus = "angefragt") => {
        if (!approvalNote.trim()) return;
        angeboteService.update({
            ...angebot,
            freigabeStatus,
            freigabeNotiz: approvalNote.trim(),
            status,
            direktSendenGewuenscht: false
        });
        nachrichtenService.create({
            vorgangId: angebot.vorgangId || "",
            anfrageId: angebot.anfrageId || "",
            angebotId: angebot.id,
            kundeId: angebot.kundeId || "",
            datum: heute,
            zeitpunkt: getBerlinTimestamp(),
            senderRolle: "Verkauf Freigabe",
            senderName: getUserDisplayNameWithRole(user, String(user.username || "Verkauf Senior")),
            betreff: `Überarbeitung ${angebot.angebotsNr}`,
            nachricht: `Bitte Angebot ${angebot.angebotsNr} überarbeiten. Hinweis: ${approvalNote.trim()}`,
            typ: "Interne Freigabe"
        });
        setRefreshKey(value => value + 1);
        schliesseFreigabeDialog();
    };
    const angebotInternAblehnen = (angebot) => {
        angebotZurUeberarbeitungZurueckgeben(angebot, "in Vorbereitung", "intern_abgelehnt");
    };
    const angebotZurUeberarbeitungBearbeiten = (angebot) => {
        if (!approvalNote.trim()) return;
        const aktualisiert = {
            ...angebot,
            freigabeStatus: "intern_abgelehnt",
            freigabeNotiz: approvalNote.trim(),
            status: "in Vorbereitung",
            direktSendenGewuenscht: false
        };
        angeboteService.update(aktualisiert);
        nachrichtenService.create({
            vorgangId: angebot.vorgangId || "",
            anfrageId: angebot.anfrageId || "",
            angebotId: angebot.id,
            kundeId: angebot.kundeId || "",
            datum: heute,
            zeitpunkt: getBerlinTimestamp(),
            senderRolle: "Verkauf Freigabe",
            senderName: getUserDisplayNameWithRole(user, String(user.username || "Verkauf Senior")),
            betreff: `Überarbeitung ${angebot.angebotsNr}`,
            nachricht: `Bitte Angebot ${angebot.angebotsNr} überarbeiten. Hinweis: ${approvalNote.trim()}`,
            typ: "Interne Freigabe"
        });
        setRefreshKey(value => value + 1);
        setPendingEditOffer(aktualisiert);
        schliesseFreigabeDialog();
    };
    const angebotAnGfWeiterleiten = (angebot) => {
        if (!approvalNote.trim()) return;
        const offeneFreigabe = freigabenService.list().find(item => String(item.angebotId || "") === String(angebot.id) && item.status === "offen");
        const payload = {
            titel: `Freigabe ${angebot.angebotsNr}`,
            bereich: "verkauf",
            verantwortung: "Geschäftsführung",
            status: "offen",
            datum: heute,
            bezug: angebot.angebotsNr,
            notiz: approvalNote.trim(),
            angebotId: angebot.id,
            anfrageId: angebot.anfrageId || "",
            vorgangId: angebot.vorgangId || ""
        };
        if (offeneFreigabe) {
            freigabenService.update(offeneFreigabe.id, { ...offeneFreigabe, ...payload });
        } else {
            freigabenService.create(payload);
        }
        angeboteService.update({
            ...angebot,
            freigabeStatus: "weitergeleitet",
            freigabeNotiz: approvalNote.trim(),
            status: "in Vorbereitung"
        });
        setRefreshKey(value => value + 1);
        schliesseFreigabeDialog();
    };
    const freigabePruefen = (angebot) => {
        setApprovalOffer(angebot);
        setApprovalNote(String(angebot.freigabeNotiz || ""));
        setApprovalOpen(true);
    };
    const dashboardTabs = [
        { key: "laufend", label: "Beim Kunden", value: laufendeAngebote.length },
        { key: "freigabe", label: "Freigabe ausstehend", value: freigabeOffenAngebote.length },
        { key: "gespeichert", label: "Rückgestellt", value: gespeicherteAngebote.length },
        { key: "vorbereitet", label: "Zum Tagesabschluss", value: vorbereiteteAngebote.length },
        { key: "ueberarbeitung", label: "Überarbeitung erforderlich", value: ueberarbeitungen.length },
        { key: "wiedervorlagen", label: "Wiedervorlagen", value: wiedervorlagen.length },
        { key: "alle", label: "Alle Angebote", value: neuesteAngebote.length }
    ];
    const sichtbareAngebote = activeTab === "freigabe"
         ? freigabeOffenAngebote
        : activeTab === "vorbereitet"
             ? vorbereiteteAngebote
        : activeTab === "gespeichert"
             ? gespeicherteAngebote
        : activeTab === "ueberarbeitung"
             ? ueberarbeitungen
        : activeTab === "wiedervorlagen"
             ? gefilterteWiedervorlagen
        : activeTab === "alle"
             ? alleAngebote
            : laufendeAngebote;
    const tableTitle = activeTab === "freigabe"
         ? "Freigabe ausstehend"
        : activeTab === "vorbereitet"
             ? "Zum Tagesabschluss vorgemerkte Angebote"
        : activeTab === "gespeichert"
             ? "Zurückgestellte Angebote"
        : activeTab === "ueberarbeitung"
             ? "Überarbeitung erforderlich"
        : activeTab === "wiedervorlagen"
             ? "Wiedervorlagen"
        : activeTab === "alle"
             ? "Alle Angebote"
            : "Laufende Angebote";
    const mindestmengenWarnungenImDialog = getMindestmengenWarnungen(draft.positionenDraft);
    const sicherheitsbestandFreigabeImDialog = mindestmengenWarnungenImDialog.length > 0;
    const preisabweichungFreigabeImDialog = positionsZwischensumme > 0 && abweichungZurZwischensumme >= gfFreigabeSchwelle;
    const automatischeGfFreigabeImDialog = sicherheitsbestandFreigabeImDialog || preisabweichungFreigabeImDialog;
    const gfFreigabeAktivImDialog = draft.freigabeDurchGf || automatischeGfFreigabeImDialog;
    const bearbeitetRueckgestelltesAngebot = Boolean(editingOfferId) && Boolean(
        angebote.find(item => String(item.id) === String(editingOfferId))?.tagesabschlussZurueckgehalten
        || String(angebote.find(item => String(item.id) === String(editingOfferId))?.freigabeStatus || "") === "rueckgestellt"
    );
    const kannDirektVersendenImDialog = !brauchtFreigabe && draft.direktSenden && !gfFreigabeAktivImDialog && !bearbeitetRueckgestelltesAngebot;
    const versandAktionLabel = kannDirektVersendenImDialog ? "Direkt versenden" : "Freigabe beantragen";
    const tagesversandAktionLabel = kannDirektVersendenImDialog
        ? "Freigegeben für Tagesabschluss vormerken"
        : "Für Freigabe und Tagesversand vorbereiten";
    return <>
        <SalesFlowBar currentStep="angebote"/>
        <div className="kennzahlen">
            {dashboardTabs.map(card => <button key={card.key} type="button" className={`kennzahl kennzahl-button${activeTab === card.key ? " is-active" : ""}`} onClick={() => setActiveTab(card.key)}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
            </button>)}
        </div>
        {activeTab === "vorbereitet" && <div className="dashboard-panel">
            <div className="dashboard-panel-header">
                <h2>Automatischer Tagesversand</h2>
                <span>{heute}, {optionen.angeboteTagesabschlussUhrzeit} Uhr</span>
            </div>
            <p>Diese Angebote sind für den nächsten Versand zum Tagesabschluss vorgemerkt.</p>
        </div>}
        {activeTab === "alle" && <div className="dashboard-panel">
            <div className="dashboard-panel-header">
                <h2>Statushilfe Angebote</h2>
                <span>Verkauf</span>
            </div>
            <ul className="dashboard-note-list">
                {STATUS_HELP.map(item => <li key={item.label}><strong>{item.label}:</strong> {item.text}</li>)}
            </ul>
        </div>}
        {optionen.angeboteTagesabschlussAktiv && <div className="dashboard-panel">
            <div className="dashboard-panel-header">
                <h2>Automatischer Tagesversand</h2>
                <span>{heute}, {optionen.angeboteTagesabschlussUhrzeit} Uhr</span>
            </div>
            <ul className="dashboard-note-list">
                <li><strong>{vorbereiteteAngebote.length} vorgemerkt:</strong> Diese Angebote werden beim Tagesabschluss versendet.</li>
                <li><strong>{freigabeOffenAngebote.length} zur Freigabe:</strong> Diese Angebote warten auf eine interne Prüfung.</li>
                <li><strong>{faelligeWiedervorlagen.length} fällig:</strong> Wiedervorlagen mit Prüfdatum bis heute sollten bearbeitet werden.</li>
                <li><strong>{laufendeAngebote.length} beim Kunden:</strong> Diese Angebote warten aktuell auf eine Kundenantwort.</li>
            </ul>
            <button type="button" onClick={() => {
                setTagesversandFehler("");
                setTagesabschlussBestaetigungOpen(true);
            }} disabled={brauchtFreigabe || tagesabschlussAngebote.length === 0}>
                Testlauf jetzt ausführen ({tagesabschlussAngebote.length})
            </button>
            {tagesversandProtokolle.length > 0 && <p>
                Letzter Lauf: {String(tagesversandProtokolle[0].ausgefuehrtAm || "-").replace("T", " ").slice(0, 16)} Uhr, {tagesversandProtokolle[0].versendet?.length || 0} versendet, {tagesversandProtokolle[0].uebersprungen?.length || 0} übersprungen.
            </p>}
            {tagesversandProtokolle.length > 0 && <ul className="dashboard-note-list">
                {tagesversandProtokolle.slice(0, 5).map(protokoll => <li key={protokoll.id}>
                    <strong>{protokoll.versandDatum}:</strong> {protokoll.versendet?.length || 0} versendet, {protokoll.uebersprungen?.length || 0} übersprungen.
                </li>)}
            </ul>}
        </div>}
        <DataTable
            title={tableTitle}
            selectableColumns={false}
            data={sichtbareAngebote}
            columns={angebotColumns}
            toolbarContent={activeTab === "alle" ? <MultiStatusFilter
                options={STATUS_FILTER_OPTIONS}
                selectedValues={selectedStatuses}
                onToggle={toggleStatus}
            /> : activeTab === "wiedervorlagen" ? <label>
                Filter
                <select value={wiedervorlageFilter} onChange={event => setWiedervorlageFilter(event.target.value)}>
                    <option value="faellig">Fällig bis heute</option>
                    <option value="heute">Heute</option>
                    <option value="zukuenftig">Zukünftig</option>
                    <option value="alle">Alle Wiedervorlagen</option>
                </select>
            </label> : null}
            toolbarActions={[{ name: "new", label: "Neues Angebot", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: () => initialisiereDialog() }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: angebotBearbeiten, variant: "secondary", isVisible: row => (activeTab === "ueberarbeitung" && String(row.freigabeStatus || "") === "intern_abgelehnt") || ["vorbereitet", "gespeichert"].includes(activeTab) },
                { name: "hold", label: "Zurückstellen", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: angebotZumTagesabschlussZurueckhalten, variant: "secondary", isVisible: () => activeTab === "vorbereitet" },
                { name: "send", label: "Sofort senden", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: vorbereitetesAngebotSofortSenden, variant: "success", isVisible: row => activeTab === "vorbereitet" && !brauchtFreigabe && !["angefragt", "weitergeleitet", "intern_abgelehnt"].includes(String(row.freigabeStatus || "")) && !brauchtGfFreigabeFuerAngebot(row) },
                { name: "thread", label: "Chat", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: zumChatNavigieren, variant: "secondary", isVisible: row => !!row.anfrageId },
                { name: "approve", label: "Prüfen", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: freigabePruefen, variant: "success", isVisible: row => activeTab === "freigabe" && istErfahrenerVerkaeufer && row.statusNormalized === "in vorbereitung" && String(row.freigabeStatus || "") === "angefragt" }
            ]}
            detailLinkResolver={({ field, row, value }) => {
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                if (field === "anfrageId" && value) return `/kundenanfragen?focus=${value}`;
                return null;
            }}
        />
        <Dialog
            open={tagesabschlussBestaetigungOpen}
            title="Testlauf für automatischen Tagesversand"
            onClose={() => setTagesabschlussBestaetigungOpen(false)}
            footer={<button type="button" className="button is-primary" onClick={tagesabschlussDurchfuehren}>
                Testlauf ausführen
            </button>}
        >
            <p>Die folgenden Angebote werden an die jeweiligen Kunden versendet:</p>
            <ul className="positionsliste">
                {tagesabschlussAngebote.map(angebot => <li key={angebot.id} className="position-entry">
                    <strong>{angebot.angebotsNr}</strong> - {angebot.kunde || getCustomerName(angebot.kundeId, "Kunde")}
                </li>)}
            </ul>
            <p>Zurückgestellte Angebote und Angebote mit offener Freigabe bleiben unverändert.</p>
            {tagesversandFehler && <p className="form-error">{tagesversandFehler}</p>}
        </Dialog>
        <Dialog
            open={open}
            title={editingOfferId ? "Angebot bearbeiten" : (draft.sourceInquiryId ? "Angebot aus Kundenanfrage erstellen" : "Neues Angebot")}
            onClose={handleClose}
            footer={<Fragment>
                <SaveButton className="button is-light" onSave={() => speichern("zurueckstellen")} onSuccess={handleClose}>Rückgestellt speichern</SaveButton>
                <SaveButton className="button is-light" onSave={() => speichern("vorbereiten")} onSuccess={handleClose}>{tagesversandAktionLabel}</SaveButton>
                <SaveButton className="button is-primary" onSave={() => speichern("freigabeBeantragen")} onSuccess={handleClose}>{versandAktionLabel}</SaveButton>
            </Fragment>}
        >
            {draft.sourceInquiryId && anfrageImDialog && <div className="offer-forward-panel form-row thread-section">
                <div className="thread-section-header">
                    <Label>Vorgang</Label>
                </div>
                <div className="offer-forward-grid">
                    <div className="offer-forward-card thread-subcard">
                        <Label>Kunde</Label>
                        <p>{getCustomerName(anfrageImDialog.kundeId, anfrageImDialog.kunde)}</p>
                    </div>
                    <div className="offer-forward-card thread-subcard">
                        <Label>Anfrage-Nr.</Label>
                        <p>{anfrageImDialog.vorgangId || `anfrage-${anfrageImDialog.id}`}</p>
                    </div>
                    <div className="offer-forward-card thread-subcard">
                        <Label>Bearbeitet von</Label>
                        <LookupField value={draft.bearbeiter} options={bearbeiterOptionen} onChange={value => setDraft(item => ({ ...item, bearbeiter: value }))} placeholder="Bearbeiter auswählen..."/>
                    </div>
                </div>
                <div className="offer-forward-card thread-subcard">
                    <Label>Chat-Ausschnitt zum Nachlesen</Label>
                    {weiterleitungsAusschnitt.length === 0 ? <p>Noch keine weiterleitbaren Nachrichten vorhanden.</p> : <div className="offer-forward-thread">
                        {weiterleitungsAusschnitt.map(nachricht => {
                            const variant = getDialogMessageVariant(nachricht);
                            return <div
                                key={nachricht.id}
                                className={`thread-message-row ${variant === "customer" ? "thread-message-row-customer" : variant === "outbound" ? "thread-message-row-outbound" : "thread-message-row-internal"}`}
                            >
                                <article className={`thread-message ${variant === "customer" ? "thread-message-customer" : variant === "outbound" ? "thread-message-outbound" : "thread-message-internal"}`}>
                                    <div className="thread-message-meta">
                                        <strong>{nachricht.senderName || nachricht.senderRolle}</strong>
                                        <span>{getDialogMessageLabel(nachricht)} | {formatTimestampForDisplay(nachricht.zeitpunkt || nachricht.datum)} | {nachricht.betreff}</span>
                                    </div>
                                    <p className="thread-message-text">{nachricht.nachricht}</p>
                                </article>
                            </div>;
                        })}
                    </div>}
                </div>
            </div>}
            {draft.sourceInquiryId && bisherigeAngeboteImDialog.length > 0 && <div className="form-row thread-template-section thread-section">
                <div className="thread-section-header">
                    <Label>Vorlagen</Label>
                </div>
                <div className="thread-template-panel">
                    <div className="offer-forward-card thread-subcard">
                        <Label glossaryKey="lieferantenvergleich">Frühere Angebote als Vorlage</Label>
                        <p>Bei Bedarf kann ein bisheriger Angebotsstand übernommen und anschließend geändert werden.</p>
                    </div>
                    <div className="thread-document-links">
                        {bisherigeAngeboteImDialog.map(item => <button
                            key={`dialog-template-${item.id}`}
                            type="button"
                            className={`thread-document-link${String(draft.selectedTemplateOfferId) === String(item.id) ? " is-active" : ""}`}
                            onClick={() => angebotAlsVorlageUebernehmen(String(item.id))}
                        >
                            {item.angebotsNr} übernehmen
                        </button>)}
                    </div>
                </div>
            </div>}
            <div className="form-row thread-section">
                <div className="thread-section-header">
                    <Label>Angebotsdaten</Label>
                </div>
                <div className="thread-form-grid">
                    <div><Label>Angebotsnummer</Label><input type="text" value={draft.angebotsNrDraft} disabled/></div>
                    <div><Label glossaryKey="gueltigbis">Gültig bis</Label><input type="date" value={draft.gueltigBis} onChange={event => setDraft(item => ({ ...item, gueltigBis: event.target.value }))}/></div>
                </div>
            </div>
            <div className="form-row thread-section">
                <div className="thread-section-header">
                    <Label>Position hinzufügen</Label>
                </div>
                <div className="thread-form-grid thread-form-grid-actions">
                    <div><Label>Artikel / Service</Label><LookupField value={draft.leistungId} options={leistungsOptionen} onChange={value => setDraft(item => ({ ...item, leistungId: value }))} placeholder="Artikel oder Service suchen..."/></div>
                    <div><Label glossaryKey="angebotspositionen">Menge</Label><NumberField value={draft.menge} min="1" onChange={wert => setDraft(item => ({ ...item, menge: Number(wert) }))}/></div>
                    <button type="button" onClick={positionHinzufuegen}>Position hinzufügen</button>
                </div>
                <p style={{ marginTop: "0.5rem", color: "var(--text-secondary)" }}>
                    Konfigurierbare Baugruppen sind im Suchfeld markiert und können mehrfach mit unterschiedlichen Individualisierungen hinzugefügt werden.
                </p>
            </div>
            <div className="form-row thread-section">
                <div className="thread-section-header">
                    <Label glossaryKey="angebotspositionen">Angebotspositionen</Label>
                </div>
                {draft.positionenDraft.filter(position => !position.isOptionForId).length === 0 ? <p>Noch keine Position vorhanden.</p> : <div className="position-table-wrapper">
                    <table className="position-table">
                        <thead>
                            <tr>
                                <th>Artikel-Nr.</th>
                                <th>Name</th>
                                <th>Menge</th>
                                <th>Einzelpreis</th>
                                <th>Gesamtpreis</th>
                                <th>Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {draft.positionenDraft.filter(position => !position.isOptionForId).map((position, index) => {
                                const verfuegbarkeit = getVerfuegbarkeitFuerPosition(position);
                                const leistung = leistungen.find(item =>
                                    String(item.id) === String(position.serviceId || position.artikelId || "")
                                    && String(item.leistungTyp || "") === String(position.leistungTyp || "")
                                );
                                const nummer = String(leistung?.nummer || position.artikelId || position.serviceId || "-");
                                const positionIstMietvertrag = position.leistungTyp === "Service" && istVertragsService(leistung);
                                const positionMitIndividualisierung = hasIndividualisierungen(leistung) && !positionIstMietvertrag && !position.istMietBaugruppe;
                                const optionGroups = positionMitIndividualisierung
                                    ? getOptionGroups(leistung.individualisierungen)
                                    : [];
                                const optionAufpreisProEinheit = positionMitIndividualisierung ? calculateOptionAufpreisProEinheit(position, leistung) : 0;
                                const vorgemerkterOptionAufpreis = positionMitIndividualisierung
                                    ? calculateOptionAufpreisProEinheit({ ...position, selectedOptionen: position.pendingOptionen || position.selectedOptionen }, leistung)
                                    : 0;
                                const optionenWurdenGeaendert = JSON.stringify(position.pendingOptionen || position.selectedOptionen || {}) !== JSON.stringify(position.selectedOptionen || {});
                                const endpreisProEinheit = Number(position.einzelpreis || 0) + optionAufpreisProEinheit;
                                const endpreisGesamt = endpreisProEinheit * Number(position.menge || 0);

                                return <Fragment key={`${position.leistungTyp}-${position.artikelId || position.serviceId || index}-${position.rowId}`}>
                                    <tr>
                                        <td>{nummer}</td>
                                        <td>{position.artikel}</td>
                                        <td className="position-table-quantity-cell">
                                            <NumberField
                                                value={position.menge}
                                                min="1"
                                                onChange={wert => setDraft(items => {
                                                    const aktualisiertePositionen = items.positionenDraft.map(item => item.rowId === position.rowId
                                                        ? { ...item, menge: wert }
                                                        : item.mietvertragServiceRowId === position.rowId
                                                            ? { ...item, menge: wert }
                                                        : item
                                                    );
                                                    const parentPosition = aktualisiertePositionen.find(item => item.rowId === position.rowId);
                                                    return {
                                                        ...items,
                                                            positionenDraft: positionMitIndividualisierung && parentPosition ? syncOptionRows(aktualisiertePositionen, parentPosition, leistung, artikel) : aktualisiertePositionen
                                                    };
                                                })}
                                            />
                                        </td>
                                        <td>{endpreisProEinheit.toFixed(2)} EUR</td>
                                        <td>{endpreisGesamt.toFixed(2)} EUR</td>
                                        <td>
                                            {position.istMietBaugruppe ? <small>An Vertragsposition gekoppelt</small> : <button type="button" className="link-button" onClick={() => setDraft(items => ({
                                                ...items,
                                                positionenDraft: items.positionenDraft.filter(item => item.rowId !== position.rowId && item.isOptionForId !== position.rowId && item.mietvertragServiceRowId !== position.rowId)
                                            }))}>Entfernen</button>}
                                        </td>
                                    </tr>
                                    <tr className="position-table-detail-row">
                                        <td colSpan={6}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <p className={`position-availability${verfuegbarkeit.istKritisch ? " position-availability-critical" : ""}`}>
                                                    {verfuegbarkeit.text}
                                                </p>
                                                {positionIstMietvertrag && (
                                                    <div style={{ padding: "0.75rem", background: "var(--background-alt)", borderRadius: "var(--radius-sm)", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                                                        <div><Label>Vertragsbeginn</Label><input type="date" value={position.vertragsStart || ""} onChange={event => setDraft(items => ({ ...items, positionenDraft: items.positionenDraft.map(item => item.rowId === position.rowId ? { ...item, vertragsStart: event.target.value } : item) }))}/></div>
                                                        <div><Label>Vertragsende</Label><input type="date" value={position.vertragsEnde || ""} min={position.vertragsStart || undefined} onChange={event => setDraft(items => ({ ...items, positionenDraft: items.positionenDraft.map(item => item.rowId === position.rowId ? { ...item, vertragsEnde: event.target.value } : item) }))}/></div>
                                                        <div style={{ minWidth: "220px" }}>
                                                            <Label>Mietbaugruppe</Label>
                                                            <select
                                                                value={position.mietArtikelId || ""}
                                                                onChange={event => handleMietBaugruppeChange(position.rowId, event.target.value)}
                                                            >
                                                                <option value="">Baugruppe auswählen...</option>
                                                                {artikel
                                                                    .filter(item => item.artikelTyp === "Baugruppe" && item.istVerkaeuflich)
                                                                    .map(item => <option key={item.id} value={item.id}>{item.artikelNr} - {item.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <small>Die Baugruppe wird mit 0,00 EUR berechnet und ist nicht individualisierbar.</small>
                                                    </div>
                                                )}
                                                {optionGroups.length > 0 && (
                                                    <div className="offer-configuration">
                                                        <div className="offer-configuration-header">
                                                            <strong>Konfiguration</strong>
                                                            <div className="offer-configuration-apply">
                                                                <span>Änderung: {vorgemerkterOptionAufpreis > 0 ? "+" : ""}{vorgemerkterOptionAufpreis.toFixed(2)} EUR</span>
                                                                <button type="button" className="button-secondary offer-configuration-button" onClick={() => optionenUebernehmen(position.rowId)} disabled={!optionenWurdenGeaendert}>Übernehmen</button>
                                                            </div>
                                                        </div>
                                                        <div className="offer-configuration-options">
                                                        {optionGroups.map(groupId => {
                                                            const gruppenOptionen = leistung.individualisierungen.filter(i => String(i.kategorieId) === String(groupId));
                                                            const defaultOpt = gruppenOptionen.find(i => i.standard) || gruppenOptionen[0];
                                                            const currentVal = position.pendingOptionen?.[groupId] || position.selectedOptionen?.[groupId] || defaultOpt?.individualArtikelId || "";
                                                            const aktuelleOption = gruppenOptionen.find(opt => String(opt.individualArtikelId) === String(currentVal)) || defaultOpt;
                                                            const istStandardausfuehrung = Boolean(aktuelleOption?.standard);
                                                            const optionsArtikel: any = artikel.find((item: any) => String(item.id) === String(aktuelleOption?.individualArtikelId));
                                                            const optionsBestand = Number(optionsArtikel?.bestand || 0);
                                                            const optionsVerplant = Number(verplanteMengen[String(aktuelleOption?.individualArtikelId || "")] || 0);
                                                            const optionsAngebotsbedarf = Number(aktuellerAngebotsbedarf[String(aktuelleOption?.individualArtikelId || "")] || 0);
                                                            const optionsVerfuegbar = optionsBestand - optionsVerplant;
                                                            const optionsMindestbestand = Number(optionsArtikel?.mindestmenge || 0);
                                                            const optionsProjected = optionsVerfuegbar - optionsAngebotsbedarf;
                                                            const optionsKritisch = !istStandardausfuehrung && (optionsAngebotsbedarf > optionsVerfuegbar || optionsProjected < optionsMindestbestand);
                                                            return (
                                                                <div key={groupId} className="offer-configuration-option">
                                                                    <label style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-secondary)", minHeight: "1.2rem", display: "block" }}>Individualisierung ({getIndividualisierungsLabel(groupId)})</label>
                                                                    <select
                                                                        value={currentVal}
                                                                        onChange={e => handleOptionChange(position.rowId, groupId, e.target.value)}
                                                                    >
                                                                        {gruppenOptionen.map(opt => (
                                                                            <option key={opt.individualArtikelId} value={opt.individualArtikelId}>
                                                                                {opt.artikel} {Number(opt.preisaenderung || 0) > 0 ? `(+${Number(opt.preisaenderung).toFixed(2)} EUR)` : Number(opt.preisaenderung || 0) < 0 ? `(${Number(opt.preisaenderung).toFixed(2)} EUR)` : ""}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    {istStandardausfuehrung ? <small className="offer-configuration-stock-note">Standardausführung · nicht bestandsgeführt</small> : <small
                                                                        className={optionsKritisch ? "form-error" : undefined}
                                                                        title={`Im Angebot: ${optionsAngebotsbedarf} | Nachbestellt: ${Number(offeneBestellmengen[String(aktuelleOption?.individualArtikelId || "")] || 0)}${optionsProjected < optionsMindestbestand ? ` | Eiserner Bestand von ${optionsMindestbestand} wird unterschritten` : ""}`}
                                                                    >
                                                                        Lager-Bestand: {optionsBestand} | Bestand: {optionsVerfuegbar}
                                                                    </small>}
                                                                </div>
                                                            );
                                                        })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                </Fragment>;
                            })}
                        </tbody>
                    </table>
                </div>}
                <div className="thread-summary-card">
                    <Label>Kalkulationsübersicht</Label>
                    <div className="thread-summary-lines">
                        <div><span>Zwischensumme</span><strong>{calculatePositionenTotal(draft.positionenDraft).toFixed(2)} EUR</strong></div>
                        {draft.preispositionenDraft.length > 0 && (
                            <>
                                {(() => {
                                    const baseTotal = calculatePositionenTotal(draft.positionenDraft);
                                    return draft.preispositionenDraft.map(position => (
                                        <div key={position.id}>
                                            <span>{position.beschreibung || (position.typ === "percent" ? "Prozent-Anpassung" : "Betrag")}</span>
                                            <strong>{position.typ === "percent" ? `${Number(position.wert || 0).toFixed(2)} % \u2249 ${ (baseTotal * Number(position.wert || 0) / 100).toFixed(2) } EUR` : `${Number(position.wert || 0).toFixed(2)} EUR`}</strong>
                                        </div>
                                    ));
                                })()}
                            </>
                        )}
                        <div className="offer-total"><span>Gesamtbetrag exkl. MwSt</span><strong style={{fontSize: '1.15em'}}>{calculateNetto(draft.positionenDraft, draft.preispositionenDraft, draft.rabattBetrag).toFixed(2)} EUR</strong></div>
                        <div><span>MwSt ({(MWST_RATE * 100).toFixed(0)}%)</span><strong>{calculateMwSt(draft.positionenDraft, draft.preispositionenDraft, draft.rabattBetrag).toFixed(2)} EUR</strong></div>
                        <div className="offer-total"><span>Gesamtbetrag inkl. MwSt</span><strong style={{fontSize: '1.15em'}}>{gesamtNachAbzug(draft.positionenDraft, draft.preispositionenDraft, draft.rabattBetrag).toFixed(2)} EUR</strong></div>
                    </div>
                </div>
            </div>
            <div className="form-row thread-section">
                <div className="thread-section-header">
                    <Label glossaryKey="zuAbschlaege">Zu- und Abschläge</Label>
                </div>
                
                <div className="position-table-wrapper">
                    <table className="position-table">
                        <thead>
                            <tr>
                                <th>Beschreibung</th>
                                <th>Typ</th>
                                <th>Wert</th>
                                <th>Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {draft.preispositionenDraft.map((position) => (
                                <tr key={position.id}>
                                    <td>
                                        <input
                                            type="text"
                                            value={position.beschreibung}
                                            placeholder="z. B. Bundle-Rabatt oder Expresslieferung"
                                            onChange={event => setDraft(current => ({
                                                ...current,
                                                preispositionenDraft: current.preispositionenDraft.map(item => item.id === position.id ? { ...item, beschreibung: event.target.value } : item)
                                            }))}
                                        />
                                    </td>
                                    <td>
                                        <select
                                            value={position.typ}
                                            onChange={event => setDraft(current => ({
                                                ...current,
                                                preispositionenDraft: current.preispositionenDraft.map(item => item.id === position.id ? { ...item, typ: event.target.value } : item)
                                            }))}
                                        >
                                            <option value="amount">Betrag</option>
                                            <option value="percent">Prozent</option>
                                        </select>
                                    </td>
                                    <td>
                                        <NumberField
                                            value={position.wert}
                                            min="-999999"
                                            step="0.01"
                                            format={position.typ === "percent" ? "percent" : "currency"}
                                            onChange={wert => setDraft(current => ({
                                                ...current,
                                                preispositionenDraft: current.preispositionenDraft.map(item => item.id === position.id ? { ...item, wert } : item)
                                            }))}
                                        />
                                    </td>
                                    <td>
                                        <button type="button" className="link-button" onClick={() => setDraft(current => ({
                                            ...current,
                                            preispositionenDraft: current.preispositionenDraft.filter(item => item.id !== position.id)
                                        }))}>
                                            Entfernen
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button type="button" onClick={() => setDraft(current => ({
                    ...current,
                    preispositionenDraft: [...current.preispositionenDraft, createPreispositionDraft()]
                }))}>
                    Neue Preisposition hinzufügen
                </button>
            </div>
            <div className="form-row thread-section">
                <div className="thread-section-header">
                    <Label glossaryKey="freigabe">Freigabe</Label>
                </div>
                {hatUnvollstaendigeKundenadresse(kundeImDialog) && <p className="form-error">
                    Beim Kunden fehlen Adressdaten. Bitte vor dem Versenden des Angebots Anschrift, PLZ und Ort beim Kunden nachfragen.
                </p>}
                <div className="offer-send-checkbox-row">
                    <Checkbox checked={!brauchtFreigabe && draft.direktSenden} onChange={value => setDraft(item => ({ ...item, direktSenden: value, freigabeDurchGf: value ? false : item.freigabeDurchGf }))} disabled={brauchtFreigabe || gfFreigabeAktivImDialog || bearbeitetRueckgestelltesAngebot}>
                        Freigabe direkt erteilen
                    </Checkbox>
                    <Checkbox checked={gfFreigabeAktivImDialog} onChange={value => setDraft(item => ({ ...item, freigabeDurchGf: value, direktSenden: value ? false : item.direktSenden }))} disabled={automatischeGfFreigabeImDialog || draft.direktSenden}>
                        Freigabe durch GF
                    </Checkbox>
                </div>
                {brauchtFreigabe && <div className="form-error">
                    {brauchtFreigabe && <p>Du hast keine Berechtigung zur eigenständigen Freigabe.</p>}
                </div>}
                {bearbeitetRueckgestelltesAngebot && <p>Ein zurückgestelltes Angebot wird nach der Bearbeitung immer zuerst zur Freigabe vorgelegt.</p>}
                {sicherheitsbestandFreigabeImDialog && <p className="form-error">
                    Die GF-Freigabe wurde automatisch gesetzt, da ein Artikel unter den Eisernen Bestand gerät.
                </p>}
                {preisabweichungFreigabeImDialog && <p className="form-error">
                    Die GF-Freigabe wurde automatisch gesetzt, weil die Abweichung zur Artikelsumme den Grenzwert von {Number(optionen.angebotGfFreigabeAbweichungProzent || 10).toFixed(1)} % erreicht oder überschreitet.
                </p>}
            </div>
            {draft.fehler && <p className="form-error">{draft.fehler}</p>}
        </Dialog>
        {approvalOffer && <OfferApprovalDialog
            open={approvalOpen}
            title="Angebot prüfen"
            onClose={schliesseFreigabeDialog}
            kunde={getCustomerName(approvalOffer.kundeId, approvalOffer.kunde)}
            vorgangId={approvalOffer.vorgangId || ""}
            status={approvalOffer.freigabeText || approvalOffer.status}
            currentOfferLabel={approvalOffer.angebotsNr}
            currentOfferAmount={`${gesamtNachAbzug(approvalOffer.positionen, approvalOffer.preispositionen || [], approvalOffer.rabattBetrag).toFixed(2)} EUR`}
            currentOfferNote={approvalOffer.verguenstigungsGrund || ""}
            discountLabel={Number(approvalOffer.rabattBetrag || 0) > 0 ? `${Number(approvalOffer.rabattBetrag || 0).toFixed(2)} EUR` : "Keine"}
            totalAmountLabel={`${gesamtNachAbzug(approvalOffer.positionen, approvalOffer.preispositionen || [], approvalOffer.rabattBetrag).toFixed(2)} EUR`}
            onOpenCurrentOffer={() => angebotAlsPdf(approvalOffer)}
            positionInfos={(approvalOffer.positionen || []).map((position, index) => {
                const verfuegbarkeit = getVerfuegbarkeitFuerPosition(position);
                return {
                    id: `${position.leistungTyp || "position"}-${position.artikelId || position.serviceId || index}`,
                    label: String(position.artikel || "Position"),
                    quantityLabel: `${Number(position.menge || 0)} x ${Number(position.einzelpreis || 0).toFixed(2)} EUR`,
                    lineTotal: `${(Number(position.menge || 0) * Number(position.einzelpreis || 0)).toFixed(2)} EUR`,
                    availabilityText: verfuegbarkeit.text,
                    isCritical: verfuegbarkeit.istKritisch
                };
            })}
            previousOffers={getOffersForVorgang(approvalOffer.vorgangId, angebote)
                .filter(item => String(item.id) !== String(approvalOffer.id))
                .sort((a, b) => Number(a.revision || 0) - Number(b.revision || 0))
                .map(item => ({
                    id: item.id,
                    label: item.angebotsNr,
                    onClick: () => angebotAlsPdf(item)
                }))}
            messages={listNachrichtenZuVorgang(approvalOffer.vorgangId || "")}
            noteValue={approvalNote}
            onNoteChange={setApprovalNote}
            onApprove={() => angebotFreigeben(approvalOffer)}
            onApproveForTagesversand={() => angebotFreigeben(approvalOffer, true)}
            onRevise={() => angebotZurUeberarbeitungBearbeiten(approvalOffer)}
            onReject={() => angebotInternAblehnen(approvalOffer)}
            onForward={() => angebotAnGfWeiterleiten(approvalOffer)}
        />}
    </>;
}
