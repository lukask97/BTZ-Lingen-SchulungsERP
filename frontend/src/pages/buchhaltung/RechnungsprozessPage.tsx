import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import ThreadChatDialog from "../../components/ThreadChatDialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import TextArea from "../../components/form/TextArea";
import OverviewCards from "../../components/OverviewCards";
import SaveButton from "../../components/SaveButton";
import HelpHint from "../../components/HelpHint";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import zahlungenService from "../../services/buchhaltung/zahlungenService";
import mahnungenService from "../../services/buchhaltung/mahnungenService";
import firmenkontoService from "../../services/buchhaltung/firmenkontoService";
import { isOpenItem } from "../../utils/openItems";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getBerlinDate } from "../../utils/dateTime";
import { canCreateReminder, canTransferToInkasso, evaluateIncomingPayment, getInvoiceSettlementSummary, getMahnlaufPhase, getNextMahnstufe } from "../../utils/accountingWorkflow";
import auftraegeService from "../../services/verkauf/auftraegeService";
import angeboteService from "../../services/verkauf/angeboteService";
import nachrichtenService, { listNachrichtenZuVorgang } from "../../services/verkauf/nachrichtenService";
import { getOfferForOrder, getVorgangId } from "../../utils/processFlow";

type PageMode = "eingang" | "ausgang";
type InvoiceMainTab = "offen" | "alle";
type InvoiceActionFilter = "alleoffenen" | "kundenhinweis" | "erinnerung" | "mahnbar1" | "mahnbar2" | "inkasso";

function getPageConfig(mode: PageMode) {
    if (mode === "eingang") {
        return {
            invoiceType: "Eingangsrechnung",
            pageTitle: "Eingangsrechnungen",
            invoiceTitleAll: "Alle Eingangsrechnungen",
            invoiceTitleOpen: "Offene Eingangsrechnungen",
            partnerLabel: "Lieferant",
            summaryHint: "Kreditoren"
        };
    }

    return {
        invoiceType: "Ausgangsrechnung",
        pageTitle: "Ausgangsrechnungen",
        invoiceTitleAll: "Alle Ausgangsrechnungen",
        invoiceTitleOpen: "Offene Ausgangsrechnungen",
        partnerLabel: "Kunde",
        summaryHint: "Debitoren"
    };
}

