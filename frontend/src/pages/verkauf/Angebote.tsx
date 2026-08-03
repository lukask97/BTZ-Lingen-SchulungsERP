import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import useAuth from "../../auth/useAuth";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import HelpHint from "../../components/HelpHint";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import TextArea from "../../components/form/TextArea";
import Checkbox from "../../components/form/Checkbox";
import OverviewCards from "../../components/OverviewCards";
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
import { addDaysToIsoDate, formatTimestampForDisplay, getBerlinDate } from "../../utils/dateTime";
import { getInquiryForOffer, getOffersForVorgang, getSalesStep, getSalesStepLabel, getVorgangId } from "../../utils/processFlow";
import { openDocumentPdf } from "../../utils/documentPdf";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";
import { ACCESS, PERMISSIONS } from "../../constants/permissions";

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
    artikelTyp: typ === "Service" ? "Dienstleistung" : item.artikelTyp
});

function normalizeText(value = "") {
    return String(value || "").toLowerCase();
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
        einzelpreis: auswahl.preis
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
        einzelpreis: Number(position?.einzelpreis || 0)
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
    const [selectedStatuses, setSelectedStatuses] = useState(getDefaultStatusFilter);

    const canReadLogistik = hasAccess(ACCESS.LOGISTIK);

    const angebote = useMemo(() => angeboteService.getAll(), [refreshKey, syncTick]);
    const auftraege = auftraegeService.getAll();
    const vertriebsdokumente = vertriebsdokumenteService.list();
    const versandauftraege = canReadLogistik ? versandService.list() : [];
    const anfragen = customerInquiryService.list();
    const kunden = kundenService.list();
    const benutzer = benutzerService.list();
    const artikel = artikelService.getAll().filter(item => item.istVerkaeuflich);
    const services = servicesService.getAll();
    const verplanteMengen = useMemo(() => getVerplanteMengen(auftraege), [auftraege]);
    const leistungen = [
        ...artikel.map(item => toLeistung(item, "Artikel")),
        ...services.map(item => toLeistung(item, "Service"))
    ];
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
    const defaultBearbeiter = String(benutzer[0]?.username || benutzer[0]?.id || "");
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
            zeitpunkt: `${heute}T12:00:00`,
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

    useEffect(() => {
        if (newMode !== "fromInquiry") return;
        initialisiereDialog(inquiryIdFromQuery, kundeIdFromQuery, templateOfferIdFromQuery);
    }, [newMode, inquiryIdFromQuery, kundeIdFromQuery, templateOfferIdFromQuery, defaultLeistungId, brauchtFreigabe]);

    const angebotColumns = [
        { field: "angebotsNr", title: "Angebotsnummer" },
        { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
        { field: "datum", title: "Datum" },
        { field: "gueltigBis", title: "Gueltig bis", render: row => row.gueltigBis || "-" },
        { field: "status", title: "Status", helpText: "Zeigt, ob das Angebot intern vorbereitet wird, beim Kunden liegt oder bereits abgeschlossen ist." },
        { field: "freigabeText", title: "Freigabe", helpText: "Zeigt, ob fuer das Angebot noch eine Freigabe durch eine hoehere Rolle noetig ist." },
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
                freigabeText: angebot.freigabeStatus === "angefragt" ? "Freigabe offen" : (angebot.freigabeStatus === "freigegeben" ? "Freigegeben" : "-"),
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
    const weiterleitungsAusschnitt = chatNachrichten.slice(-3);
    const bearbeiterLabel = bearbeiterOptionen.find(item => item.value === String(draft.bearbeiter))?.label || "Noch nicht zugewiesen";
    const bisherigeAngeboteImDialog = anfrageImDialog?.vorgangId
        ? getOffersForVorgang(anfrageImDialog.vorgangId, angebote)
            .sort((a, b) => Number(a.revision || 0) - Number(b.revision || 0))
        : [];

    const getVerfuegbarkeitFuerPosition = position => {
        if (position.leistungTyp === "Service") {
            return {
                text: "Service ohne Lagerbestand",
                istKritisch: false
            };
        }

        const artikelEintrag = artikel.find(item => String(item.id) === String(position.artikelId));
        const bestand = Number(artikelEintrag?.bestand || 0);
        const verplant = Number(verplanteMengen[String(position.artikelId)] || 0);
        const verfuegbar = bestand - verplant;

        return {
            text: `Verfuegbar: ${verfuegbar} | Bestand: ${bestand} | Verplant: ${verplant}`,
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

        const revisionInfo = naechsteAngebotsrevision(vorgangId);
        const sollDirektSenden = brauchtFreigabe ? true : draft.direktSenden;
        const freigabeNoetig = brauchtFreigabe;
        const status = sollDirektSenden && !freigabeNoetig ? "wartet auf Antwort" : "in Vorbereitung";
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
            direktSendenGewuenscht: sollDirektSenden,
            freigabeStatus: freigabeNoetig ? "angefragt" : (sollDirektSenden ? "freigegeben" : "keine"),
            freigabeAngefragtVon: user?.username || draft.bearbeiter,
            freigegebenVon: sollDirektSenden && !freigabeNoetig ? (user?.username || "") : ""
        });

        if (anfrage) {
            customerInquiryService.update({
                ...anfrage,
                kundeId: kunde.id,
                vorgangId
            });
        }

        if (sollDirektSenden && !freigabeNoetig) {
            sendeAngebotAnKunden(neuesAngebot);
        }

        if (draft.sourceInquiryId && anfrage?.vorgangId) {
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
            freigegebenVon: user?.username || user?.name || "verkauf",
            status: angebot.direktSendenGewuenscht ? "wartet auf Antwort" : (angebot.status || "in Vorbereitung")
        };
        angeboteService.update(aktualisiert);
        if (angebot.direktSendenGewuenscht) {
            sendeAngebotAnKunden(aktualisiert);
        }
        setRefreshKey(value => value + 1);
    };
    const dashboardTabs = [
        { key: "laufend", label: "Laufende Angebote", value: laufendeAngebote.length },
        { key: "freigabe", label: "Freizugebende Angebote", value: freizugebendeAngebote.length },
        { key: "alle", label: "Alle Angebote", value: neuesteAngebote.length }
    ];
    const sichtbareAngebote = activeTab === "freigabe"
        ? freizugebendeAngebote
        : activeTab === "alle"
            ? alleAngebote
            : laufendeAngebote;
    const tableTitle = activeTab === "freigabe"
        ? "Freizugebende Angebote"
        : activeTab === "alle"
            ? "Alle Angebote"
            : "Laufende Angebote";

    return <>
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
                { name: "thread", label: "Zum Chat", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: zumChatNavigieren, variant: "secondary", isVisible: row => !!row.anfrageId },
                { name: "pdf", label: "PDF", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: angebotAlsPdf, variant: "secondary" },
                { name: "approve", label: "Freigabe", onClick: angebotFreigeben, variant: "success", isVisible: row => row.freigabeStatus === "angefragt" && istErfahrenerVerkaeufer }
            ]}
            detailLinkResolver={({ field, row, value }) => {
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                if (field === "anfrageId" && value) return `/kundenanfragen?focus=${value}`;
                return null;
            }}
        />
        <Dialog open={open} title={draft.sourceInquiryId ? "Angebot aus Kundenanfrage erstellen" : "Neues Angebot"} onClose={handleClose}>
            {draft.sourceInquiryId && anfrageImDialog && <div className="offer-forward-panel form-row">
                <div className="offer-forward-grid">
                    <div className="offer-forward-card">
                        <Label>Kunde</Label>
                        <p>{getCustomerName(anfrageImDialog.kundeId, anfrageImDialog.kunde)}</p>
                    </div>
                    <div className="offer-forward-card">
                        <Label>Anfrage-Nr.</Label>
                        <p>{anfrageImDialog.vorgangId || `anfrage-${anfrageImDialog.id}`}</p>
                    </div>
                    <div className="offer-forward-card">
                        <Label>Bearbeitet von</Label>
                        <LookupField value={draft.bearbeiter} options={bearbeiterOptionen} onChange={value => setDraft(item => ({ ...item, bearbeiter: value }))} placeholder="Bearbeiter auswaehlen..."/>
                    </div>
                </div>
                <div className="offer-forward-card">
                    <Label>Chat-Ausschnitt zum Nachlesen</Label>
                    {weiterleitungsAusschnitt.length === 0 ? <p>Noch keine weiterleitbaren Nachrichten vorhanden.</p> : <div className="offer-forward-thread">
                        {weiterleitungsAusschnitt.map(nachricht => <article key={nachricht.id} className="offer-forward-message">
                            <div className="offer-forward-message-meta">
                                <strong>{nachricht.senderName || nachricht.senderRolle}</strong>
                                <span>{formatTimestampForDisplay(nachricht.zeitpunkt || nachricht.datum)} | {nachricht.betreff}</span>
                            </div>
                            <p>{nachricht.nachricht}</p>
                        </article>)}
                    </div>}
                </div>
            </div>}
            {draft.sourceInquiryId && bisherigeAngeboteImDialog.length > 0 && <div className="form-row thread-template-section">
                <div className="thread-template-panel">
                    <div className="offer-forward-card">
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
            <div className="form-row">
                <div><Label>Angebotsnummer</Label><input type="text" value={draft.angebotsNrDraft} disabled/></div>
                <div><Label glossaryKey="gueltigbis">Gueltig bis</Label><input type="date" value={draft.gueltigBis} onChange={event => setDraft(item => ({ ...item, gueltigBis: event.target.value }))}/></div>
            </div>
            <div className="form-row bestellposition-hinzufuegen">
                <div><Label>Artikel / Service</Label><LookupField value={draft.leistungId} options={leistungsOptionen} onChange={value => setDraft(item => ({ ...item, leistungId: value }))} placeholder="Artikel oder Service suchen..."/></div>
                <div><Label glossaryKey="angebotspositionen">Menge</Label><NumberField value={draft.menge} min="1" onChange={wert => setDraft(item => ({ ...item, menge: Number(wert) }))}/></div>
                <button type="button" onClick={positionHinzufuegen}>Position hinzufuegen</button>
            </div>
            <div className="form-row">
                <Label glossaryKey="angebotspositionen">Angebotspositionen</Label>
                {draft.positionenDraft.length === 0 ? <p>Noch keine Position vorhanden.</p> : <ul className="positionsliste">
                    {draft.positionenDraft.map(position => {
                        const verfuegbarkeit = getVerfuegbarkeitFuerPosition(position);
                        return <li key={`${position.leistungTyp}-${position.artikelId}`} className="position-entry">
                            <div>
                                <div>{position.artikel}: {position.menge} x {position.einzelpreis.toFixed(2)} EUR</div>
                                <p className={verfuegbarkeit.istKritisch ? "form-error" : "position-availability"}>
                                    {verfuegbarkeit.text}
                                </p>
                            </div>
                            <button type="button" className="link-button" onClick={() => setDraft(items => ({ ...items, positionenDraft: items.positionenDraft.filter(item => !(item.artikelId === position.artikelId && item.leistungTyp === position.leistungTyp)) }))}>Entfernen</button>
                        </li>;
                    })}
                </ul>}
            </div>
            <div className="form-row">
                <div><Label glossaryKey="rabatt">Verguenstigung</Label><NumberField value={draft.rabattBetrag} min="0" step="0.01" format="currency" onChange={wert => setDraft(item => ({ ...item, rabattBetrag: Number(wert || 0) }))}/></div>
            </div>
            <div className="form-row">
                <div><Label glossaryKey="rabatt">Grund fuer Verguenstigung</Label><TextArea rows={2} value={draft.verguenstigungsGrund} onChange={value => setDraft(item => ({ ...item, verguenstigungsGrund: value }))}/></div>
            </div>
            <div className="form-row offer-send-checkbox-row">
                <Checkbox checked={brauchtFreigabe ? true : draft.direktSenden} onChange={value => setDraft(item => ({ ...item, direktSenden: value }))} disabled={brauchtFreigabe}>
                    direkt senden
                </Checkbox>
                <HelpHint text={istErfahrenerVerkaeufer ? "Das Angebot wird nach dem Speichern sofort an den Kunden gesendet." : "Vor dem Senden muss ein Verkauf Senior oder eine hoehere Rolle die Freigabe erteilen."} />
            </div>
            <div className="form-row"><strong>Gesamt: {gesamtNachAbzug(draft.positionenDraft, draft.rabattBetrag).toFixed(2)} EUR</strong></div>
            {draft.fehler && <p className="form-error">{draft.fehler}</p>}
            <div className="form-row"><button onClick={speichern}>Angebot speichern</button></div>
        </Dialog>
    </>;
}
