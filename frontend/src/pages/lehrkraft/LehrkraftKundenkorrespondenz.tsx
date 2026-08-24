import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import ThreadChatDialog from "../../components/ThreadChatDialog";
import { PERMISSIONS } from "../../constants/permissions";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import SaveButton from "../../components/SaveButton";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import angeboteService from "../../services/verkauf/angeboteService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import kundenService from "../../services/verkauf/customerService";
import nachrichtenService, { listNachrichtenZuVorgang } from "../../services/verkauf/nachrichtenService";
import { angebotInAuftragUebernehmen } from "../../services/verkauf/verkaufService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import { addDaysToIsoDate, formatTimestampForDisplay, getBerlinDate, getBerlinTimestamp } from "../../utils/dateTime";
import { openDocumentPdf } from "../../utils/documentPdf";
import zahlungenService from "../../services/buchhaltung/zahlungenService";
import { getPaymentOpenItemStatus, isPendingPayment } from "../../utils/openItems";
import { getOfferForOrder, getOffersForVorgang, getOrdersForVorgang, getProcessContextForDocument, getSalesDocumentsForVorgang, getVorgangId } from "../../utils/processFlow";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";
import { useLehrkraftAutomationen } from "../../hooks/useLehrkraftAutomationen";

const jetzt = () => getBerlinTimestamp();
const OFFER_OPEN_STATUSES = ["wartet auf antwort"];

function naechsteKundennummer(kunden = []) {
    const basis = kunden.reduce((maxWert, item) => {
        const match = String(item.kundenNr || "").match(/(\d+)$/);
        return Math.max(maxWert, Number(match?.[1] || 0));
    }, 10000);
    return `DB${String(basis + 1).padStart(5, "0")}`;
}

const FILTER_OPTIONS = {
    anfragen: [
        { value: "offen", label: "Offen", defaultSelected: true },
        { value: "in bearbeitung", label: "In Bearbeitung", defaultSelected: true },
        { value: "beantwortet", label: "Beantwortet", defaultSelected: true },
        { value: "erledigt", label: "Erledigt", defaultSelected: true },
        { value: "archiviert", label: "Archiviert", defaultSelected: false }
    ],
    angebote: [
        { value: "in vorbereitung", label: "In Vorbereitung", defaultSelected: false },
        { value: "wartet auf antwort", label: "Wartet auf Antwort", defaultSelected: true },
        { value: "wiedervorlage", label: "Wiedervorlage", defaultSelected: true },
        { value: "angenommen", label: "Angenommen", defaultSelected: false },
        { value: "abgelehnt", label: "Abgelehnt", defaultSelected: false },
        { value: "beendet", label: "Beendet", defaultSelected: false }
    ],
    zahlungen: [
        { value: "offen", label: "Offen", defaultSelected: true },
        { value: "ueberfaellig", label: "Überfällig", defaultSelected: true },
        { value: "geplant", label: "Geplant", defaultSelected: true },
        { value: "ausgefuehrt", label: "Ausgeführt", defaultSelected: false },
        { value: "bezahlt", label: "Bezahlt", defaultSelected: false }
    ],
    warenannahme: [
        { value: "offen", label: "Offen", defaultSelected: true },
        { value: "in bearbeitung", label: "In Bearbeitung", defaultSelected: true },
        { value: "versendet", label: "Versendet", defaultSelected: false },
        { value: "entgegengenommen", label: "Entgegengenommen", defaultSelected: true }
    ]
};

const STATUS_HELP = {
    anfragen: [
        { label: "Offen", text: "Die Anfrage ist aktiv und wartet auf eine Rückmeldung oder weitere Bearbeitung." },
        { label: "Beantwortet", text: "Es wurde geantwortet, der Vorgang bleibt aber sichtbar." },
        { label: "In Bearbeitung", text: "Die Anfrage wird aktuell intern weiterverarbeitet." },
        { label: "Erledigt", text: "Der fachliche Teil ist abgeschlossen, aber noch nicht archiviert." },
        { label: "Archiviert", text: "Der Vorgang ist abgeschlossen und zählt nicht mehr zu den offenen Fällen." }
    ],
    angebote: [
        { label: "In Vorbereitung", text: "Das Angebot wird intern vorbereitet und zählt noch nicht zu den offenen Angeboten beim Kunden." },
        { label: "Wartet auf Antwort", text: "Das Angebot liegt dem Kunden vor und wartet auf Rückmeldung." },
        { label: "Wiedervorlage", text: "Der Kunde bittet darum, das Angebot zu einem späteren Prüfdatum erneut vorzulegen." },
        { label: "Angenommen", text: "Der Kunde hat das Angebot akzeptiert." },
        { label: "Abgelehnt", text: "Der Kunde hat das Angebot nicht angenommen." },
        { label: "Beendet", text: "Das Angebot ist abgeschlossen und für die weitere Bearbeitung nicht mehr aktiv." }
    ],
    zahlungen: [
        { label: "Offen", text: "Die Zahlung ist fällig oder angelegt, aber noch nicht erledigt." },
        { label: "Überfällig", text: "Der geplante Termin ist überschritten." },
        { label: "Geplant", text: "Die Zahlung ist terminiert, aber noch nicht ausgeführt." },
        { label: "Ausgeführt", text: "Die Zahlung wurde ausgelöst oder verbucht." },
        { label: "Bezahlt", text: "Die Position ist komplett ausgeglichen." }
    ],
    warenannahme: [
        { label: "Offen", text: "Die Warenannahme oder Bescheinigung ist noch nicht abgeschlossen." },
        { label: "In Bearbeitung", text: "Das Dokument oder der Vorgang wird aktuell bearbeitet." },
        { label: "Versendet", text: "Die Unterlage wurde versendet und wartet auf Rückmeldung der Lehrkraft." },
        { label: "Entgegengenommen", text: "Die Ware oder Unterlage wurde von der Lehrkraft bestätigt angenommen." }
    ],
    laufendeAufträge: [
        { label: "Übersicht", text: "Dieser Tab zeigt laufende Aufträge nur zur Einsicht und nicht als offenen Handlungsbedarf." }
    ]
};