export default function RechnungsprozessPage({ mode }: { mode: PageMode }) {
    const today = getBerlinDate();
    const config = getPageConfig(mode);
    const [searchParams] = useSearchParams();
    const [syncTick] = useSyncedServiceData(
        ["zahlungen", "auftraege", "bestellungen", "kunden", "lieferanten", "mahnungen", "rechnungen", "firmenkonto"],
        () => ({ tick: Date.now() })
    );
    const [activeMainTab, setActiveMainTab] = useState<InvoiceMainTab>("offen");
    const [activeActionFilter, setActiveActionFilter] = useState<InvoiceActionFilter>("alleoffenen");
    const [assignOpen, setAssignOpen] = useState(false);
    const [selectedEntryId, setSelectedEntryId] = useState("");
    const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
    const [selectedSettlementDecision, setSelectedSettlementDecision] = useState("");
    const [decisionReason, setDecisionReason] = useState("");
    const [enteredDifferenceAmount, setEnteredDifferenceAmount] = useState(0);
    const [skontoConsidered, setSkontoConsidered] = useState(false);
    const [messageOpen, setMessageOpen] = useState(false);
    const [messageInvoiceId, setMessageInvoiceId] = useState("");
    const [customerNote, setCustomerNote] = useState("");

    const allInvoices = rechnungenService.list()
        .filter(item => item.rechnungstyp === config.invoiceType)
        .map(item => ({
            ...item,
            nextAction: item.nextAction,
            phase: getMahnlaufPhase(item, today)
        }));
    const openInvoices = allInvoices.filter(isOpenItem);
    const focusValue = searchParams.get("focus") || "";

    const isErinnerung = (rechnung: any) => getMahnlaufPhase(rechnung, today) === "zahlungserinnerung";
    const isMahnbar1 = (rechnung: any) => getMahnlaufPhase(rechnung, today) === "mahnbar1";
    const isMahnbar2 = (rechnung: any) => getMahnlaufPhase(rechnung, today) === "mahnbar2";
    const isInkasso = (rechnung: any) => getMahnlaufPhase(rechnung, today) === "inkasso";
    const customerMessageCases = useMemo(() => {
        if (mode !== "ausgang") return new Map<string, any>();

        const caseMap = new Map<string, any>();
        firmenkontoService.listSalesPaymentEntries()
            .filter(item =>
                String(item.statusBearbeitung || "").toLowerCase() === "bearbeitet"
                && (item.matchResult === "teilzahlung" || item.matchResult === "ueberzahlung")
                && item.rechnungId
                && !item.kundenhinweisGesendetAm
            )
            .forEach(item => {
                caseMap.set(String(item.rechnungId), item);
            });
        return caseMap;
    }, [mode, syncTick]);
    const invoiceNeedsCustomerMessage = (rechnung: any) => customerMessageCases.has(String(rechnung.id));

    const actionFilterOptions = [
        { key: "alleoffenen", label: "Alle offenen", value: openInvoices.length },
        { key: "kundenhinweis", label: "Kunden-Nachricht", value: allInvoices.filter(invoiceNeedsCustomerMessage).length },
        { key: "erinnerung", label: "Zahlungserinnerung", value: openInvoices.filter(isErinnerung).length },
        { key: "mahnbar1", label: "Mahnbar (1.)", value: openInvoices.filter(isMahnbar1).length },
        { key: "mahnbar2", label: "Mahnbar (2.)", value: openInvoices.filter(isMahnbar2).length },
        { key: "inkasso", label: "Inkasso", value: openInvoices.filter(isInkasso).length }
    ] as const;

    const visibleInvoices = useMemo(() => {
        if (mode === "eingang") return activeMainTab === "alle" ? allInvoices : openInvoices;
        if (activeMainTab === "alle") return allInvoices;

        const invoicePool = activeActionFilter === "kundenhinweis" ? allInvoices : openInvoices;
        return invoicePool.filter(rechnung => {
            if (activeActionFilter === "alleoffenen") return true;
            if (activeActionFilter === "kundenhinweis") return invoiceNeedsCustomerMessage(rechnung);
            if (activeActionFilter === "erinnerung") return isErinnerung(rechnung);
            if (activeActionFilter === "mahnbar1") return isMahnbar1(rechnung);
            if (activeActionFilter === "mahnbar2") return isMahnbar2(rechnung);
            if (activeActionFilter === "inkasso") return isInkasso(rechnung);
            return true;
        });
    }, [activeActionFilter, activeMainTab, allInvoices, mode, openInvoices, customerMessageCases]);

    const salesEntries = useMemo(() => {
        if (mode !== "ausgang") return [];

        const existingEntries = firmenkontoService.listSalesPaymentEntries();
        const entriesByPaymentId = new Map(
            existingEntries
                .filter(item => item.zahlungId)
                .map(item => [String(item.zahlungId), item])
        );

        return zahlungenService
            .list()
            .filter(item =>
                String(item.zahlungsart || "").toLowerCase() === "eingang"
                && String(item.status || "").toLowerCase() === "ausgefuehrt"
            )
            .map(item => {
                const existing = entriesByPaymentId.get(String(item.id));
                if (existing) return existing;

                return {
                    id: `payment-${item.id}`,
                    valuta: item.ausfuehrungsdatum || item.ausfuehrenAm || item.datum || "",
                    konto: "verkauf",
                    verwendungszweck: item.verwendungszweck || "Bankeingang aus Verkauf",
                    senderId: item.kundeId || "",
                    senderTyp: "kunde",
                    senderName: item.name || "",
                    senderIban: item.iban || "",
                    empfaengerTyp: "unternehmen",
                    soll: 0,
                    haben: Number(item.betrag || 0),
                    zahlungId: item.id,
                    rechnungId: item.rechnungId || "",
                    statusBearbeitung: item.bankStatus || "unbearbeitet",
                    bankbewegungTyp: "zahlungseingang"
                };
            })
            .filter(item => item.statusBearbeitung !== "bearbeitet");
    }, [syncTick, mode]);
    const invoiceOptions = openInvoices.map(item => ({
        value: String(item.id),
        label: `${item.rechnungsnr} - ${item.kunde} (${Number(item.betrag || 0).toFixed(2)} EUR)`
    }));
    const selectedEntry = selectedEntryId
        ? salesEntries.find(item => String(item.id) === String(selectedEntryId)) || null
        : null;
    const linkedPayment = selectedEntry?.zahlungId ? zahlungenService.getById(selectedEntry.zahlungId) : null;
    const selectedInvoice = selectedInvoiceId ? rechnungenService.getById(selectedInvoiceId) : null;
    const priorPayments = selectedInvoice
        ? (selectedInvoice.zahlungen || []).filter((payment: any) => String(payment.id || "") !== String(linkedPayment?.id || ""))
        : [];
    const settlementSummary = selectedInvoice ? getInvoiceSettlementSummary(selectedInvoice, priorPayments, selectedInvoice.mahnungen || [], today) : null;
    const paymentEvaluation = selectedInvoice && selectedEntry
        ? evaluateIncomingPayment({
            invoice: selectedInvoice,
            paymentAmount: Number(selectedEntry.haben || 0),
            payments: priorPayments,
            mahnungen: selectedInvoice.mahnungen || [],
            today
        })
        : null;
    const decisionMatches = paymentEvaluation
        ? selectedSettlementDecision === paymentEvaluation.result
        : false;
    const expectedDifferenceAmount = paymentEvaluation
        ? (paymentEvaluation.result === "teilzahlung" ? paymentEvaluation.shortfall : paymentEvaluation.result === "ueberzahlung" ? paymentEvaluation.overpayment : 0)
        : 0;
    const messageInvoice = messageInvoiceId ? rechnungenService.getById(messageInvoiceId) : null;
    const messageCase = messageInvoice ? customerMessageCases.get(String(messageInvoice.id)) : null;
    const messageOrder = messageInvoice?.auftragId ? auftraegeService.getById(messageInvoice.auftragId) : null;
    const messageOffer = messageOrder ? getOfferForOrder(messageOrder, angeboteService.getAll()) : null;
    const messageVorgangId = getVorgangId(messageOrder || messageOffer || {});
    const messageThread = messageVorgangId ? listNachrichtenZuVorgang(messageVorgangId) : [];

    const refreshData = () => {
        rechnungenService.list();
        zahlungenService.list();
        firmenkontoService.list();
    };

    const createReminder = (rechnung: any) => {
        mahnungenService.create({
            rechnungId: rechnung.id,
            stufe: getNextMahnstufe(mahnungenService.list().filter(item => String(item.rechnungId || "") === String(rechnung.id) && item.status !== "storniert"))
        });
        refreshData();
    };

    const transferToInkasso = (rechnung: any) => {
        mahnungenService.create({
            rechnungId: rechnung.id,
            stufe: "Inkasso"
        });
        refreshData();
    };

    const openAssignment = (entry: any) => {
        setSelectedEntryId(String(entry.id));
        const defaultInvoiceId = String(entry.rechnungId || (entry.zahlungId ? zahlungenService.getById(entry.zahlungId)?.rechnungId : "") || "");
        setSelectedInvoiceId(defaultInvoiceId);
        setSelectedSettlementDecision("");
        setDecisionReason("");
        setEnteredDifferenceAmount(0);
        setSkontoConsidered(false);
        setAssignOpen(true);
    };

    const openCustomerMessage = (rechnung: any) => {
        const selectedCase = customerMessageCases.get(String(rechnung.id));
        setMessageInvoiceId(String(rechnung.id));
        setCustomerNote(String(selectedCase?.kundenhinweis || ""));
        setMessageOpen(true);
    };

    const saveCustomerMessage = () => {
        if (!messageCase?.id || !messageInvoice || !customerNote.trim() || !messageVorgangId) return false;
        nachrichtenService.create({
            vorgangId: messageVorgangId,
            angebotId: messageOffer?.id || "",
            auftragId: messageOrder?.id || messageInvoice.auftragId || "",
            kundeId: messageInvoice.kundeId || "",
            datum: today,
            zeitpunkt: `${today}T12:00:00`,
            senderRolle: "Buchhaltung",
            senderName: "Schuelerfirma Buchhaltung",
            kanal: "Intern",
            betreff: messageCase.matchResult === "teilzahlung"
                ? `Buchhaltungshinweis zu ${messageInvoice.rechnungsnr}`
                : `Klaerung Ueberzahlung ${messageInvoice.rechnungsnr}`,
            nachricht: customerNote.trim(),
            typ: "Interne Notiz"
        });
        firmenkontoService.markSalesPaymentProcessed(messageCase.id, {
            kundenhinweis: customerNote.trim(),
            kundenhinweisGesendetAm: today
        });
        refreshData();
        return true;
    };

    const saveAssignment = () => {
        if (!selectedEntry || !selectedInvoice || !linkedPayment || !paymentEvaluation) return false;
        if (!selectedSettlementDecision || !decisionMatches) return false;
        if (!decisionReason.trim()) return false;
        if ((paymentEvaluation.result === "teilzahlung" || paymentEvaluation.result === "ueberzahlung")
            && Math.abs(Number(enteredDifferenceAmount || 0) - Number(expectedDifferenceAmount || 0)) > 0.01) return false;

        const persistedEntry = String(selectedEntry.id || "").startsWith("payment-")
            ? firmenkontoService.ensureBookingForPayment(linkedPayment)
            : selectedEntry;
        if (!persistedEntry?.id) return false;

        const updatedPayment = zahlungenService.update(linkedPayment.id, {
            ...linkedPayment,
            rechnungId: selectedInvoice.id,
            rechnungsnr: selectedInvoice.rechnungsnr,
            name: selectedInvoice.kunde,
            iban: selectedInvoice.iban,
            status: "ausgefuehrt",
            bankStatus: "bearbeitet",
            ausgleichErgebnis: paymentEvaluation.result,
            offenerRestbetrag: paymentEvaluation.shortfall,
            ueberzahlung: paymentEvaluation.overpayment
        });

        firmenkontoService.markSalesPaymentProcessed(persistedEntry.id, {
            rechnungId: selectedInvoice.id,
            statusBearbeitung: "bearbeitet",
            bearbeitetAm: today,
            matchResult: paymentEvaluation.result,
            restbetrag: paymentEvaluation.shortfall,
            ueberzahlung: paymentEvaluation.overpayment,
            verwendungszweck: persistedEntry.verwendungszweck || "",
            entscheidung: selectedSettlementDecision,
            entscheidungsbegruendung: decisionReason.trim(),
            skontoBeruecksichtigt: skontoConsidered
        });

        rechnungenService.update({
            ...selectedInvoice,
            status: paymentEvaluation.result === "teilzahlung" ? "offen" : "bezahlt",
            mahnstufe: paymentEvaluation.result === "teilzahlung" ? selectedInvoice.mahnstufe : "-"
        });

        if (updatedPayment && paymentEvaluation.result === "teilzahlung") {
            zahlungenService.update({
                ...updatedPayment,
                status: "ausgefuehrt"
            });
        }

        refreshData();
        return true;
    };

    return <>
        <h1>{config.pageTitle}</h1>
        <p>{mode === "eingang"
            ? "Hier werden offene Kreditorenposten und der Ausgleich von Lieferantenrechnungen gefuehrt."
            : "Hier werden offene Debitorenposten bearbeitet. Zahlungseingaenge aus dem Verkaufskonto werden direkt hier den Ausgangsrechnungen zugeordnet."}</p>

        <OverviewCards cards={[
            { label: config.pageTitle, value: allInvoices.length, note: config.summaryHint },
            { label: "Offen", value: openInvoices.length, note: "offene Posten" },
            { label: "Mahnungen", value: mode === "ausgang" ? mahnungenService.list().filter(item => item.status !== "storniert").length : 0, note: mode === "ausgang" ? "aktive Eskalation" : "Kreditoren" },
            { label: mode === "ausgang" ? "Zahlungseingaenge" : "Rechnungen", value: mode === "ausgang" ? salesEntries.length : allInvoices.length, note: mode === "ausgang" ? "unbearbeitet im Verkaufskonto" : "gesamt" }
        ]}/>

        {mode === "ausgang" && <div className="link-list">
            <Link className="button-link" to="/bankauszug?konto=verkauf">Zum Bankauszug Verkaufskonto</Link>
            <Link className="button-link" to="/mahnungen">Zu Mahnungen und Inkasso</Link>
        </div>}

        <div className="kennzahlen" role="tablist" aria-label={`${config.pageTitle} Hauptfilter`}>
            {[{ key: "offen", label: "Offen", value: openInvoices.length }, { key: "alle", label: "Alle", value: allInvoices.length }].map(tab => <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeMainTab === tab.key}
                className={`kennzahl kennzahl-button${activeMainTab === tab.key ? " is-active" : ""}`}
                onClick={() => setActiveMainTab(tab.key as InvoiceMainTab)}
            >
                <span>{tab.label}</span>
                <strong>{tab.value}</strong>
            </button>)}
        </div>

        {mode === "ausgang" && activeMainTab === "offen" && <section className="module-section">
            <div className="dashboard-panel-header">
                <h2>Handlungsbedarf</h2>
                <span>Debitoren-Mahnlauf</span>
            </div>
            <div className="kennzahlen" role="tablist" aria-label="Handlungsbedarf Ausgangsrechnungen">
                {actionFilterOptions.map(filter => <button
                    key={filter.key}
                    type="button"
                    role="tab"
                    aria-selected={activeActionFilter === filter.key}
                    className={`kennzahl kennzahl-button${activeActionFilter === filter.key ? " is-active" : ""}`}
                    onClick={() => setActiveActionFilter(filter.key)}
                >
                    <span>{filter.label}</span>
                    <strong>{filter.value}</strong>
                </button>)}
            </div>
            <p className="module-hint">Die Leiste zeigt, welche Ausgangsrechnungen beobachtet, erinnert, gemahnt oder an Inkasso abgegeben werden koennen.</p>
        </section>}

        {mode === "ausgang" && activeMainTab === "offen" && <DataTable
            title="Zu bearbeitende Zahlungseingaenge"
            selectableColumns={false}
            data={salesEntries}
            columns={[
                { field: "valuta", title: "Valuta", helpText: "Valuta ist das Datum, zu dem die Zahlung auf dem Verkaufskonto wirksam wurde." },
                { field: "senderName", title: "Sender" },
                { field: "haben", title: "Betrag" },
                { field: "verwendungszweck", title: "Verwendungszweck" },
                { field: "statusBearbeitung", title: "Status" }
            ]}
            rowActions={[
                {
                    name: "assign",
                    label: "Zahlung zuordnen",
                    permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN,
                    onClick: openAssignment,
                    variant: "warning"
                }
            ]}
        />}

        <DataTable
            title={
                activeMainTab === "alle" ? config.invoiceTitleAll
                    : config.invoiceTitleOpen
            }
            selectableColumns={false}
            data={visibleInvoices}
            focusRowId={focusValue}
            focusField="rechnungsnr"
            columns={[
                { field: "rechnungsnr", title: "Rechnungsnummer" },
                { field: "bezug", title: "Bezug", render: row => row.rechnungstyp === "Eingangsrechnung"
                    ? <Link className="detail-link" to={`/bestellungen?focus=${row.bestellungId}`}>{row.bestellNr}</Link>
                    : <Link className="detail-link" to={`/auftraege?focus=${row.auftragId}`}>{row.auftragNr}</Link> },
                { field: "kunde", title: config.partnerLabel, render: row => row.rechnungstyp === "Eingangsrechnung"
                    ? (row.lieferantId ? <Link className="detail-link" to={`/lieferanten?focus=${row.lieferantId}`}>{row.kunde}</Link> : row.kunde)
                    : (row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde) },
                { field: "datum", title: "Datum" },
                { field: "faelligAm", title: "Faellig am" },
                { field: "betrag", title: "Betrag" },
                { field: "status", title: "Status" },
                { field: "mahnstufe", title: "Mahnstufe" },
                { field: "nextAction", title: "Naechster Schritt" }
            ]}
            detailLinkResolver={({ field, row }) => {
                if (field === "bezug" && row.rechnungstyp === "Eingangsrechnung") return `/bestellungen?focus=${row.bestellungId}`;
                if (field === "bezug") return `/auftraege?focus=${row.auftragId}`;
                if (field === "kunde" && row.rechnungstyp === "Eingangsrechnung" && row.lieferantId) return `/lieferanten?focus=${row.lieferantId}`;
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                return null;
            }}
            rowActions={[
                {
                    name: "message",
                    label: "Kunden-Nachricht",
                    permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN,
                    onClick: openCustomerMessage,
                    variant: "secondary",
                    isVisible: row => mode === "ausgang" && invoiceNeedsCustomerMessage(row)
                },
                {
                    name: "remind",
                    label: "Mahnstufe ausloesen",
                    permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN,
                    onClick: createReminder,
                    variant: "warning",
                    isVisible: row => mode === "ausgang" && canCreateReminder(row, row.zahlungen || [], row.mahnungen || [], today)
                },
                {
                    name: "inkasso",
                    label: "Inkasso",
                    permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN,
                    onClick: transferToInkasso,
                    variant: "danger",
                    isVisible: row => mode === "ausgang" && canTransferToInkasso(row, row.zahlungen || [], row.mahnungen || [], today)
                }
            ]}
        />

        <Dialog
            open={assignOpen}
            title="Zahlungseingang fachlich zuordnen"
            onClose={() => setAssignOpen(false)}
            footer={<SaveButton onSave={saveAssignment} onSuccess={() => setAssignOpen(false)}>Bearbeitung speichern</SaveButton>}
        >
            {selectedEntry && <>
                <section className="module-panel accounting-dialog-section">
                    <div className="accounting-dialog-step">1. Bankbewegung lesen</div>
                    <div className="dashboard-panel-header">
                        <h2>Bankbewegung</h2>
                        <span>Verkaufskonto</span>
                    </div>
                    <div className="accounting-dialog-facts">
                        <article className="accounting-dialog-fact-card accounting-dialog-fact-card--accent">
                            <span>Eingegangener Betrag</span>
                            <strong>{Number(selectedEntry.haben || 0).toFixed(2)} EUR</strong>
                        </article>
                        <article className="accounting-dialog-fact-card">
                            <span glossary-key="valuta">Valuta</span>
                            <strong>{selectedEntry.valuta || "-"}</strong>
                        </article>
                        <article className="accounting-dialog-fact-card accounting-dialog-fact-card--wide">
                            <span>Verwendungszweck</span>
                            <strong>{selectedEntry.verwendungszweck || linkedPayment?.verwendungszweck || "-"}</strong>
                        </article>
                        <article className="accounting-dialog-fact-card">
                            <span>Sender</span>
                            <strong>{selectedEntry.senderName || "-"}</strong>
                        </article>
                        <article className="accounting-dialog-fact-card">
                            <span>Empfaenger</span>
                            <strong>{selectedEntry.empfaengerName || "Eigenes Verkaufskonto"}</strong>
                        </article>
                        <article className="accounting-dialog-fact-card">
                            <span>Soll</span>
                            <strong>{Number(selectedEntry.soll || 0).toFixed(2)} EUR</strong>
                        </article>
                    </div>
                </section>

                <section className="module-panel accounting-dialog-section">
                    <div className="accounting-dialog-step">2. Rechnung zuordnen</div>
                    <div className="dashboard-panel-header">
                        <h2>Passende Ausgangsrechnung</h2>
                        <span>Belegbezug</span>
                    </div>
                    <div className="form-row">
                        <Label required>Rechnung</Label>
                        <LookupField value={selectedInvoiceId} options={invoiceOptions} onChange={setSelectedInvoiceId} placeholder="Rechnung auswaehlen..." autoComplete="off"/>
                    </div>
                </section>

                {selectedInvoice && settlementSummary && paymentEvaluation && <>
                    <section className="module-panel accounting-dialog-section">
                        <div className="accounting-dialog-step">3. Rechnungsdaten vergleichen</div>
                        <div className="dashboard-panel-header">
                            <h2>Rechnungsdaten</h2>
                            <span>Pruefwerte</span>
                        </div>
                        <div className="accounting-dialog-summary">
                            <article className="accounting-dialog-summary-card">
                                <span>Rechnungsdatum</span>
                                <strong>{selectedInvoice.datum || "ohne Datum"}</strong>
                            </article>
                            <article className="accounting-dialog-summary-card">
                                <span>Rechnungsbetrag</span>
                                <strong>{Number(settlementSummary.invoiceAmount || 0).toFixed(2)} EUR</strong>
                            </article>
                            <article className="accounting-dialog-summary-card accounting-dialog-summary-card--accent">
                                <span>Aktuell erwarteter Betrag</span>
                                <strong>{Number(paymentEvaluation.targetAmount || 0).toFixed(2)} EUR</strong>
                            </article>
                        </div>
                        <div className="dashboard-two-column">
                            <article className="dashboard-panel">
                                <div className="dashboard-panel-header">
                                    <h2>Skonto</h2>
                                    <span>{settlementSummary.skontoAllowed ? "zulaessig" : "nicht mehr zulaessig"}</span>
                                </div>
                                <div className="accounting-dialog-compact-list">
                                    <div><span>Skonto</span><strong>{Number(settlementSummary.skontoAmount || 0).toFixed(2)} EUR</strong></div>
                                    <div><span>Mit Skonto</span><strong>{Number(settlementSummary.amountWithSkonto || 0).toFixed(2)} EUR</strong></div>
                                    <div><span>Bis</span><strong>{settlementSummary.skontoDeadline || "-"}</strong></div>
                                </div>
                            </article>
                            <article className="dashboard-panel">
                                <div className="dashboard-panel-header">
                                    <h2>Normaler Betrag</h2>
                                    <span>Rechnung</span>
                                </div>
                                <div className="accounting-dialog-compact-list">
                                    <div><span>Ohne Skonto</span><strong>{Number(settlementSummary.amountWithoutSkonto || 0).toFixed(2)} EUR</strong></div>
                                    <div><span>Faelligkeit</span><strong>{settlementSummary.dueDate || "-"}</strong></div>
                                </div>
                            </article>
                            <article className="dashboard-panel">
                                <div className="dashboard-panel-header">
                                    <h2>Mit Mahngebuehren</h2>
                                    <span>Mahnfall</span>
                                </div>
                                <div className="accounting-dialog-compact-list">
                                    <div><span>Mahngebuehren</span><strong>{Number(settlementSummary.mahngebuehren || 0).toFixed(2)} EUR</strong></div>
                                    <div><span>Gesamtbetrag</span><strong>{Number(settlementSummary.amountWithMahngebuehren || 0).toFixed(2)} EUR</strong></div>
                                    <div><span>Faelligkeit</span><strong>{settlementSummary.mahnDueDate || "-"}</strong></div>
                                </div>
                            </article>
                        </div>
                    </section>

                    <section className="module-panel accounting-dialog-section">
                        <div className="dashboard-panel-header">
                            <h2>4. Entscheidung treffen</h2>
                            <span>Schuelerentscheidung</span>
                        </div>
                        <div className="accounting-dialog-summary">
                            <article className="accounting-dialog-summary-card">
                                <span>Zahlungseingang</span>
                                <strong>{Number(selectedEntry.haben || 0).toFixed(2)} EUR</strong>
                            </article>
                            <article className="accounting-dialog-summary-card">
                                <span>Bisher inklusive aktuellem Eingang</span>
                                <strong>{Number(paymentEvaluation.totalReceived || 0).toFixed(2)} EUR</strong>
                            </article>
                            <article className={`accounting-dialog-summary-card ${decisionMatches ? "accounting-dialog-summary-card--success" : "accounting-dialog-summary-card--warning"}`}>
                                <span>Fachliche Einordnung</span>
                                <strong>{paymentEvaluation.result === "beglichen" ? "Beglichen" : paymentEvaluation.result === "teilzahlung" ? "Teilzahlung" : "Ueberzahlung"}</strong>
                            </article>
                        </div>
                        <div className="form-row">
                            <Label required>Entscheidung</Label>
                            <select value={selectedSettlementDecision} onChange={event => setSelectedSettlementDecision(event.target.value)}>
                                <option value="">Bitte waehlen...</option>
                                <option value="beglichen">Rechnung vollstaendig beglichen</option>
                                <option value="teilzahlung">Es fehlt noch Geld</option>
                                <option value="ueberzahlung">Es wurde zu viel gezahlt</option>
                            </select>
                        </div>
                        <div className="form-row accounting-dialog-inline-row">
                            <div>
                                <Label required>Begruendung</Label>
                                <TextArea rows={2} value={decisionReason} onChange={setDecisionReason}/>
                            </div>
                            <div>
                                <Label required>{paymentEvaluation.shortfall > 0 ? "Fehlbetrag" : paymentEvaluation.overpayment > 0 ? "Ueberzahlung" : "Differenz"}</Label>
                                <NumberField value={enteredDifferenceAmount} min="0" onChange={value => setEnteredDifferenceAmount(Number(value || 0))}/>
                            </div>
                        </div>
                        <div className="form-row accounting-dialog-inline-row accounting-dialog-inline-row--single">
                            <label className="checkbox-row">
                                <input type="checkbox" checked={skontoConsidered} onChange={event => setSkontoConsidered(event.target.checked)}/>
                                <span>Skonto wurde bei der Pruefung bewusst beruecksichtigt</span>
                            </label>
                        </div>
                        <div className={`accounting-dialog-feedback ${selectedSettlementDecision ? (decisionMatches ? "is-success" : "is-warning") : ""}`}>
                            <strong>Systempruefung</strong>
                            <p>
                                {!selectedSettlementDecision
                                    ? "Waehle zuerst eine Entscheidung aus."
                                    : decisionMatches
                                        ? "Deine Einordnung ist fachlich korrekt."
                                        : "Bitte pruefe noch einmal Faelligkeit, Skonto und moegliche Mahngebuehren."}
                            </p>
                        </div>
                        <ul className="dashboard-note-list">
                            <li>Erwarteter Gesamtbetrag: <strong>{Number(paymentEvaluation.targetAmount || 0).toFixed(2)} EUR</strong></li>
                            {selectedSettlementDecision && <li>Schuelerentscheidung: <strong>{selectedSettlementDecision === "beglichen" ? "Rechnung vollstaendig beglichen" : selectedSettlementDecision === "teilzahlung" ? "Es fehlt noch Geld" : "Es wurde zu viel gezahlt"}</strong></li>}
                            {paymentEvaluation.shortfall > 0 && <li>Offener Restbetrag: <strong>{Number(paymentEvaluation.shortfall || 0).toFixed(2)} EUR</strong></li>}
                            {paymentEvaluation.overpayment > 0 && <li>Ueberzahlung: <strong>{Number(paymentEvaluation.overpayment || 0).toFixed(2)} EUR</strong></li>}
                        </ul>
                        {(paymentEvaluation.shortfall > 0 || paymentEvaluation.overpayment > 0) && <p className="module-hint">
                            {paymentEvaluation.shortfall > 0
                                ? "Kundenhinweis anschliessend im Tab Kunden-Nachricht."
                                : "Kundenhinweis anschliessend im Tab Kunden-Nachricht."}
                        </p>}
                    </section>
                </>}
            </>}
        </Dialog>

        {messageInvoice && messageCase && <ThreadChatDialog
            open={messageOpen}
            title="Kunden-Nachricht erfassen"
            onClose={() => setMessageOpen(false)}
            vorgangId={messageVorgangId || "-"}
            kundeLabel={messageInvoice.kunde || "-"}
            statusLabel={messageCase.matchResult === "teilzahlung" ? "Teilzahlung offen" : "Ueberzahlung klaeren"}
            anliegen={`${messageInvoice.rechnungsnr} | ${messageCase.matchResult === "teilzahlung" ? "Restbetrag offen" : "Ueberzahlung"}`}
            offers={messageOffer ? [{ id: messageOffer.id, angebotsNr: messageOffer.angebotsNr, status: messageOffer.status }] : []}
            messages={messageThread}
            ownRole="Buchhaltung"
            offerHrefResolver={offer => `/angebote?focus=${offer.id}`}
            offerClickResolver={() => undefined}
            documentLinks={[]}
            headerActionLink={null as any}
            actionLinks={[]}
            customActionSection={<section className="module-panel">
                <div className="dashboard-panel-header">
                    <h2>Schreibhilfe</h2>
                    <span>{messageInvoice.rechnungsnr}</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Verwendungszweck: <strong>{messageCase.verwendungszweck || "-"}</strong></li>
                    <li>Offener Punkt: <strong>{messageCase.matchResult === "teilzahlung" ? "Es fehlt noch Geld." : "Es wurde zu viel gezahlt."}</strong></li>
                    <li>Betrag: <strong>{Number(messageCase.matchResult === "teilzahlung" ? messageCase.restbetrag || 0 : messageCase.ueberzahlung || 0).toFixed(2)} EUR</strong></li>
                </ul>
            </section>}
            replyLabel="Hinweis fuer die Lehrkraft im bestehenden Verlauf"
            replyValue={customerNote}
            replyPlaceholder={messageCase.matchResult === "teilzahlung"
                ? "Hinweis fuer die Lehrkraft: Kunde hat zu wenig gezahlt, bitte Rueckmeldung im Verlauf veranlassen."
                : "Hinweis fuer die Lehrkraft: Kunde hat zu viel gezahlt, bitte Klaerung im Verlauf veranlassen."}
            onReplyChange={setCustomerNote}
            onReplySend={() => {
                if (saveCustomerMessage()) {
                    setMessageOpen(false);
                }
            }}
            showReplyBox={true}
            documentsLabel="Angebotsbezug"
            actionSectionLabel="Aktionen"
        />}
    </>;
}
