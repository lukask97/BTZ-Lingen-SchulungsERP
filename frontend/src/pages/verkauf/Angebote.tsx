// @ts-nocheck
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
import { formatTimestampForDisplay, getBerlinDate } from "../../utils/dateTime";
import { getSalesStep, getSalesStepLabel } from "../../utils/processFlow";
import { openDocumentPdf } from "../../utils/documentPdf";

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
const plusTage = tage => {
    const basis = new Date(`${heute}T12:00:00`);
    basis.setDate(basis.getDate() + tage);
    return basis.toISOString().slice(0, 10);
};
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

function getDefaultStatusFilter() {
    return STATUS_FILTER_OPTIONS.filter(option => option.defaultSelected).map(option => option.value);
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
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState("laufend");
    const [open, setOpen] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState(getDefaultStatusFilter);
    const [sourceInquiryId, setSourceInquiryId] = useState("");
    const [kundeId, setKundeId] = useState("");
    const [leistungId, setLeistungId] = useState("");
    const [menge, setMenge] = useState(1);
    const [positionenDraft, setPositionenDraft] = useState([]);
    const [gueltigBis, setGueltigBis] = useState(plusTage(14));
    const [rabattBetrag, setRabattBetrag] = useState(0);
    const [verguenstigungsGrund, setVerguenstigungsGrund] = useState("");
    const [fehler, setFehler] = useState("");
    const [angebotsNrDraft, setAngebotsNrDraft] = useState("");
    const [bearbeiter, setBearbeiter] = useState("");
    const [selectedTemplateOfferId, setSelectedTemplateOfferId] = useState("");
    const [direktSenden, setDirektSenden] = useState(false);

    const angebote = useMemo(() => angeboteService.getAll(), [refreshKey]);
    const auftraege = auftraegeService.getAll();
    const vertriebsdokumente = vertriebsdokumenteService.list();
    const versandauftraege = versandService.list();
    const anfragen = customerInquiryService.list();
    const kunden = kundenService.list();
    const benutzer = benutzerService.list();
    const artikel = artikelService.getAll().filter(item => item.istVerkaeuflich);
    const services = servicesService.getAll();
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
    const findeAnfrage = anfrageId => anfragen.find(item => String(item.id) === String(anfrageId));
    const newMode = searchParams.get("new");
    const inquiryIdFromQuery = searchParams.get("anfrageId") || "";
    const kundeIdFromQuery = searchParams.get("kundeId") || "";
    const templateOfferIdFromQuery = searchParams.get("templateOfferId") || "";
    const defaultKundeId = String(kunden[0]?.id || "");
    const defaultLeistungId = leistungen[0] ? `${leistungen[0].leistungTyp}:${leistungen[0].id}` : "";
    const istErfahrenerVerkaeufer = useMemo(() => {
        const rolle = normalizeText(user?.rolle || user?.username || user?.name || "");
        return Boolean(
            user?.permissions?.includes("*")
            || rolle.includes("admin")
            || rolle.includes("senior")
            || rolle.includes("leitung")
            || rolle.includes("erfahren")
        );
    }, [user]);
    const brauchtFreigabe = !istErfahrenerVerkaeufer;

    const sendeAngebotAnKunden = (angebot) => {
        if (!angebot?.anfrageId) return;
        const anfrage = findeAnfrage(angebot.anfrageId);
        if (!anfrage) return;
        const text = `Wir senden Ihnen das Angebot ${angebot.angebotsNr} zur Pruefung zu.`;

        nachrichtenService.create({
            vorgangId: angebot.vorgangId || anfrage.vorgangId || `anfrage-${anfrage.id}`,
            anfrageId: anfrage.id,
            angebotId: angebot.id,
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
        const inquiry = findeAnfrage(anfrageId);
        const vorgangId = inquiry?.vorgangId || (anfrageId ? `anfrage-${anfrageId}` : "");
        const revisionInfo = naechsteAngebotsrevision(vorgangId || `angebot-${Date.now()}`);
        const templateOffer = templateOfferId ? angeboteService.getById(templateOfferId) : null;
        const templatePositionen = (templateOffer?.positionen || []).map(position => ({ ...position }));

        setSourceInquiryId(anfrageId);
        setKundeId(kunde || inquiry?.kundeId ? String(kunde || inquiry?.kundeId) : defaultKundeId);
        setLeistungId(defaultLeistungId);
        setMenge(1);
        setPositionenDraft(templatePositionen);
        setGueltigBis(templateOffer?.gueltigBis || plusTage(14));
        setRabattBetrag(Number(templateOffer?.rabattBetrag || 0));
        setVerguenstigungsGrund(templateOffer?.verguenstigungsGrund || "");
        setFehler("");
        setAngebotsNrDraft(`${revisionInfo.angebotsBasisNr}.${revisionInfo.revision}`);
        setBearbeiter(String(benutzer[0]?.username || benutzer[0]?.id || ""));
        setSelectedTemplateOfferId(String(templateOfferId || ""));
        setDirektSenden(brauchtFreigabe);
        setOpen(true);
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
        { field: "status", title: "Status" },
        { field: "freigabeText", title: "Freigabe" },
        { field: "anliegenText", title: "Anliegen" },
        { field: "prozess", title: "Prozess" },
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
                anliegenText: findeAnfrage(angebot.anfrageId)?.anliegen || "-",
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

    const anfrageImDialog = findeAnfrage(sourceInquiryId);
    const chatNachrichten = anfrageImDialog?.vorgangId ? listNachrichtenZuVorgang(anfrageImDialog.vorgangId) : [];
    const weiterleitungsAusschnitt = chatNachrichten.slice(-3);
    const bearbeiterLabel = bearbeiterOptionen.find(item => item.value === String(bearbeiter))?.label || "Noch nicht zugewiesen";
    const bisherigeAngeboteImDialog = anfrageImDialog?.vorgangId
        ? angebote
            .filter(item => item.vorgangId === anfrageImDialog.vorgangId)
            .sort((a, b) => Number(a.revision || 0) - Number(b.revision || 0))
        : [];

    const positionHinzufuegen = () => {
        const auswahl = leistungen.find(item => `${item.leistungTyp}:${item.id}` === String(leistungId));
        if (!auswahl || Number(menge) <= 0) return;
        setPositionenDraft(vorherige => {
            const vorhanden = vorherige.find(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp);
            if (vorhanden) {
                return vorherige.map(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp
                    ? { ...item, menge: Number(item.menge) + Number(menge) }
                    : item);
            }
            return [...vorherige, {
                artikelId: auswahl.id,
                artikel: auswahl.name,
                artikelTyp: auswahl.artikelTyp,
                leistungTyp: auswahl.leistungTyp,
                serviceId: auswahl.leistungTyp === "Service" ? auswahl.id : "",
                menge: Number(menge),
                einzelpreis: auswahl.preis
            }];
        });
    };

    const speichern = () => {
        const kunde = kunden.find(item => String(item.id) === String(kundeId));
        const anfrage = findeAnfrage(sourceInquiryId);
        const vorgangId = anfrage?.vorgangId || (sourceInquiryId ? `anfrage-${sourceInquiryId}` : `angebot-${Date.now()}`);

        if (!kunde || positionenDraft.length === 0) {
            setFehler("Bitte einen Kunden und mindestens eine Position auswaehlen.");
            return;
        }

        const revisionInfo = naechsteAngebotsrevision(vorgangId);
        const sollDirektSenden = brauchtFreigabe ? true : direktSenden;
        const freigabeNoetig = brauchtFreigabe;
        const status = sollDirektSenden && !freigabeNoetig ? "wartet auf Antwort" : "in Vorbereitung";
        const neuesAngebot = angeboteService.add({
            angebotsNr: `${revisionInfo.angebotsBasisNr}.${revisionInfo.revision}`,
            angebotsBasisNr: revisionInfo.angebotsBasisNr,
            revision: revisionInfo.revision,
            vorgangId,
            anfrageId: sourceInquiryId || "",
            kundeId: kunde.id,
            kunde: kunde.firma,
            datum: heute,
            gueltigBis,
            rabattBetrag: Number(rabattBetrag || 0),
            verguenstigungsGrund: verguenstigungsGrund.trim(),
            gesamtbetrag: gesamtNachAbzug(positionenDraft, rabattBetrag),
            status,
            positionen: positionenDraft,
            bearbeiter,
            direktSendenGewuenscht: sollDirektSenden,
            freigabeStatus: freigabeNoetig ? "angefragt" : (sollDirektSenden ? "freigegeben" : "keine"),
            freigabeAngefragtVon: user?.username || bearbeiter,
            freigegebenVon: sollDirektSenden && !freigabeNoetig ? (user?.username || "") : ""
        });

        if (anfrage) {
            customerInquiryService.update({
                ...anfrage,
                kundeId: kunde.id,
                kunde: kunde.firma,
                vorgangId
            });
        }

        if (sollDirektSenden && !freigabeNoetig) {
            sendeAngebotAnKunden(neuesAngebot);
        }

        if (sourceInquiryId && anfrage?.vorgangId) {
            nachrichtenService.create({
                vorgangId: anfrage.vorgangId,
                anfrageId: anfrage.id,
                angebotId: "",
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
        setFehler("");
        setSelectedTemplateOfferId("");
        setDirektSenden(brauchtFreigabe);
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
        const anfrage = findeAnfrage(row.anfrageId);
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
            toolbarActions={[{ name: "new", label: "Neues Angebot", permission: "verkauf.bearbeiten", onClick: () => initialisiereDialog() }]}
            rowActions={[
                { name: "thread", label: "Zum Chat", permission: "verkauf.bearbeiten", onClick: zumChatNavigieren, variant: "secondary", isVisible: row => !!row.anfrageId },
                { name: "pdf", label: "PDF", permission: "verkauf.bearbeiten", onClick: angebotAlsPdf, variant: "secondary" },
                { name: "approve", label: "Freigabe", onClick: angebotFreigeben, variant: "success", isVisible: row => row.freigabeStatus === "angefragt" && istErfahrenerVerkaeufer }
            ]}
            detailLinkResolver={({ field, row, value }) => {
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                if (field === "anfrageId" && value) return `/kundenanfragen?focus=${value}`;
                return null;
            }}
        />
        <Dialog open={open} title={sourceInquiryId ? "Angebot aus Kundenanfrage erstellen" : "Neues Angebot"} onClose={handleClose}>
            {sourceInquiryId && anfrageImDialog && <div className="offer-forward-panel form-row">
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
                        <LookupField value={bearbeiter} options={bearbeiterOptionen} onChange={setBearbeiter} placeholder="Bearbeiter auswaehlen..."/>
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
            {sourceInquiryId && bisherigeAngeboteImDialog.length > 0 && <div className="form-row thread-template-section">
                <Label>Fruehere Angebote als Vorlage</Label>
                <p className="thread-template-hint">Bei Bedarf kann ein bisheriger Angebotsstand uebernommen und anschliessend geaendert werden.</p>
                <div className="thread-template-panel">
                    <div className="thread-document-links">
                        {bisherigeAngeboteImDialog.map(item => <button
                            key={`dialog-template-${item.id}`}
                            type="button"
                            className={`thread-document-link${String(selectedTemplateOfferId) === String(item.id) ? " is-active" : ""}`}
                            onClick={() => initialisiereDialog(sourceInquiryId, String(kundeId || anfrageImDialog.kundeId || ""), String(item.id))}
                        >
                            {item.angebotsNr} uebernehmen
                        </button>)}
                    </div>
                </div>
            </div>}
            <div className="form-row">
                <div><Label>Angebotsnummer</Label><input type="text" value={angebotsNrDraft} disabled/></div>
                <div><Label>Gueltig bis</Label><input type="date" value={gueltigBis} onChange={event => setGueltigBis(event.target.value)}/></div>
            </div>
            <div className="form-row bestellposition-hinzufuegen">
                <div><Label>Artikel / Service</Label><LookupField value={leistungId} options={leistungsOptionen} onChange={setLeistungId} placeholder="Artikel oder Service suchen..."/></div>
                <div><Label>Menge</Label><NumberField value={menge} min="1" onChange={wert => setMenge(Number(wert))}/></div>
                <button type="button" onClick={positionHinzufuegen}>Position hinzufuegen</button>
            </div>
            <div className="form-row">
                <Label>Angebotspositionen</Label>
                {positionenDraft.length === 0 ? <p>Noch keine Position vorhanden.</p> : <ul className="positionsliste">
                    {positionenDraft.map(position => <li key={`${position.leistungTyp}-${position.artikelId}`}>{position.artikel}: {position.menge} x {position.einzelpreis.toFixed(2)} EUR
                        <button type="button" className="link-button" onClick={() => setPositionenDraft(items => items.filter(item => !(item.artikelId === position.artikelId && item.leistungTyp === position.leistungTyp)))}>Entfernen</button>
                    </li>)}
                </ul>}
            </div>
            <div className="form-row">
                <div><Label>Verguenstigung</Label><NumberField value={rabattBetrag} min="0" step="0.01" format="currency" onChange={wert => setRabattBetrag(Number(wert || 0))}/></div>
            </div>
            <div className="form-row">
                <div><Label>Grund fuer Verguenstigung</Label><TextArea rows={2} value={verguenstigungsGrund} onChange={setVerguenstigungsGrund}/></div>
            </div>
            <div className="form-row offer-send-checkbox-row">
                <Checkbox checked={brauchtFreigabe ? true : direktSenden} onChange={setDirektSenden} disabled={brauchtFreigabe}>
                    direkt senden
                </Checkbox>
                <HelpHint text={istErfahrenerVerkaeufer ? "Das Angebot wird nach dem Speichern sofort an den Kunden gesendet." : "Vor dem Senden muss ein Verkauf Senior oder eine hoehere Rolle die Freigabe erteilen."} />
            </div>
            <div className="form-row"><strong>Gesamt: {gesamtNachAbzug(positionenDraft, rabattBetrag).toFixed(2)} EUR</strong></div>
            {fehler && <p className="form-error">{fehler}</p>}
            <div className="form-row"><button onClick={speichern}>Angebot speichern</button></div>
        </Dialog>
    </>;
}