function getDefaultFilterState() {
    return Object.fromEntries(
        Object.entries(FILTER_OPTIONS).map(([key, options]) => [
            key,
            options.filter(option => option.defaultSelected).map(option => option.value)
        ])
    );
}

function normalizeStatus(value: string) {
    return String(value || "").toLowerCase();
}

function createInquiryVorgangId() {
    return `anfrage-temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAnfrageDraft(defaultKundeId = "") {
    return {
        typ: "Angebotswunsch",
        kundeId: defaultKundeId,
        kanal: "E-Mail",
        betreff: "",
        anliegen: "",
        neuerKundeName: "",
        ansprechpartnerId: "__none__",
        neuerAnsprechpartnerName: "",
        neuerAnsprechpartnerAbteilung: ""
    };
}

function sortByRevisionAscending(a: any, b: any) {
    return Number(a.revision || 0) - Number(b.revision || 0);
}

function sortByRevisionDescending(a: any, b: any) {
    return Number(b.revision || 0) - Number(a.revision || 0);
}

function getThreadMessages(threadItem: any, fallbackDate: string) {
    if (!threadItem) return [];
    const vorgangId = getVorgangId(threadItem);
    const nachrichten = listNachrichtenZuVorgang(vorgangId);
    const hatVerkaufAntwort = nachrichten.some(item => item.senderRolle === "Verkauf");

    if (!hatVerkaufAntwort && threadItem.antwort) {
        return [...nachrichten, {
            id: `synthetic-verkauf-${threadItem.id || threadItem.anfrageId || vorgangId}`,
            datum: threadItem.beantwortetAm || threadItem.datum || fallbackDate,
            zeitpunkt: `${threadItem.beantwortetAm || threadItem.datum || fallbackDate}T12:00:00`,
            senderRolle: "Verkauf",
            senderName: "Schülerfirma Verkauf",
            betreff: "Antwort der Schülerfirma",
            nachricht: threadItem.antwort
        }].sort((a, b) => String(a.zeitpunkt || a.datum).localeCompare(String(b.zeitpunkt || b.datum)));
    }

    return nachrichten;
}

function MultiStatusFilter({ options, selectedValues, onToggle }) {
    const [open, setOpen] = useState(false);
    const safeSelectedValues = selectedValues || [];
    const activeCount = safeSelectedValues.length;

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
                        checked={safeSelectedValues.includes(option.value)}
                        onChange={() => onToggle(option.value)}
                    />
                    <span>{option.label}</span>
                </label>)}
            </div>}
        </div>
    );
}

export default function LehrkraftKundenkorrespondenz() {
    const today = getBerlinDate();
    useLehrkraftAutomationen();
    const syncTick = useDataSyncRefresh(["kundenanfragen", "nachrichten", "angebote", "auftraege", "vertriebsdokumente", "zahlungen", "kunden"]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState("anfragen");
    const [selectedStatuses, setSelectedStatuses] = useState(getDefaultFilterState);
    const [createOpen, setCreateOpen] = useState(false);
    const [threadOpen, setThreadOpen] = useState(false);
    const [threadItem, setThreadItem] = useState<any>(null);
    const [customerReplyText, setCustomerReplyText] = useState("");
    const [wiedervorlageTage, setWiedervorlageTage] = useState(7);
    const [current, setCurrent] = useState(() => createAnfrageDraft());
    const anfragen = useMemo(() => customerInquiryService.list(), [refreshKey, syncTick]);
    const dokumente = useMemo(() => vertriebsdokumenteService.list(), [refreshKey, syncTick]);
    const kunden = useMemo(() => kundenService.list(), [refreshKey, syncTick]);
    const angebote = useMemo(() => angeboteService.getAll(), [refreshKey, syncTick]);
    const zahlungen = useMemo(() => zahlungenService.list(), [refreshKey, syncTick]);
    const auftraege = useMemo(() => auftraegeService.getAll(), [refreshKey, syncTick]);
    const kundenOptionen = useMemo(
        () => kunden.map(item => ({ value: String(item.id), label: `${item.kundenNr} - ${item.firma}` })),
        [kunden]
    );
    const nutztNeuenKunden = String(current.kundeId || "") === "__neu__";
    const ausgewaehlterKunde = useMemo(
        () => kunden.find(item => String(item.id) === String(current.kundeId || "")) || null,
        [current.kundeId, kunden]
    );
    const ansprechpartnerOptionen = useMemo(() => {
        const basis = [
            { value: "__none__", label: "---" },
            ...((ausgewaehlterKunde?.ansprechpartner || []).map(item => ({
                value: String(item.id),
                label: `${item.name}${item.abteilung ? ` - ${item.abteilung}` : ""}`
            }))),
            { value: "__new__", label: "Neuer Ansprechpartner" }
        ];
        return basis;
    }, [ausgewaehlterKunde]);
    const nutztNeuenAnsprechpartner = String(current.ansprechpartnerId || "") === "__new__";

    const zufaelligenAnsprechpartnerWaehlen = () => {
        const kontakte = ausgewaehlterKunde?.ansprechpartner || [];
        if (kontakte.length === 0) {
            setCurrent(item => ({ ...item, ansprechpartnerId: "__none__" }));
            return;
        }
        const zufall = kontakte[Math.floor(Math.random() * kontakte.length)];
        setCurrent(item => ({ ...item, ansprechpartnerId: String(zufall.id) }));
    };

    const refreshPageData = () => {
        setRefreshKey(current => current + 1);
    };

    const angeboteZuVorgang = (vorgangId: string) => getOffersForVorgang(vorgangId, angebote).sort(sortByRevisionAscending);

    const aktuellesAngebotZuVorgang = (vorgangId: string) => angeboteZuVorgang(vorgangId)
        .slice()
        .sort(sortByRevisionDescending)[0] || null;

    const alleAngebote = useMemo(
        () => angebote.map(item => ({
            ...item,
            statusNormalized: normalizeStatus(item.status)
        }))
            .sort((a, b) => String(b.datum).localeCompare(String(a.datum))),
        [angebote]
    );

    const offeneWarenannahmen = useMemo(
        () => dokumente
            .filter(item => ["lieferschein", "warenbegleitpapier", "transportpapier"].includes(normalizeStatus(item.dokumentTyp)))
            .map(item => ({
            ...item,
            statusNormalized: normalizeStatus(item.status) || "offen"
            })),
        [dokumente]
    );

    const zahlungenDaten = useMemo(
        () => zahlungen
            .filter(item => item.zahlungsart !== "Ausgang")
            .map(item => ({
            ...item,
            referenz: item.rechnungsnr || item.bestellNr || "-",
            bezugTyp: item.rechnungId ? "Rechnung" : item.bestellungId ? "Bestellung" : "-",
            statusSicht: getPaymentOpenItemStatus(item) === "bezahlt" ? "ausgefuehrt" : getPaymentOpenItemStatus(item),
            statusNormalized: normalizeStatus(getPaymentOpenItemStatus(item) === "bezahlt" ? "ausgefuehrt" : getPaymentOpenItemStatus(item))
            })),
        [zahlungen]
    );

    const anfragenDaten = useMemo(
        () => anfragen.map(item => {
            const ersteNachricht = listNachrichtenZuVorgang(getVorgangId(item))[0] || null;
            return {
                ...item,
                betreff: ersteNachricht?.betreff || item.typ || "-",
                statusNormalized: normalizeStatus(item.status)
            };
        }),
        [anfragen]
    );

    const toggleStatus = (tabKey, value) => {
        setSelectedStatuses(currentState => {
            const currentValues = currentState[tabKey] || [];
            const exists = currentValues.includes(value);
            return {
                ...currentState,
                [tabKey]: exists ? currentValues.filter(entry => entry !== value) : [...currentValues, value]
            };
        });
    };

    const gefilterteAnfragen = useMemo(
        () => anfragenDaten.filter(item => (selectedStatuses.anfragen || []).includes(item.statusNormalized)),
        [anfragenDaten, selectedStatuses]
    );
    const gefilterteAngebote = useMemo(
        () => alleAngebote.filter(item => (selectedStatuses.angebote || []).includes(item.statusNormalized)),
        [alleAngebote, selectedStatuses]
    );
    const gefilterteZahlungen = useMemo(
        () => zahlungenDaten.filter(item => (selectedStatuses.zahlungen || []).includes(item.statusNormalized)),
        [zahlungenDaten, selectedStatuses]
    );
    const gefilterteWarenannahmen = useMemo(
        () => offeneWarenannahmen.filter(item => (selectedStatuses.warenannahme || []).includes(item.statusNormalized)),
        [offeneWarenannahmen, selectedStatuses]
    );

    const laufendeAufträge = useMemo(
        () => auftraege
            .filter(item => ["offen", "abgerechnet"].includes(normalizeStatus(item.status)))
            .map(item => ({
                ...item,
                auftragNr: item.auftragNr || "-",
                kunde: item.kunde || "-",
                status: item.status || "-",
                gesamtbetrag: item.gesamtbetrag || 0,
                positionenText: (item.positionen || []).map(position => `${position.artikel} (${position.menge})`).join(", ")
            }))
            .sort((a, b) => String(b.datum || "").localeCompare(String(a.datum || ""))),
        [auftraege]
    );

    const dashboardTabs = useMemo(
        () => [
            { key: "anfragen", label: "Offene Anfragen", value: anfragenDaten.filter(item => item.statusNormalized !== "archiviert").length },
            { key: "angebote", label: "Offene Angebote", value: alleAngebote.filter(item => OFFER_OPEN_STATUSES.includes(item.statusNormalized)).length },
            { key: "laufendeAufträge", label: "Laufende Aufträge", value: laufendeAufträge.length, note: "kein Handlungsbedarf" },
            { key: "warenannahme", label: "Offene Warenannahme", value: offeneWarenannahmen.filter(item => !["versendet", "entgegengenommen"].includes(item.statusNormalized)).length },
            { key: "zahlungen", label: "Offene Zahlungen", value: zahlungen.filter(item => item.zahlungsart !== "Ausgang" && isPendingPayment(item)).length }
        ],
        [alleAngebote, anfragenDaten, offeneWarenannahmen, zahlungen, laufendeAufträge.length]
    );

    useEffect(() => {
        if (!threadItem?.id) return;

        const aktuelleAnfrage = anfragen.find(item => String(item.id) === String(threadItem.id));
        if (aktuelleAnfrage) {
            setThreadItem(aktuelleAnfrage);
            return;
        }

        const aktuellesAngebot = angebote.find(item => String(item.id) === String(threadItem.id));
        if (aktuellesAngebot) setThreadItem(aktuellesAngebot);
    }, [anfragen, angebote, threadItem]);

    const neueAnfrage = () => {
        setCurrent(createAnfrageDraft(String(kunden[0]?.id || "")));
        setCreateOpen(true);
    };

    const anfrageSpeichern = () => {
        const betreff = current.betreff.trim();
        const anliegen = current.anliegen.trim();
        if (!betreff || !anliegen) return false;

        const bestehenderKunde = kunden.find(item => item.id === Number(current.kundeId));
        const kunde = nutztNeuenKunden
            ? kundenService.create({
                kundenNr: naechsteKundennummer(kundenService.getAll()),
                firma: current.neuerKundeName.trim(),
                anschrift: "",
                plz: "",
                ort: "",
                segment: "",
                abc: "Unbestimmt",
                iban: "",
                website: "",
                optionen: [],
                notiz: "Von der Lehrkraft direkt bei der ersten Anfrage angelegt.",
                ansprechpartner: []
            })
            : bestehenderKunde;

        if (!kunde || (nutztNeuenKunden && !current.neuerKundeName.trim())) return false;
        const vorhandeneKontakte = Array.isArray(kunde.ansprechpartner) ? kunde.ansprechpartner : [];
        const ausgewaehlterKontakt = vorhandeneKontakte.find(item => String(item.id) === String(current.ansprechpartnerId || ""));
        const neuerKontakt = nutztNeuenAnsprechpartner && current.neuerAnsprechpartnerName.trim()
            ? {
                id: `kp-${Date.now()}`,
                name: current.neuerAnsprechpartnerName.trim(),
                abteilung: current.neuerAnsprechpartnerAbteilung.trim()
            }
            : null;
        if (neuerKontakt) {
            kundenService.update({
                ...kunde,
                ansprechpartner: [...vorhandeneKontakte, neuerKontakt]
            });
        }
        const kontakt = neuerKontakt || ausgewaehlterKontakt || null;
        const vorgangId = createInquiryVorgangId();
        const neueAnfrage = customerInquiryService.create({
            typ: current.typ,
            kundeId: kunde.id,
            kanal: current.kanal,
            status: "offen",
            datum: today,
            anliegen,
            vorgangId,
            ansprechpartnerName: kontakt?.name || "",
            ansprechpartnerAbteilung: kontakt?.abteilung || ""
        });
        nachrichtenService.create({
            vorgangId,
            anfrageId: neueAnfrage.id,
            angebotId: "",
            kundeId: kunde.id,
            datum: today,
            zeitpunkt: jetzt(),
            senderRolle: "Kunde",
            senderName: kunde.firma,
            kanal: current.kanal,
            betreff,
            nachricht: anliegen,
            typ: "Anfrage",
            ansprechpartnerName: kontakt?.name || "",
            ansprechpartnerAbteilung: kontakt?.abteilung || ""
        });
        refreshPageData();
        return true;
    };

    const vorgangOeffnen = (row: any) => {
        setThreadItem(row);
        setCustomerReplyText("");
        setWiedervorlageTage(7);
        setThreadOpen(true);
    };

    const archivieren = (row: any) => {
        customerInquiryService.update({
            ...row,
            status: "archiviert"
        });
        refreshPageData();
    };

    const kundenrueckmeldungSpeichern = () => {
        if (!threadItem || !customerReplyText.trim()) return;
        const vorgangId = getVorgangId(threadItem);
        if (!vorgangId) return;
        nachrichtenService.create({
            vorgangId,
            anfrageId: threadItem.anfrageId || threadItem.id || "",
            angebotId: threadItem.angebotId || "",
            kundeId: threadItem.kundeId || "",
            auftragId: threadItem.auftragId || "",
            datum: today,
            zeitpunkt: jetzt(),
            senderRolle: "Kunde",
            senderName: threadItem.kunde,
            kanal: threadItem.kanal || "E-Mail",
            betreff: "Kundenrückmeldung",
            nachricht: customerReplyText.trim(),
            typ: "Antwort"
        });
        const anfrageId = threadItem.anfrageId || threadItem.id;
        const anfrage = customerInquiryService.list().find(item => String(item.id) === String(anfrageId));
        if (anfrage) {
            customerInquiryService.update({
                ...anfrage,
                status: "offen"
            });
        }
        refreshPageData();
        setCustomerReplyText("");
    };

    const entscheidungVorbereiten = (angebot: any, mode: "angenommen" | "abgelehnt" | "beendet") => {
        if (!angebot) return;
        const vorbereiteteNachricht = mode === "angenommen"
             ? `Wir möchten das Angebot ${angebot.angebotsNr} gerne annehmen.`
            : mode === "abgelehnt"
                 ? `Wir möchten das Angebot ${angebot.angebotsNr} leider ablehnen.`
                : `Wir möchten die Verhandlung zu ${angebot.angebotsNr} hiermit beenden.`;
        setThreadItem(angebot);
        setCustomerReplyText(vorbereiteteNachricht);
        setThreadOpen(true);
    };

    const wiedervorlageVorbereiten = (angebot: any) => {
        if (!angebot) return;
        const tage = Math.max(1, Number(wiedervorlageTage || 0));
        const pruefdatum = addDaysToIsoDate(today, tage);
        setThreadItem(angebot);
        setCustomerReplyText(`Geben Sie uns das Angebot ${angebot.angebotsNr} wenn möglich in ${tage} Tagen zur Wiedervorlage. Wir prüfen es dann erneut und melden uns bei Ihnen.`);
        setThreadOpen(true);
    };

    const dokumentVersenden = (row: any) => {
        vertriebsdokumenteService.update(row.id, {
            ...row,
            status: "versendet",
            versendetAm: today
        });
        refreshPageData();
    };

    const warenannahmeBestaetigen = (row: any) => {
        vertriebsdokumenteService.update(row.id, {
            ...row,
            status: "entgegengenommen",
            annahmeAm: today
        });
        refreshPageData();
    };

    const angebotAlsPdf = (angebot: any) => {
        const verlaufAngebote = angeboteZuVorgang(angebot.vorgangId)
            .slice()
            .sort(sortByRevisionDescending);
        const neuestesAngebot = verlaufAngebote[0] || angebot;
        const aeltereVersionen = verlaufAngebote.slice(1);
        const verlaufNachrichten = getThreadMessages(angebot, today);
        openDocumentPdf({
            title: `Angebot ${neuestesAngebot.angebotsNr}`,
            subject: "Aktueller Angebotsstand für die Lehrkraft. Seite 1 zeigt immer die neueste Version.",
            date: neuestesAngebot.datum,
            note: neuestesAngebot.verguenstigungsGrund || "Kein zusätzlicher Hinweis hinterlegt.",
            referenceLabel: "Angebot",
            referenceValue: neuestesAngebot.angebotsNr,
            partnerLabel: "Kunde",
            partnerValue: neuestesAngebot.kunde,
            positions: neuestesAngebot.positionen || [],
            preispositionen: neuestesAngebot.preispositionen || [],
            deductionAmount: neuestesAngebot.rabattBetrag || 0,
            deductionReason: neuestesAngebot.verguenstigungsGrund || "",
            appendixPages: [
                ...aeltereVersionen.map((version) => ({
                    title: `Frühere Version ${version.angebotsNr}`,
                    subject: "Älterer Angebotsstand aus dem selben Verhandlungsvorgang.",
                    date: version.datum,
                    note: version.verguenstigungsGrund || "Kein zusätzlicher Hinweis hinterlegt.",
                    referenceLabel: "Angebot",
                    referenceValue: version.angebotsNr,
                    partnerLabel: "Kunde",
                    partnerValue: version.kunde,
                    positions: version.positionen || [],
                    preispositionen: version.preispositionen || [],
                    deductionAmount: version.rabattBetrag || 0,
                    deductionReason: version.verguenstigungsGrund || ""
                })),
                {
                    pageType: "history",
                    title: "Nachrichtenverlauf",
                    subject: "Kompletter Verhandlungs- und Nachrichtenverlauf zum Vorgang.",
                    date: neuestesAngebot.datum,
                    note: "Der Verlauf ist chronologisch sortiert.",
                    referenceValue: neuestesAngebot.vorgangId,
                    partnerLabel: "Kunde",
                    partnerValue: neuestesAngebot.kunde,
                    historyEntries: verlaufNachrichten.map((entry) => ({
                        date: formatTimestampForDisplay(entry.zeitpunkt || entry.datum),
                        label: `${entry.senderRolle}: ${entry.betreff}`,
                        text: entry.nachricht
                    }))
                }
            ]
        });
    };

    const vertriebsdokumentAlsPdf = (dokument: any) => {
        const { auftrag, angebot } = getProcessContextForDocument(dokument, auftraege, angebote, anfragen);
        openDocumentPdf({
            title: dokument.titel || dokument.dokumentTyp,
            subject: "Automatisch erzeugtes Vertriebsdokument für den Schulungseinsatz.",
            date: dokument.datum,
            note: dokument.notiz,
            referenceLabel: "Auftrag",
            referenceValue: auftrag?.auftragNr || dokument.auftragNr || "-",
            partnerLabel: "Kunde",
            partnerValue: dokument.kunde,
            positions: auftrag?.positionen || dokument.positionen || [],
            preispositionen: angebot?.preispositionen || auftrag?.preispositionen || dokument.preispositionen || [],
            deductionAmount: angebot?.rabattBetrag || auftrag?.rabattBetrag || 0,
            deductionReason: angebot?.verguenstigungsGrund || ""
        });
    };

    const vorgangAlsSammelPdf = (threadItem: any) => {
        if (!threadItem?.vorgangId) return;
        const vorgangAngebote = angeboteZuVorgang(threadItem.vorgangId);
        if (vorgangAngebote.length === 0) return;

        const neuestesAngebot = vorgangAngebote
            .slice()
            .sort((a, b) => Number(b.revision || 0) - Number(a.revision || 0))[0];
        const auftraegeZumVorgang = getOrdersForVorgang(threadItem.vorgangId, auftraege, angebote);
        const vertriebsdokumenteZumVorgang = getSalesDocumentsForVorgang(threadItem.vorgangId, dokumente, auftraege, angebote);

        openDocumentPdf({
            title: `Sammeldokument ${threadItem.vorgangId}`,
            subject: "Gebündelte Kontrollansicht aller erzeugten Dokumente und Nachrichten zum Vorgang.",
            date: neuestesAngebot.datum || today,
            note: "Die erste Seite zeigt das aktuellste Angebot. Danach folgen weitere Angebotsstände, Vertriebsdokumente und der Nachrichtenverlauf.",
            referenceLabel: "Vorgang",
            referenceValue: threadItem.vorgangId,
            partnerLabel: "Kunde",
            partnerValue: threadItem.kunde,
            positions: neuestesAngebot.positionen || [],
            preispositionen: neuestesAngebot.preispositionen || [],
            deductionAmount: neuestesAngebot.rabattBetrag || 0,
            deductionReason: neuestesAngebot.verguenstigungsGrund || "",
            appendixPages: [
                ...vorgangAngebote
                    .filter(item => String(item.id) !== String(neuestesAngebot.id))
                    .map(item => ({
                        title: `Angebot ${item.angebotsNr}`,
                        subject: "Weiterer Angebotsstand aus dem Vorgang.",
                        date: item.datum,
                        note: item.verguenstigungsGrund || item.status || "Kein zusätzlicher Hinweis hinterlegt.",
                        referenceLabel: "Angebot",
                        referenceValue: item.angebotsNr,
                        partnerLabel: "Kunde",
                        partnerValue: item.kunde,
                        positions: item.positionen || [],
                        preispositionen: item.preispositionen || [],
                        deductionAmount: item.rabattBetrag || 0,
                        deductionReason: item.verguenstigungsGrund || ""
                    })),
                ...vertriebsdokumenteZumVorgang.map(dokument => {
                    const auftrag = auftraegeZumVorgang.find(item => String(item.id) === String(dokument.auftragId));
                    const angebot = getOfferForOrder(auftrag, vorgangAngebote);
                    return {
                        title: dokument.titel || dokument.dokumentTyp,
                        subject: "Vertriebsdokument aus dem aktuellen Vorgang.",
                        date: dokument.datum,
                        note: dokument.notiz || dokument.status || "Kein zusätzlicher Hinweis hinterlegt.",
                        referenceLabel: "Auftrag",
                        referenceValue: auftrag?.auftragNr || dokument.auftragNr || "-",
                        partnerLabel: "Kunde",
                        partnerValue: dokument.kunde,
                        positions: auftrag?.positionen || [],
                        preispositionen: angebot?.preispositionen || auftrag?.preispositionen || [],
                        deductionAmount: angebot?.rabattBetrag || auftrag?.rabattBetrag || 0,
                        deductionReason: angebot?.verguenstigungsGrund || ""
                    };
                }),
                {
                    pageType: "history",
                    title: "Nachrichtenverlauf",
                    subject: "Chronologischer Verlauf für die Kontrolle des gesamten Vorgangs.",
                    date: today,
                    note: "Alle Nachrichten aus Lehrkraft-, Kunden- und Verkaufssicht.",
                    referenceValue: threadItem.vorgangId,
                    partnerLabel: "Kunde",
                    partnerValue: threadItem.kunde,
                    historyEntries: getThreadMessages(threadItem, today).map((entry) => ({
                        date: formatTimestampForDisplay(entry.zeitpunkt || entry.datum),
                        label: `${entry.senderRolle}: ${entry.betreff}`,
                        text: entry.nachricht
                    }))
                }
            ]
        });
    };

    const getVorgangDokumente = (vorgangId: string) => {
        const vorgangAngebote = angeboteZuVorgang(vorgangId);
        const angebotLinks = vorgangAngebote.map(item => ({
            id: `angebot-${item.id}`,
            label: `PDF Angebot ${item.angebotsNr}`,
            onClick: () => angebotAlsPdf(item)
        }));
        const vertriebsdokumentLinks = getSalesDocumentsForVorgang(vorgangId, dokumente, auftraege, angebote)
            .filter(dokument => {
                const typ = normalizeStatus(dokument.dokumentTyp);
                return typ.includes("auftragsbest") || typ.includes("lieferschein");
            })
            .map(dokument => ({
                id: `dokument-${dokument.id}`,
                label: `PDF ${dokument.dokumentTyp} ${dokument.auftragNr || ""}`.trim(),
                onClick: () => vertriebsdokumentAlsPdf(dokument)
            }));

        return [...angebotLinks, ...vertriebsdokumentLinks];
    };

    return <>
        <h1>Lehrkraft: Kundenkorrespondenz</h1>
        <p>Diese Seite ist der externe Gegenpart zum Verkauf. Hier erfasst die Lehrkraft Kundenanfragen und begleitet den Verhandlungsfaden, während der Verkauf anschließend intern Angebote und Aufträge weiterbearbeitet.</p>
        <div className="kennzahlen">
            {dashboardTabs.map(card => <button key={card.key} type="button" className={`kennzahl kennzahl-button${activeTab === card.key ? " is-active" : ""}`} onClick={() => setActiveTab(card.key)}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
            </button>)}
        </div>
        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Statushilfe</h2>
                <span>Lehrkraftsicht</span>
            </div>
            <ul className="dashboard-note-list">
        {STATUS_HELP[activeTab].map(item => <li key={item.label}><strong>{item.label}:</strong> {item.text}</li>)}
            </ul>
        </section>
        {activeTab === "anfragen" && <DataTable
            title="Kundenanfragen extern"
            toolbarContent={<MultiStatusFilter
                options={FILTER_OPTIONS.anfragen}
                selectedValues={selectedStatuses.anfragen || []}
                onToggle={value => toggleStatus("anfragen", value)}
            />}
            selectableColumns={false}
            data={gefilterteAnfragen}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "kanal", title: "Kanal" },
                { field: "betreff", title: "Betreff" },
                { field: "status", title: "Status" },
                { field: "anliegen", title: "Nachricht" }
            ]}
            detailLinkResolver={({ field, row }) => field === "kunde" && row.kundeId ? `/kunden?focus=${row.kundeId}` : null}
            toolbarActions={[{ name: "new", label: "Anfrage verfassen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: neueAnfrage }]}
            rowActions={[
                { name: "thread", label: "Nachrichten", permission: PERMISSIONS.GF_BEARBEITEN, onClick: vorgangOeffnen, variant: "secondary", isVisible: row => !!row.vorgangId && row.status !== "archiviert" },
                { name: "archive", label: "Archivieren", permission: PERMISSIONS.GF_BEARBEITEN, onClick: archivieren, variant: "secondary", isVisible: row => row.status !== "archiviert" }
            ]}
        />}

        {activeTab === "angebote" && <DataTable
            title="Angebote an Kunden"
            toolbarContent={<MultiStatusFilter
                options={FILTER_OPTIONS.angebote}
                selectedValues={selectedStatuses.angebote || []}
                onToggle={value => toggleStatus("angebote", value)}
            />}
            selectableColumns={false}
            data={gefilterteAngebote}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "angebotsNr", title: "Angebot", render: row => <Link className="detail-link" to={`/angebote?focus=${row.id}`}>{row.angebotsNr}</Link> },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "gueltigBis", title: "Gültig bis" },
                { field: "status", title: "Status" },
                { field: "gesamtbetrag", title: "Betrag" }
            ]}
            detailLinkResolver={({ field, row }) => {
                if (field === "angebotsNr") return `/angebote?focus=${row.id}`;
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                return null;
            }}
            rowActions={[
                { name: "thread", label: "Nachrichten", permission: PERMISSIONS.GF_BEARBEITEN, onClick: vorgangOeffnen, variant: "secondary", isVisible: row => !!row.vorgangId },
                { name: "pdf", label: "PDF", permission: PERMISSIONS.GF_BEARBEITEN, onClick: angebotAlsPdf, variant: "secondary" }
            ]}
        />}

        {activeTab === "zahlungen" && <DataTable
            title="Externe Zahlungen"
            toolbarContent={<MultiStatusFilter
                options={FILTER_OPTIONS.zahlungen}
                selectedValues={selectedStatuses.zahlungen || []}
                onToggle={value => toggleStatus("zahlungen", value)}
            />}
            selectableColumns={false}
            data={gefilterteZahlungen}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "bezugTyp", title: "Bezug" },
                { field: "referenz", title: "Referenz", render: row => row.rechnungId ? <Link className="detail-link" to={`/rechnungen?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link> : row.referenz },
                { field: "kunde", title: "Partner" },
                { field: "zahlungsart", title: "Art" },
                { field: "ausfuehrenAm", title: "Ausführen am" },
                { field: "betrag", title: "Betrag" },
                { field: "statusSicht", title: "Status" }
            ]}
            detailLinkResolver={({ field, row }) => field === "referenz" && row.rechnungId ? `/rechnungen?focus=${row.rechnungsnr}` : null}
        />}

        {activeTab === "warenannahme" && <DataTable
            title="Warenannahme / Transportbescheinigung"
            toolbarContent={<MultiStatusFilter
                options={FILTER_OPTIONS.warenannahme}
                selectedValues={selectedStatuses.warenannahme || []}
                onToggle={value => toggleStatus("warenannahme", value)}
            />}
            selectableColumns={false}
            data={gefilterteWarenannahmen}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "auftragNr", title: "Auftrag", render: row => row.auftragId ? <Link className="detail-link" to={`/auftraege?focus=${row.auftragId}`}>{row.auftragNr}</Link> : row.auftragNr },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "dokumentTyp", title: "Dokumenttyp" },
                { field: "status", title: "Status" },
                { field: "versendetAm", title: "Versendet am", render: row => row.versendetAm || "-" },
                { field: "annahmeAm", title: "Annahmedatum", render: row => row.annahmeAm || "-" }
            ]}
            detailLinkResolver={({ field, row }) => {
                if (field === "auftragNr" && row.auftragId) return `/auftraege?focus=${row.auftragId}`;
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                return null;
            }}
            rowActions={[
                { name: "send", label: "Versenden", permission: PERMISSIONS.GF_BEARBEITEN, onClick: dokumentVersenden, variant: "secondary", isVisible: row => row.status !== "versendet" && row.status !== "entgegengenommen" },
                { name: "accept", label: "Ware annehmen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: warenannahmeBestaetigen, variant: "success", isVisible: row => row.status === "versendet" }
            ]}
        />}

        {activeTab === "laufendeAufträge" && <>
            <section className="module-panel">
                <div className="dashboard-panel-header">
                    <h2>Laufende Aufträge</h2>
                    <span>Keine Handlungsbedarfsliste, nur Übersicht</span>
                </div>
                <p>Dieser Tab dient nur der Einsicht in alle aktuell laufenden Aufträge aus Lehrkraftsicht.</p>
            </section>
            <DataTable
                title="Alle laufenden Aufträge"
                selectableColumns={false}
                data={laufendeAufträge}
                columns={[
                    { field: "datum", title: "Datum" },
                    { field: "auftragNr", title: "Auftrag", render: row => <Link className="detail-link" to={`/auftraege?focus=${row.id}`}>{row.auftragNr}</Link> },
                    { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                    { field: "status", title: "Status" },
                    { field: "gesamtbetrag", title: "Betrag" },
                    { field: "positionenText", title: "Positionen" }
                ]}
                detailLinkResolver={({ field, row }) => {
                    if (field === "auftragNr") return `/auftraege?focus=${row.id}`;
                    if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                    return null;
                }}
            />
        </>}

        <Dialog
            open={createOpen}
            title="Kundenanfrage erfassen"
            onClose={() => setCreateOpen(false)}
            footer={<SaveButton onSave={anfrageSpeichern} onSuccess={() => setCreateOpen(false)}>Speichern</SaveButton>}
        >
            <div><Label>Typ</Label><select value={current.typ} onChange={event => setCurrent(value => ({ ...value, typ: event.target.value }))}><option>Produktanfrage</option><option>Angebotswunsch</option><option>Support</option><option>Sonstiges</option></select></div>
            <div><Label>Als Kunde</Label><LookupField value={current.kundeId} options={[{ value: "__neu__", label: "Neuer Kunde..." }, ...kundenOptionen]} onChange={value => setCurrent(item => ({ ...item, kundeId: value }))} placeholder="Kunde suchen..."/></div>
            {nutztNeuenKunden && <div><Label>Name des neuen Kunden</Label><TextField value={current.neuerKundeName} onChange={value => setCurrent(item => ({ ...item, neuerKundeName: value }))}/></div>}
            {!nutztNeuenKunden && <div>
                <Label>Ansprechpartner</Label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                        <LookupField
                            value={current.ansprechpartnerId}
                            options={ansprechpartnerOptionen}
                            onChange={value => setCurrent(item => ({ ...item, ansprechpartnerId: value }))}
                            placeholder="Ansprechpartner auswählen..."
                        />
                    </div>
                    <button
                        type="button"
                        className="button-secondary"
                        style={{ width: "2.5rem", minWidth: "2.5rem", padding: "0.5rem" }}
                        onClick={zufaelligenAnsprechpartnerWaehlen}
                        title="Zufällige Person wählen"
                    >
                        🎲
                    </button>
                </div>
            </div>}
            {!nutztNeuenKunden && nutztNeuenAnsprechpartner && <>
                <div><Label>Name</Label><TextField value={current.neuerAnsprechpartnerName} onChange={value => setCurrent(item => ({ ...item, neuerAnsprechpartnerName: value }))}/></div>
                <div><Label>Abteilung</Label><TextField value={current.neuerAnsprechpartnerAbteilung} onChange={value => setCurrent(item => ({ ...item, neuerAnsprechpartnerAbteilung: value }))}/></div>
            </>}
            <div><Label>Kanal</Label><TextField value={current.kanal} onChange={value => setCurrent(item => ({ ...item, kanal: value }))}/></div>
            <div><Label required>Betreff</Label><TextField value={current.betreff} onChange={value => setCurrent(item => ({ ...item, betreff: value }))}/></div>
            <div className="form-row"><Label required>Anliegen</Label><TextArea rows={4} value={current.anliegen} onChange={value => setCurrent(item => ({ ...item, anliegen: value }))}/></div>
        </Dialog>

        {threadItem && <ThreadChatDialog
            open={threadOpen}
            title="Verhandlungsfaden der Lehrkraftsicht"
            onClose={() => setThreadOpen(false)}
            vorgangId={threadItem.vorgangId}
            kundeLabel={threadItem.kunde}
            statusLabel={threadItem.status}
            anliegen={threadItem.anliegen}
            offers={angeboteZuVorgang(threadItem.vorgangId)}
            messages={getThreadMessages(threadItem, today)}
            ownRole="Kunde"
            offerHrefResolver={item => `/angebote?focus=${item.id}`}
            documentLinks={getVorgangDokumente(threadItem.vorgangId)}
            headerActionLink={{ id: "combined-pdf", label: "Alles in einem Dokument", onClick: () => vorgangAlsSammelPdf(threadItem) }}
            actionLinks={aktuellesAngebotZuVorgang(threadItem.vorgangId) && OFFER_OPEN_STATUSES.includes(normalizeStatus(aktuellesAngebotZuVorgang(threadItem.vorgangId).status)) ? [
                { id: "accept-offer", label: "Annehmen", onClick: () => entscheidungVorbereiten(aktuellesAngebotZuVorgang(threadItem.vorgangId), "angenommen") },
                { id: "reject-offer", label: "Ablehnen", onClick: () => entscheidungVorbereiten(aktuellesAngebotZuVorgang(threadItem.vorgangId), "abgelehnt") },
                { id: "end-negotiation", label: "Verhandlung beenden", onClick: () => entscheidungVorbereiten(aktuellesAngebotZuVorgang(threadItem.vorgangId), "beendet") }
            ] : []}
            customActionSection={aktuellesAngebotZuVorgang(threadItem.vorgangId) && OFFER_OPEN_STATUSES.includes(normalizeStatus(aktuellesAngebotZuVorgang(threadItem.vorgangId).status)) ? <div
                className="thread-document-link"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "6px 10px", borderRadius: "8px", fontSize: "13px" }}
            >
                    <span>Wiedervorlage in</span>
                    <input
                        type="number"
                        min={1}
                        value={wiedervorlageTage}
                        onChange={event => setWiedervorlageTage(Math.max(1, Number(event.target.value || 1)))}
                        style={{ width: "4rem", padding: "2px 6px", borderRadius: "6px", border: "1px solid #bfdbfe", background: "#fff" }}
                    />
                    <button
                        type="button"
                        className="thread-inline-link"
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() => wiedervorlageVorbereiten(aktuellesAngebotZuVorgang(threadItem.vorgangId))}
                    >
                        Tagen
                    </button>
            </div> : null}
            actionSectionLabel="Textvorlagen"
            replyLabel="Nachricht aus Kundensicht"
            replyValue={customerReplyText}
            replyPlaceholder="Antwort, Nachfrage oder Kommentar aus Sicht des Kunden dokumentieren..."
            onReplyChange={setCustomerReplyText}
            onReplySend={kundenrueckmeldungSpeichern}
            showReplyBox={threadItem.status !== "archiviert"}
         />}
    </>;
}
