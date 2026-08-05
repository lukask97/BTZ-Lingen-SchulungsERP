import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Fragment, useEffect, useMemo, useState } from "react";
import useAuth from "../../auth/useAuth";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import HelpHint from "../../components/HelpHint";
import OfferApprovalDialog from "../../components/OfferApprovalDialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import TextArea from "../../components/form/TextArea";
import Checkbox from "../../components/form/Checkbox";
import OverviewCards from "../../components/OverviewCards";
import SalesFlowBar from "../../components/SalesFlowBar";
import angeboteService, { naechsteAngebotsrevision } from "../../services/verkauf/angeboteService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import kundenService from "../../services/verkauf/customerService";
import benutzerService from "../../services/verwaltung/benutzerService";
import artikelService from "../../services/logistik/artikelService";
import servicesService from "../../services/verkauf/servicesService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import versandService from "../../services/logistik/versandService";
import { getCustomerName } from "../../utils/customerReferences";
import nachrichtenService, { listNachrichtenZuVorgang } from "../../services/verkauf/nachrichtenService";
import { addDaysToIsoDate, formatTimestampForDisplay, getBerlinDate, getBerlinTimestamp } from "../../utils/dateTime";
import { getInquiryForOffer, getOffersForVorgang, getSalesStep, getSalesStepLabel, getVorgangId } from "../../utils/processFlow";
import { openDocumentPdf } from "../../utils/documentPdf";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";
import { ACCESS, PERMISSIONS } from "../../constants/permissions";
import freigabenService from "../../services/gf/freigabenService";

const heute = getBerlinDate();
const gesamtNachAbzug = (positionen, rabattBetrag = 0) => Math.max(
    0,
    (positionen || []).reduce((summe, position) => summe + Number(position.menge) * Number(position.einzelpreis), 0) - Number(rabattBetrag || 0)
);
const istOffenesAngebot = angebot => ["wartet auf antwort"].includes(String(angebot?.status || "").toLowerCase());
const STATUS_FILTER_OPTIONS = [
    { value: "in vorbereitung", label: "In Vorbereitung", defaultSelected: true },
    { value: "wartet auf antwort", label: "Wartet auf Antwort", defaultSelected: true },
    { value: "angenommen", label: "Angenommen", defaultSelected: true },
    { value: "abgelehnt", label: "Abgelehnt", defaultSelected: true },
    { value: "beendet", label: "Beendet", defaultSelected: true }
];
const STATUS_HELP = [
    { label: "In Vorbereitung", text: "Das Angebot wird intern vorbereitet und zaehlt noch nicht zu den offenen Angeboten beim Kunden." },
    { label: "Wartet auf Antwort", text: "Das Angebot liegt dem Kunden vor und wartet auf Rueckmeldung." },
    { label: "Angenommen", text: "Der Kunde hat das Angebot akzeptiert." },
    { label: "Abgelehnt", text: "Der Kunde hat das Angebot nicht angenommen." },
    { label: "Beendet", text: "Das Angebot ist abgeschlossen und fuer die weitere Bearbeitung nicht mehr aktiv." }
];
const plusTage = tage => addDaysToIsoDate(heute, tage);
const AKTIVE_AUFTRAGSSTATUS = ["offen", "abgerechnet"];
const toLeistung = (item, typ) => ({
    id: item.id,
    leistungTyp: typ,
    nummer: typ === "Service" ? item.serviceNr : item.artikelNr,
    name: item.name,
    preis: Number(item.verkaufspreis ?? item.preis ?? 0),
    artikelTyp: typ === "Service" ? "Dienstleistung" : item.artikelTyp,
    berechnungstyp: typ === "Service" ? String(item.berechnungstyp || "Pauschal") : "",
    zeEinheit: typ === "Service" ? String(item.zeEinheit || "") : ""
});

function normalizeText(value = "") {
    return String(value || "").toLowerCase();
}

function getDialogMessageVariant(nachricht) {
    const rolle = String(nachricht?.senderRolle || "").toLowerCase();
    const betreff = String(nachricht?.betreff || "").toLowerCase();

    if (rolle.includes("kunde")) return "customer";
    if (betreff.includes("angebot") || betreff.includes("an kunden")) return "outbound";
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

function getAndereOffeneAngeboteMitArtikel(angebote, artikelId, currentPositionen = []) {
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

function getOpenOfferCountByArtikel(angebote = []) {
    return angebote
        .filter(angebot => istOffenesAngebot(angebot))
        .reduce((map, angebot) => {
            const artikelIds = new Set(
                (angebot.positionen || [])
                    .filter(position => String(position.leistungTyp || "").toLowerCase() !== "service" && position.artikelId)
                    .map(position => String(position.artikelId))
            );

            artikelIds.forEach(artikelId => {
                map[artikelId] = Number(map[artikelId] || 0) + 1;
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
        fehler: "",
        angebotsNrDraft: "",
        bearbeiter: defaultBearbeiter,
        selectedTemplateOfferId: "",
        direktSenden: brauchtFreigabe
    };
}

function createAngebotPositionDraft(auswahl, menge) {
    return {
        artikelId: auswahl.id,
        artikel: auswahl.name,
        artikelTyp: auswahl.artikelTyp,
        leistungTyp: auswahl.leistungTyp,
        serviceId: auswahl.leistungTyp === "Service" ? auswahl.id : "",
        menge: Number(menge),
        einzelpreis: auswahl.preis,
        berechnungstyp: auswahl.berechnungstyp || "",
        zeEinheit: auswahl.zeEinheit || ""
    };
}

function normalizeVorlagenPosition(position, leistungen = []) {
    const artikelId = position?.artikelId ?? position?.serviceId ?? position?.id ?? "";
    const auswahl = leistungen.find(item =>
        String(item.id) === String(artikelId)
        || String(item.name) === String(position?.artikel || position?.name || "")
    );

    if (auswahl) {
        return {
            ...createAngebotPositionDraft(auswahl, Number(position?.menge || 1)),
            einzelpreis: Number(position?.einzelpreis ?? auswahl.preis ?? 0)
        };
    }

    return {
        artikelId: artikelId || "",
        artikel: position?.artikel || position?.name || "Unbekannte Position",
        artikelTyp: position?.artikelTyp || "Einzelartikel",
        leistungTyp: position?.leistungTyp || "Artikel",
        serviceId: position?.serviceId || "",
        menge: Number(position?.menge || 1),
        einzelpreis: Number(position?.einzelpreis || 0),
        berechnungstyp: position?.berechnungstyp || "",
        zeEinheit: position?.zeEinheit || ""
    };
}

function cloneAngebotspositionen(positionen = [], leistungen = []) {
    return positionen.map(position => normalizeVorlagenPosition(position, leistungen));
}

function MultiStatusFilter({ options, selectedValues, onToggle }) {
    const [open, setOpen] = useState(false);
    const activeCount = selectedValues.length;

    return (
        <div className="multi-filter">
            <button type="button" className="multi-filter-trigger" onClick={() => setOpen(current => !current)}>
                Statusfilter ({activeCount})
            </button>
            {open && <div className="multi-filter-menu">
                <strong>Status anzeigen</strong>
                {options.map(option => <label key={option.value} className="multi-filter-option">
                    <input
                        type="checkbox"
                        checked={selectedValues.includes(option.value)}
                        onChange={() => onToggle(option.value)}
                    />
                    <span>{option.label}</span>
                </label>)}
            </div>}
        </div>
    );
}

export default function Angebote() {
    const syncTick = useStorageSyncRefresh([
        "angebote", "auftraege", "vertriebsdokumente", "versandauftraege",
        "kundenanfragen", "kunden", "benutzer", "artikel", "services", "nachrichten"
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
    const [selectedStatuses, setSelectedStatuses] = useState(getDefaultStatusFilter);

    const canReadLogistik = hasAccess(ACCESS.LOGISTIK);
    const canReadBenutzer = hasAccess(ACCESS.BENUTZER);

    const angebote = useMemo(() => withPermissionFallback(() => angeboteService.getAll(), []), [refreshKey, syncTick]);
    const auftraege = withPermissionFallback(() => auftraegeService.getAll(), []);
    const vertriebsdokumente = vertriebsdokumenteService.list();
    const versandauftraege = canReadLogistik ? versandService.list() : [];
    const anfragen = withPermissionFallback(() => customerInquiryService.list(), []);
    const kunden = withPermissionFallback(() => kundenService.list(), []);
    const benutzer = canReadBenutzer ? withPermissionFallback(() => benutzerService.list(), []) : [];
    const artikel = withPermissionFallback(() => artikelService.getAll(), []).filter(item => item.istVerkaeuflich);
    const services = withPermissionFallback(() => servicesService.getAll(), []);
    const verplanteMengen = useMemo(() => getVerplanteMengen(auftraege), [auftraege]);
    const leistungen = [
        ...artikel.map(item => toLeistung(item, "Artikel")),
        ...services.map(item => toLeistung(item, "Service"))
    ];
    const offeneAngeboteJeArtikel = useMemo(() => getOpenOfferCountByArtikel(angebote), [angebote]);
    const kundenOptionen = kunden.map(item => ({ value: String(item.id), label: `${item.kundenNr} - ${item.firma}` }));
    const bearbeiterOptionen = benutzer.map(item => ({ value: String(item.username || item.id), label: `${item.name || item.username} (${item.rolle || "Team"})` }));
    const leistungsOptionen = leistungen.map(item => ({
        value: `${item.leistungTyp}:${item.id}`,
        label: `${item.nummer} - ${item.name} (${item.preis.toFixed(2)} EUR)`
    }));
    const newMode = searchParams.get("new");
    const inquiryIdFromQuery = searchParams.get("anfrageId") || "";
    const kundeIdFromQuery = searchParams.get("kundeId") || "";
    const templateOfferIdFromQuery = searchParams.get("templateOfferId") || "";
    const defaultKundeId = String(kunden[0]?.id || "");
    const defaultLeistungId = leistungen[0] ? `${leistungen[0].leistungTyp}:${leistungen[0].id}` : "";
    const istErfahrenerVerkaeufer = useMemo(() => {
        const rolle = normalizeText(user?.rolle || user?.username || user?.name || "");
        return Boolean(
            hasFullAccess()
            || rolle.includes("admin")
            || rolle.includes("senior")
            || rolle.includes("leitung")
            || rolle.includes("erfahren")
        );
    }, [hasFullAccess, user]);
    const brauchtFreigabe = !istErfahrenerVerkaeufer;
    const defaultBearbeiter = String(user?.username || benutzer[0]?.username || benutzer[0]?.id || "");
    const [draft, setDraft] = useState(() => createAngebotDraft(defaultLeistungId, defaultBearbeiter, brauchtFreigabe));

    const sendeAngebotAnKunden = (angebot) => {
        if (!angebot?.anfrageId) return;
        const anfrage = getInquiryForOffer(angebot, anfragen);
        if (!anfrage) return;
        const text = `Wir senden Ihnen das Angebot ${angebot.angebotsNr} zur Pruefung zu.`;

        nachrichtenService.create({
            vorgangId: getVorgangId(angebot) || getVorgangId(anfrage),
            anfrageId: anfrage.id,
            angebotId: angebot.id,
            kundeId: angebot.kundeId || anfrage.kundeId || "",
            datum: heute,
            zeitpunkt: getBerlinTimestamp(),
            senderRolle: "Verkauf",
            senderName: "Schuelerfirma Verkauf",
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
        const inquiry = anfragen.find(item => String(item.id) === String(anfrageId));
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
            fehler: "",
            angebotsNrDraft: `${revisionInfo.angebotsBasisNr}.${revisionInfo.revision}`,
            bearbeiter: defaultBearbeiter,
            selectedTemplateOfferId: String(templateOfferId || ""),
            direktSenden: brauchtFreigabe
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
            fehler: "",
            angebotsNrDraft: angebot.angebotsNr || "",
            bearbeiter: String(angebot.bearbeiter || defaultBearbeiter),
            selectedTemplateOfferId: "",
            direktSenden: Boolean(angebot.direktSendenGewuenscht)
        });
        setOpen(true);
    };

    useEffect(() => {
        if (newMode !== "fromInquiry") return;
        initialisiereDialog(inquiryIdFromQuery, kundeIdFromQuery, templateOfferIdFromQuery);
    }, [newMode, inquiryIdFromQuery, kundeIdFromQuery, templateOfferIdFromQuery, defaultLeistungId, brauchtFreigabe]);

    const angebotColumns = [
        { field: "angebotsNr", title: "Angebotsnummer", render: row => <button type="button" className="thread-inline-link" onClick={event => {
            event.stopPropagation();
            angebotAlsPdf(row);
        }}>{row.angebotsNr}</button> },
        { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
        { field: "datum", title: "Datum" },
        { field: "gueltigBis", title: "Gueltig bis", render: row => row.gueltigBis || "-" },
        { field: "status", title: "Status", helpText: "Zeigt, ob das Angebot intern vorbereitet wird, beim Kunden liegt oder bereits abgeschlossen ist." },
        { field: "freigabeText", title: "Freigabe", helpText: "Zeigt, ob fuer das Angebot noch eine Freigabe durch eine hoehere Rolle noetig ist." },
        { field: "freigabeNotiz", title: "Notiz", helpText: "Zeigt Rueckmeldungen aus der internen Pruefung oder Hinweise zur Ueberarbeitung." },
        { field: "anliegenText", title: "Anliegen", helpText: "Kurzbeschreibung der urspruenglichen Kundenanfrage." },
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
                        ? "Weitergeleitet"
                        : angebot.freigabeStatus === "intern_abgelehnt"
                            ? "Zur Ueberarbeitung zurueckgegeben"
                            : angebot.freigabeStatus === "freigegeben"
                                ? "Freigegeben"
                                : "-",
                freigabeNotiz: angebot.freigabeNotiz || "-",
                kunde: getCustomerName(angebot.kundeId, angebot.kunde),
                anliegenText: getInquiryForOffer(angebot, anfragen)?.anliegen || "-",
                positionenText: (angebot.positionen || []).map(position => `${position.artikel} (${position.menge})`).join(", "),
                gesamt: `${gesamtNachAbzug(angebot.positionen, angebot.rabattBetrag).toFixed(2)} EUR`,
                prozess: getSalesStepLabel(getSalesStep(angebot, auftraege, vertriebsdokumente, versandauftraege))
            }))
            .sort((a, b) => String(b.datum || "").localeCompare(String(a.datum || "")));
    }, [angebote, anfragen, auftraege, vertriebsdokumente, versandauftraege]);

    const angebotAlsPdf = angebot => {
        openDocumentPdf({
            title: `Angebot ${angebot.angebotsNr}`,
            subject: "Automatisch erzeugtes Angebotsdokument fuer den Schulungseinsatz.",
            date: angebot.datum,
            note: angebot.verguenstigungsGrund || "Kein zusaetzlicher Hinweis hinterlegt.",
            referenceLabel: "Angebot",
            referenceValue: angebot.angebotsNr,
            partnerLabel: "Kunde",
            partnerValue: angebot.kunde,
            positions: angebot.positionen || [],
            deductionAmount: angebot.rabattBetrag || 0,
            deductionReason: angebot.verguenstigungsGrund || ""
        });
    };

    const anfrageImDialog = anfragen.find(item => String(item.id) === String(draft.sourceInquiryId));
    const chatNachrichten = anfrageImDialog?.vorgangId ? listNachrichtenZuVorgang(anfrageImDialog.vorgangId) : [];
    const weiterleitungsAusschnitt = chatNachrichten;
    const bearbeiterLabel = bearbeiterOptionen.find(item => item.value === String(draft.bearbeiter))?.label || "Noch nicht zugewiesen";
    const bisherigeAngeboteImDialog = anfrageImDialog?.vorgangId
        ? getOffersForVorgang(anfrageImDialog.vorgangId, angebote)
            .sort((a, b) => Number(a.revision || 0) - Number(b.revision || 0))
        : [];

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

        const artikelEintrag = artikel.find(item => String(item.id) === String(position.artikelId));
        const bestand = Number(artikelEintrag?.bestand || 0);
        const verplant = Number(verplanteMengen[String(position.artikelId)] || 0);
        const verfuegbar = bestand - verplant;
        const inAngeboten = Number(offeneAngeboteJeArtikel[String(position.artikelId)] || 0);

        return {
            text: `Verfuegbar: ${verfuegbar} | Bestand: ${bestand} | Verplant: ${verplant} | In Angeboten: ${inAngeboten}`,
            istKritisch: Number(position.menge || 0) > verfuegbar
        };
    };

    const positionHinzufuegen = () => {
        const auswahl = leistungen.find(item => `${item.leistungTyp}:${item.id}` === String(draft.leistungId));
        if (!auswahl || Number(draft.menge) <= 0) return;
        setDraft(vorherige => {
            const vorhanden = vorherige.positionenDraft.find(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp);
            return {
                ...vorherige,
                positionenDraft: vorhanden
                    ? vorherige.positionenDraft.map(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp
                        ? { ...item, menge: Number(item.menge) + Number(vorherige.menge) }
                        : item)
                    : [...vorherige.positionenDraft, createAngebotPositionDraft(auswahl, vorherige.menge)]
            };
        });
    };

    const speichern = () => {
        const kunde = kunden.find(item => String(item.id) === String(draft.kundeId));
        const anfrage = anfragen.find(item => String(item.id) === String(draft.sourceInquiryId));
        const vorgangId = getVorgangId(anfrage) || (draft.sourceInquiryId ? `anfrage-${draft.sourceInquiryId}` : `angebot-${Date.now()}`);

        if (!kunde || draft.positionenDraft.length === 0) {
            setDraft(current => ({ ...current, fehler: "Bitte einen Kunden und mindestens eine Position auswaehlen." }));
            return;
        }

        if (editingOfferId) {
            const bestehendesAngebot = angeboteService.getById(editingOfferId);
            if (!bestehendesAngebot) {
                setDraft(current => ({ ...current, fehler: "Das Angebot konnte nicht mehr gefunden werden." }));
                return;
            }

            angeboteService.update({
                ...bestehendesAngebot,
                kundeId: kunde.id,
                gueltigBis: draft.gueltigBis,
                rabattBetrag: Number(draft.rabattBetrag || 0),
                verguenstigungsGrund: draft.verguenstigungsGrund.trim(),
                gesamtbetrag: gesamtNachAbzug(draft.positionenDraft, draft.rabattBetrag),
                status: "in Vorbereitung",
                positionen: draft.positionenDraft,
                bearbeiter: draft.bearbeiter,
                direktSendenGewuenscht: false,
                freigabeStatus: "angefragt",
                freigabeNotiz: ""
            });

            nachrichtenService.create({
                vorgangId: bestehendesAngebot.vorgangId || vorgangId,
                anfrageId: bestehendesAngebot.anfrageId || draft.sourceInquiryId || "",
                angebotId: bestehendesAngebot.id,
                kundeId: kunde.id,
                datum: heute,
                zeitpunkt: getBerlinTimestamp(),
                senderRolle: "Verkauf",
                senderName: user?.name || user?.username || "Schuelerfirma Verkauf",
                betreff: `Angebot ${bestehendesAngebot.angebotsNr} ueberarbeitet`,
                nachricht: "Das Angebot wurde nach der internen Rueckmeldung ueberarbeitet und erneut zur Freigabe vorbereitet.",
                typ: "Interne Freigabe"
            });

            setRefreshKey(value => value + 1);
            handleClose();
            return;
        }

        const revisionInfo = naechsteAngebotsrevision(vorgangId);
        const freigabeDirektErteilen = brauchtFreigabe ? false : draft.direktSenden;
        const freigabeNoetig = !freigabeDirektErteilen;
        const status = freigabeDirektErteilen ? "wartet auf Antwort" : "in Vorbereitung";
        const neuesAngebot = angeboteService.add({
            angebotsNr: `${revisionInfo.angebotsBasisNr}.${revisionInfo.revision}`,
            angebotsBasisNr: revisionInfo.angebotsBasisNr,
            revision: revisionInfo.revision,
            vorgangId,
            anfrageId: draft.sourceInquiryId || "",
            kundeId: kunde.id,
            datum: heute,
            gueltigBis: draft.gueltigBis,
            rabattBetrag: Number(draft.rabattBetrag || 0),
            verguenstigungsGrund: draft.verguenstigungsGrund.trim(),
            gesamtbetrag: gesamtNachAbzug(draft.positionenDraft, draft.rabattBetrag),
            status,
            positionen: draft.positionenDraft,
            bearbeiter: draft.bearbeiter,
            direktSendenGewuenscht: freigabeDirektErteilen,
            freigabeStatus: freigabeNoetig ? "angefragt" : "freigegeben",
            freigabeAngefragtVon: user?.username || draft.bearbeiter,
            freigegebenVon: freigabeDirektErteilen ? (user?.username || "") : ""
        });

        if (anfrage) {
            customerInquiryService.update({
                ...anfrage,
                kundeId: kunde.id,
                vorgangId
            });
        }

        if (freigabeDirektErteilen && !freigabeNoetig) {
            sendeAngebotAnKunden(neuesAngebot);
        }

        if (draft.sourceInquiryId && anfrage?.vorgangId && !freigabeDirektErteilen) {
            nachrichtenService.create({
                vorgangId: anfrage.vorgangId,
                anfrageId: anfrage.id,
                angebotId: "",
                kundeId: anfrage.kundeId || kunde.id,
                datum: heute,
                senderRolle: "Verkauf",
                senderName: "Schuelerfirma Verkauf",
                betreff: `Interne Weiterleitung an ${bearbeiterLabel}`,
                nachricht: `Die Anfrage wurde intern an ${bearbeiterLabel} zur Angebotserstellung weitergeleitet.`,
                typ: "Interne Weiterleitung"
            });
        }

        setRefreshKey(value => value + 1);
        handleClose();
    };

    const handleClose = () => {
        setOpen(false);
        setEditingOfferId("");
        setDraft(current => ({ ...current, fehler: "", selectedTemplateOfferId: "", direktSenden: brauchtFreigabe }));
        if (newMode) {
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

    const laufendeAngebote = neuesteAngebote.filter(item => istOffenesAngebot(item));
    const freizugebendeAngebote = neuesteAngebote.filter(item => item.statusNormalized === "in vorbereitung");
    const ueberarbeitungen = neuesteAngebote.filter(item =>
        item.statusNormalized === "in vorbereitung" && String(item.freigabeStatus || "") === "intern_abgelehnt"
    );
    const freigabeOffenAngebote = freizugebendeAngebote.filter(item => !["intern_abgelehnt", "freigegeben"].includes(String(item.freigabeStatus || "")));
    const alleAngebote = neuesteAngebote.filter(item => selectedStatuses.includes(item.statusNormalized));
    const zumChatNavigieren = row => {
        const anfrage = getInquiryForOffer(row, anfragen);
        if (!anfrage) {
            navigate("/kundenanfragen");
            return;
        }
        navigate(`/kundenanfragen?focus=${anfrage.id}`);
    };
    const angebotFreigeben = (angebot) => {
        const aktualisiert = {
            ...angebot,
            freigabeStatus: "freigegeben",
            freigabeNotiz: approvalNote.trim() || angebot.freigabeNotiz || "",
            freigegebenVon: user?.username || user?.name || "verkauf",
            direktSendenGewuenscht: true,
            status: "wartet auf Antwort"
        };
        angeboteService.update(aktualisiert);
        if (aktualisiert.anfrageId) {
            sendeAngebotAnKunden(aktualisiert);
        }
        setRefreshKey(value => value + 1);
        setApprovalOpen(false);
        setApprovalOffer(null);
        setApprovalNote("");
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
            senderName: user?.name || user?.username || "Verkauf Senior",
            betreff: `Ueberarbeitung ${angebot.angebotsNr}`,
            nachricht: `Bitte Angebot ${angebot.angebotsNr} ueberarbeiten. Hinweis: ${approvalNote.trim()}`,
            typ: "Interne Freigabe"
        });
        setRefreshKey(value => value + 1);
        setApprovalOpen(false);
        setApprovalOffer(null);
        setApprovalNote("");
    };
    const angebotInternAblehnen = (angebot) => {
        angebotZurUeberarbeitungZurueckgeben(angebot, "in Vorbereitung", "intern_abgelehnt");
    };
    const angebotAnGfWeiterleiten = (angebot) => {
        if (!approvalNote.trim()) return;
        const offeneFreigabe = freigabenService.list().find(item => String(item.angebotId || "") === String(angebot.id) && item.status === "offen");
        const payload = {
            titel: `Freigabe ${angebot.angebotsNr}`,
            bereich: "verkauf",
            verantwortung: "Geschaeftsfuehrung",
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
        setApprovalOpen(false);
        setApprovalOffer(null);
        setApprovalNote("");
    };
    const freigabePruefen = (angebot) => {
        setApprovalOffer(angebot);
        setApprovalNote(String(angebot.freigabeNotiz || ""));
        setApprovalOpen(true);
    };
    const dashboardTabs = [
        { key: "laufend", label: "Laufende Angebote", value: laufendeAngebote.length },
        { key: "freigabe", label: "Freizugebende Angebote", value: freigabeOffenAngebote.length },
        { key: "ueberarbeitung", label: "Zur Ueberarbeitung zurueckgegeben", value: ueberarbeitungen.length },
        { key: "alle", label: "Alle Angebote", value: neuesteAngebote.length }
    ];
    const sichtbareAngebote = activeTab === "freigabe"
        ? freigabeOffenAngebote
        : activeTab === "ueberarbeitung"
            ? ueberarbeitungen
        : activeTab === "alle"
            ? alleAngebote
            : laufendeAngebote;
    const tableTitle = activeTab === "freigabe"
        ? "Freizugebende Angebote"
        : activeTab === "ueberarbeitung"
            ? "Zur Ueberarbeitung zurueckgegebene Angebote"
        : activeTab === "alle"
            ? "Alle Angebote"
            : "Laufende Angebote";

    return <>
        <SalesFlowBar currentStep="angebote"/>
        <div className="kennzahlen">
            {dashboardTabs.map(card => <button key={card.key} type="button" className={`kennzahl kennzahl-button${activeTab === card.key ? " is-active" : ""}`} onClick={() => setActiveTab(card.key)}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
            </button>)}
        </div>
        {activeTab === "alle" && <div className="dashboard-panel">
            <div className="dashboard-panel-header">
                <h2>Statushilfe Angebote</h2>
                <span>Verkauf</span>
            </div>
            <ul className="dashboard-note-list">
                {STATUS_HELP.map(item => <li key={item.label}><strong>{item.label}:</strong> {item.text}</li>)}
            </ul>
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
            /> : null}
            toolbarActions={[{ name: "new", label: "Neues Angebot", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: () => initialisiereDialog() }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: angebotBearbeiten, variant: "secondary", isVisible: row => activeTab === "ueberarbeitung" && String(row.freigabeStatus || "") === "intern_abgelehnt" },
                { name: "thread", label: "Chat", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: zumChatNavigieren, variant: "secondary", isVisible: row => !!row.anfrageId },
                { name: "approve", label: "Pruefen", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: freigabePruefen, variant: "success", isVisible: row => istErfahrenerVerkaeufer && row.statusNormalized === "in vorbereitung" && !["freigegeben", "intern_abgelehnt"].includes(String(row.freigabeStatus || "")) }
            ]}
            detailLinkResolver={({ field, row, value }) => {
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                if (field === "anfrageId" && value) return `/kundenanfragen?focus=${value}`;
                return null;
            }}
        />
        <Dialog open={open} title={editingOfferId ? "Angebot bearbeiten" : (draft.sourceInquiryId ? "Angebot aus Kundenanfrage erstellen" : "Neues Angebot")} onClose={handleClose}>
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
                        <LookupField value={draft.bearbeiter} options={bearbeiterOptionen} onChange={value => setDraft(item => ({ ...item, bearbeiter: value }))} placeholder="Bearbeiter auswaehlen..."/>
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
                        <Label glossaryKey="lieferantenvergleich">Fruehere Angebote als Vorlage</Label>
                        <p>Bei Bedarf kann ein bisheriger Angebotsstand uebernommen und anschliessend geaendert werden.</p>
                    </div>
                    <div className="thread-document-links">
                        {bisherigeAngeboteImDialog.map(item => <button
                            key={`dialog-template-${item.id}`}
                            type="button"
                            className={`thread-document-link${String(draft.selectedTemplateOfferId) === String(item.id) ? " is-active" : ""}`}
                            onClick={() => angebotAlsVorlageUebernehmen(String(item.id))}
                        >
                            {item.angebotsNr} uebernehmen
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
                    <div><Label glossaryKey="gueltigbis">Gueltig bis</Label><input type="date" value={draft.gueltigBis} onChange={event => setDraft(item => ({ ...item, gueltigBis: event.target.value }))}/></div>
                </div>
            </div>
            <div className="form-row thread-section">
                <div className="thread-section-header">
                    <Label>Position hinzufuegen</Label>
                </div>
                <div className="thread-form-grid thread-form-grid-actions">
                    <div><Label>Artikel / Service</Label><LookupField value={draft.leistungId} options={leistungsOptionen} onChange={value => setDraft(item => ({ ...item, leistungId: value }))} placeholder="Artikel oder Service suchen..."/></div>
                    <div><Label glossaryKey="angebotspositionen">Menge</Label><NumberField value={draft.menge} min="1" onChange={wert => setDraft(item => ({ ...item, menge: Number(wert) }))}/></div>
                    <button type="button" onClick={positionHinzufuegen}>Position hinzufuegen</button>
                </div>
            </div>
            <div className="form-row thread-section">
                <div className="thread-section-header">
                    <Label glossaryKey="angebotspositionen">Angebotspositionen</Label>
                </div>
                {draft.positionenDraft.length === 0 ? <p>Noch keine Position vorhanden.</p> : <div className="position-table-wrapper">
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
                            {draft.positionenDraft.map((position, index) => {
                                const verfuegbarkeit = getVerfuegbarkeitFuerPosition(position);
                                const leistung = leistungen.find(item =>
                                    String(item.id) === String(position.serviceId || position.artikelId || "")
                                    && String(item.leistungTyp || "") === String(position.leistungTyp || "")
                                );
                                const nummer = String(leistung?.nummer || position.artikelId || position.serviceId || "-");
                                return <Fragment key={`${position.leistungTyp}-${position.artikelId || position.serviceId || index}`}>
                                    <tr>
                                        <td>{nummer}</td>
                                        <td>{position.artikel}</td>
                                        <td className="position-table-quantity-cell">
                                            <NumberField
                                                value={position.menge}
                                                min="1"
                                                onChange={wert => setDraft(items => ({
                                                    ...items,
                                                    positionenDraft: items.positionenDraft.map(item => item.artikelId === position.artikelId && item.leistungTyp === position.leistungTyp
                                                        ? { ...item, menge: Number(wert || 1) }
                                                        : item
                                                    )
                                                }))}
                                            />
                                        </td>
                                        <td>{Number(position.einzelpreis || 0).toFixed(2)} EUR</td>
                                        <td>{(Number(position.menge || 0) * Number(position.einzelpreis || 0)).toFixed(2)} EUR</td>
                                        <td>
                                            <button type="button" className="link-button" onClick={() => setDraft(items => ({ ...items, positionenDraft: items.positionenDraft.filter(item => !(item.artikelId === position.artikelId && item.leistungTyp === position.leistungTyp)) }))}>Entfernen</button>
                                        </td>
                                    </tr>
                                    <tr className="position-table-detail-row">
                                        <td colSpan={6}>
                                            <p className={`position-availability${verfuegbarkeit.istKritisch ? " position-availability-critical" : ""}`}>
                                                {verfuegbarkeit.text}
                                            </p>
                                        </td>
                                    </tr>
                                </Fragment>;
                            })}
                        </tbody>
                    </table>
                </div>}
                <div className="thread-summary-card">
                    <Label>Kalkulationsuebersicht</Label>
                    <div className="thread-summary-lines">
                        <div><span>Zwischensumme</span><strong>{gesamtNachAbzug(draft.positionenDraft, 0).toFixed(2)} EUR</strong></div>
                        <div><span>Verguenstigung</span><strong>{Number(draft.rabattBetrag || 0).toFixed(2)} EUR</strong></div>
                        <div><span>Gesamtbetrag</span><strong>{gesamtNachAbzug(draft.positionenDraft, draft.rabattBetrag).toFixed(2)} EUR</strong></div>
                    </div>
                </div>
            </div>
            <div className="form-row thread-section">
                <div className="thread-section-header">
                    <Label>Preisgestaltung</Label>
                </div>
                <div className="thread-form-grid">
                    <div><Label glossaryKey="rabatt">Verguenstigung</Label><NumberField value={draft.rabattBetrag} min="0" step="0.01" format="currency" onChange={wert => setDraft(item => ({ ...item, rabattBetrag: Number(wert || 0) }))}/></div>
                    <div><Label glossaryKey="rabatt">Grund fuer Verguenstigung</Label><TextArea rows={2} value={draft.verguenstigungsGrund} onChange={value => setDraft(item => ({ ...item, verguenstigungsGrund: value }))}/></div>
                </div>
            </div>
            <div className="form-row thread-section">
                <div className="thread-section-header">
                    <Label>Freigabe</Label>
                </div>
                <div className="offer-send-checkbox-row">
                    <Checkbox checked={!brauchtFreigabe && draft.direktSenden} onChange={value => setDraft(item => ({ ...item, direktSenden: value }))} disabled={brauchtFreigabe}>
                        Freigabe direkt erteilen
                    </Checkbox>
                    <HelpHint text={istErfahrenerVerkaeufer ? "Mit Haken wird das Angebot sofort freigegeben und nach dem Speichern direkt an den Kunden gesendet." : "Fuer diese Rolle kann die Freigabe nicht direkt erteilt werden. Das Angebot geht nach dem Speichern in die Freigabe."} />
                </div>
                {!brauchtFreigabe && !draft.direktSenden && <p className="thread-template-hint">
                    Ohne Haken bleibt das Angebot in der internen Freigabe und wird noch nicht an den Kunden gesendet.
                </p>}
                {brauchtFreigabe && <p className="thread-template-hint">
                    Fuer diese Rolle wird das Angebot nach dem Speichern zur Freigabe vorgelegt.
                </p>}
            </div>
            {draft.fehler && <p className="form-error">{draft.fehler}</p>}
            <div className="form-row thread-section thread-dialog-footer">
                <div className="thread-section-header">
                    <Label>Aktionen</Label>
                </div>
                <div className="thread-document-links">
                    <button type="button" onClick={speichern}>{editingOfferId ? "Aenderungen speichern" : "Angebot speichern"}</button>
                </div>
            </div>
        </Dialog>
        {approvalOffer && <OfferApprovalDialog
            open={approvalOpen}
            title="Angebot pruefen"
            onClose={() => {
                setApprovalOpen(false);
                setApprovalOffer(null);
                setApprovalNote("");
            }}
            kunde={getCustomerName(approvalOffer.kundeId, approvalOffer.kunde)}
            vorgangId={approvalOffer.vorgangId || ""}
            status={approvalOffer.freigabeText || approvalOffer.status}
            currentOfferLabel={approvalOffer.angebotsNr}
            currentOfferAmount={`${gesamtNachAbzug(approvalOffer.positionen, approvalOffer.rabattBetrag).toFixed(2)} EUR`}
            currentOfferNote={approvalOffer.verguenstigungsGrund || ""}
            discountLabel={Number(approvalOffer.rabattBetrag || 0) > 0 ? `${Number(approvalOffer.rabattBetrag || 0).toFixed(2)} EUR` : "Keine"}
            totalAmountLabel={`${gesamtNachAbzug(approvalOffer.positionen, approvalOffer.rabattBetrag).toFixed(2)} EUR`}
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
            onRevise={() => angebotZurUeberarbeitungZurueckgeben(approvalOffer)}
            onReject={() => angebotInternAblehnen(approvalOffer)}
            onForward={() => angebotAnGfWeiterleiten(approvalOffer)}
        />}
    </>;
}
