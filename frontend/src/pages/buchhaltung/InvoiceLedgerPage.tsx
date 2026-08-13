import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import zahlungenService from "../../services/buchhaltung/zahlungenService";
import fristenOptionenService from "../../services/verwaltung/fristenOptionenService";
import { isOpenItem } from "../../utils/openItems";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getBerlinDate } from "../../utils/dateTime";

type PageMode = "eingang" | "ausgang";
type InvoiceMainTab = "offen" | "alle";
type InvoiceActionFilter = "alleoffenen" | "skonto" | "erinnerung" | "mahnbar1" | "mahnbar2" | "inkasso";

function createTransferDraft(today: string, mode: PageMode) {
    return {
        zahlungsart: mode === "eingang" ? "Ausgang" : "Eingang",
        name: "",
        iban: "",
        ausfuehrungsdatum: today,
        betrag: 0,
        verwendungszweck: ""
    };
}

function getPageConfig(mode: PageMode) {
    if (mode === "eingang") {
        return {
            invoiceType: "Eingangsrechnung",
            pageTitle: "Eingangsrechnungen",
            invoiceTitleAll: "Alle Eingangsrechnungen",
            invoiceTitleOpen: "Offene Eingangsrechnungen",
            paymentDraftArt: "Ausgang",
            unmatchedTitle: "Offene Zahlungsausgänge",
            matchedTitle: "Zugeordnete Lieferantenzahlungen",
            partnerLabel: "Lieferant",
            summaryHint: "Kreditoren"
        };
    }

    return {
        invoiceType: "Ausgangsrechnung",
        pageTitle: "Ausgangsrechnungen",
        invoiceTitleAll: "Alle Ausgangsrechnungen",
        invoiceTitleOpen: "Offene Ausgangsrechnungen",
        paymentDraftArt: "Eingang",
        unmatchedTitle: "Offene Zahlungseingänge",
        matchedTitle: "Zugeordnete Kundenzahlungen",
        partnerLabel: "Kunde",
        summaryHint: "Debitoren"
    };
}

export default function InvoiceLedgerPage({ mode }: { mode: PageMode }) {
    const today = getBerlinDate();
    const config = getPageConfig(mode);
    const fristen = fristenOptionenService.get();
    const [searchParams] = useSearchParams();
    const [zahlungen, setZahlungen] = useSyncedServiceData(
        ["zahlungen", "auftraege", "bestellungen", "kunden", "lieferanten", "fristenOptionen"],
        () => zahlungenService.list()
    );
    const [transferOpen, setTransferOpen] = useState(false);
    const [matchOpen, setMatchOpen] = useState(false);
    const [activeMainTab, setActiveMainTab] = useState<InvoiceMainTab>("offen");
    const [activeActionFilter, setActiveActionFilter] = useState<InvoiceActionFilter>("alleoffenen");
    const [draft, setDraft] = useState(createTransferDraft(today, mode));
    const [selectedPaymentId, setSelectedPaymentId] = useState("");
    const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

    const allInvoices = rechnungenService.list().filter(item => item.rechnungstyp === config.invoiceType);
    const openInvoices = allInvoices.filter(isOpenItem);
    const focusValue = searchParams.get("focus") || "";

    const tageSeit = (dateValue: string) => {
        if (!dateValue) return null;
        const start = new Date(`${dateValue}T00:00:00`);
        const end = new Date(`${today}T00:00:00`);
        const diff = end.getTime() - start.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const tageNachFaelligkeit = (rechnung: any) => {
        if (!rechnung?.faelligAm) return null;
        const tageBisFaellig = tageBisFaelligkeit(rechnung.faelligAm);
        if (tageBisFaellig === null) return null;
        return Math.max(0, -tageBisFaellig);
    };

    const tageBisFaelligkeit = (dateValue: string) => {
        if (!dateValue) return null;
        const start = new Date(`${today}T00:00:00`);
        const end = new Date(`${dateValue}T00:00:00`);
        const diff = end.getTime() - start.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const withinSkonto = (rechnung: any) => {
        const tage = tageSeit(rechnung.datum);
        return tage !== null && tage <= fristen.skontoTage;
    };

    const isErinnerung = (rechnung: any) => {
        const tage = tageSeit(rechnung.datum);
        const tageNachFaellig = tageNachFaelligkeit(rechnung);
        return tage !== null
            && tage >= fristen.zahlungserinnerungTage
            && (tageNachFaellig === null || tageNachFaellig < fristen.mahnung1AbTage);
    };

    const isMahnbar1 = (rechnung: any) => {
        const tage = tageNachFaelligkeit(rechnung);
        return tage !== null && tage >= fristen.mahnung1AbTage && tage < fristen.mahnung2AbTage;
    };

    const isMahnbar2 = (rechnung: any) => {
        const tage = tageNachFaelligkeit(rechnung);
        return tage !== null && tage >= fristen.mahnung2AbTage && tage < fristen.inkassoAbTage;
    };

    const isInkasso = (rechnung: any) => {
        const tage = tageNachFaelligkeit(rechnung);
        return tage !== null && tage >= fristen.inkassoAbTage;
    };

    const actionFilterOptions = [
        { key: "alleoffenen", label: "Alle offenen", value: openInvoices.length },
        { key: "skonto", label: `Innerhalb Skonto (${fristen.skontoProzent} %)`, value: openInvoices.filter(withinSkonto).length },
        { key: "erinnerung", label: "Zahlungserinnerung", value: openInvoices.filter(isErinnerung).length },
        { key: "mahnbar1", label: "Mahnbar (1.)", value: openInvoices.filter(isMahnbar1).length },
        { key: "mahnbar2", label: "Mahnbar (2.)", value: openInvoices.filter(isMahnbar2).length },
        { key: "inkasso", label: "Inkasso", value: openInvoices.filter(isInkasso).length }
    ] as const;

    const visibleInvoices = useMemo(() => {
        if (mode === "eingang") {
            return activeMainTab === "alle" ? allInvoices : openInvoices;
        }

        if (activeMainTab === "alle") return allInvoices;
        return openInvoices.filter(rechnung => {
            if (activeActionFilter === "alleoffenen") return true;
            if (activeActionFilter === "skonto") return withinSkonto(rechnung);
            if (activeActionFilter === "erinnerung") return isErinnerung(rechnung);
            if (activeActionFilter === "mahnbar1") return isMahnbar1(rechnung);
            if (activeActionFilter === "mahnbar2") return isMahnbar2(rechnung);
            if (activeActionFilter === "inkasso") return isInkasso(rechnung);
            return true;
        });
    }, [activeActionFilter, activeMainTab, allInvoices, openInvoices, mode]);

    const unmatchedTransfers = zahlungen.filter(item => !item.rechnungId && item.zahlungsart === config.paymentDraftArt);
    const matchedTransfers = zahlungen.filter(item => {
        if (!item.rechnungId) return false;
        const rechnung = rechnungenService.getById(item.rechnungId);
        return rechnung?.rechnungstyp === config.invoiceType;
    });

    const candidateInvoices = useMemo(() => {
        const payment = selectedPaymentId ? zahlungenService.getById(selectedPaymentId) : null;
        if (!payment) return openInvoices;
        return openInvoices.filter(rechnung => payment.zahlungsart === "Ausgang"
            ? rechnung.rechnungstyp === "Eingangsrechnung"
            : rechnung.rechnungstyp === "Ausgangsrechnung"
        );
    }, [openInvoices, selectedPaymentId]);

    const invoiceOptions = candidateInvoices.map(item => ({
        value: String(item.id),
        label: `${item.rechnungsnr} - ${item.kunde} (${Number(item.betrag || 0).toFixed(2)} EUR)`
    }));

    const transferAnlegen = () => {
        if (!draft.name.trim() || !draft.iban.trim() || Number(draft.betrag) <= 0) return;
        zahlungenService.create({
            zahlungsart: draft.zahlungsart,
            datum: draft.ausfuehrungsdatum,
            ausfuehrenAm: draft.ausfuehrungsdatum,
            ausfuehrungsdatum: draft.ausfuehrungsdatum,
            betrag: Number(draft.betrag),
            name: draft.name.trim(),
            iban: draft.iban.trim(),
            verwendungszweck: draft.verwendungszweck.trim(),
            methode: "Überweisung",
            status: "offen"
        });
        setZahlungen(zahlungenService.list());
        setTransferOpen(false);
        setDraft(createTransferDraft(today, mode));
    };

    const openMatchDialog = (payment: any) => {
        setSelectedPaymentId(String(payment.id));
        setSelectedInvoiceId("");
        setMatchOpen(true);
    };

    const zuordnen = () => {
        if (!selectedPaymentId || !selectedInvoiceId) return;
        zahlungenService.matchToInvoice(selectedPaymentId, selectedInvoiceId);
        setZahlungen(zahlungenService.list());
        setMatchOpen(false);
        setSelectedPaymentId("");
        setSelectedInvoiceId("");
    };

    const ausfuehren = (zahlung: any) => {
        zahlungenService.markExecuted(zahlung.id, today);
        setZahlungen(zahlungenService.list());
    };

    const zuordnungLoesen = (zahlung: any) => {
        zahlungenService.unmatch(zahlung.id);
        setZahlungen(zahlungenService.list());
    };

    const stornieren = (zahlung: any) => {
        if (zahlung.rechnungId) {
            zahlungenService.unmatch(zahlung.id);
        }
        zahlungenService.remove(zahlung.id);
        setZahlungen(zahlungenService.list());
    };

    const selectedPayment = selectedPaymentId ? zahlungenService.getById(selectedPaymentId) : null;

    return <>
        <h1>{config.pageTitle}</h1>
        <p>{mode === "eingang"
            ? "Hier werden Eingangsrechnungen und die zugehörigen Zahlungsausgänge gegenüber Lieferanten bearbeitet."
            : "Hier werden Ausgangsrechnungen und die zugehörigen Zahlungseingänge von Kunden bearbeitet."}</p>
        {mode === "eingang" && <OverviewCards cards={[
            { label: config.pageTitle, value: allInvoices.length, note: config.summaryHint },
            { label: "Offen", value: openInvoices.length, note: "offene Posten" },
            { label: "Offene Zahlungen", value: unmatchedTransfers.length, note: "noch nicht zugeordnet" },
            { label: "Zugeordnet", value: matchedTransfers.length, note: "bereits abgeglichen" }
        ]}/>}
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
                <span>Bearbeitungsstufen</span>
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
            <p className="module-hint">
                Diese Leiste zeigt nur offene Ausgangsrechnungen und hebt hervor, wo als Nächstes fachlicher Handlungsbedarf besteht.
            </p>
        </section>}
        <DataTable
            title={
                activeMainTab === "alle" ? config.invoiceTitleAll
                    : mode === "eingang" ? config.invoiceTitleOpen
                    : activeActionFilter === "alleoffenen" ? config.invoiceTitleOpen
                    : activeActionFilter === "skonto" ? `Ausgangsrechnungen innerhalb Skonto (${fristen.skontoProzent} %)`
                    : activeActionFilter === "erinnerung" ? "Ausgangsrechnungen für Zahlungserinnerung"
                    : activeActionFilter === "mahnbar1" ? "Ausgangsrechnungen mahnbar (1.)"
                    : activeActionFilter === "mahnbar2" ? "Ausgangsrechnungen mahnbar (2.)"
                    : "Ausgangsrechnungen für Inkasso"
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
                { field: "faelligAm", title: "Fällig am" },
                { field: "betrag", title: "Betrag" },
                { field: "status", title: "Status" }
            ]}
            detailLinkResolver={({ field, row }) => {
                if (field === "bezug" && row.rechnungstyp === "Eingangsrechnung") return `/bestellungen?focus=${row.bestellungId}`;
                if (field === "bezug") return `/auftraege?focus=${row.auftragId}`;
                if (field === "kunde" && row.rechnungstyp === "Eingangsrechnung" && row.lieferantId) return `/lieferanten?focus=${row.lieferantId}`;
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                return null;
            }}
        />
        <DataTable
            title={config.unmatchedTitle}
            selectableColumns={false}
            data={unmatchedTransfers}
            columns={[
                { field: "ausfuehrungsdatum", title: "Ausführung" },
                { field: "name", title: "Name" },
                { field: "iban", title: "IBAN" },
                { field: "betrag", title: "Betrag" },
                { field: "verwendungszweck", title: "Verwendungszweck" },
                { field: "status", title: "Status" }
            ]}
            toolbarActions={[{ name: "new", label: "Überweisung erfassen", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: () => setTransferOpen(true), variant: "success" }]}
            rowActions={[
                { name: "match", label: "Rechnung zuordnen", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: openMatchDialog, variant: "secondary" },
                { name: "execute", label: "Als ausgeführt markieren", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: ausfuehren, variant: "success", isVisible: row => row.status !== "ausgefuehrt" },
                { name: "cancel", label: "Stornieren", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: stornieren, variant: "danger" }
            ]}
        />
        <DataTable
            title={config.matchedTitle}
            selectableColumns={false}
            data={matchedTransfers}
            columns={[
                { field: "ausfuehrungsdatum", title: "Ausführung" },
                { field: "rechnungsnr", title: "Rechnung", render: row => <Link className="detail-link" to={`/${mode === "eingang" ? "eingangsrechnungen" : "ausgangsrechnungen"}?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link> },
                { field: "name", title: "Name" },
                { field: "iban", title: "IBAN" },
                { field: "betrag", title: "Betrag" },
                { field: "verwendungszweck", title: "Verwendungszweck" },
                { field: "status", title: "Status" }
            ]}
            detailLinkResolver={({ field, value }) => field === "rechnungsnr" ? `/${mode === "eingang" ? "eingangsrechnungen" : "ausgangsrechnungen"}?focus=${value}` : null}
            rowActions={[
                { name: "unmatch", label: "Zuordnung lösen", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: zuordnungLoesen, variant: "secondary" },
                { name: "cancel", label: "Stornieren", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: stornieren, variant: "danger" }
            ]}
        />

        <Dialog open={transferOpen} title="Überweisung erfassen" onClose={() => setTransferOpen(false)}>
            <div><Label>Art</Label><input type="text" value={draft.zahlungsart === "Ausgang" ? "Ausgang" : "Eingang"} disabled/></div>
            <div><Label>Name</Label><TextField value={draft.name} onChange={value => setDraft(item => ({ ...item, name: value }))}/></div>
            <div><Label>IBAN</Label><TextField value={draft.iban} onChange={value => setDraft(item => ({ ...item, iban: value }))}/></div>
            <div className="form-row">
                <div><Label>Betrag</Label><NumberField value={draft.betrag} min="0" onChange={value => setDraft(item => ({ ...item, betrag: Number(value || 0) }))}/></div>
                <div><Label>Datum der Ausführung</Label><input type="date" value={draft.ausfuehrungsdatum} onChange={event => setDraft(item => ({ ...item, ausfuehrungsdatum: event.target.value }))}/></div>
            </div>
            <div className="form-row"><Label>Verwendungszweck</Label><TextArea rows={3} value={draft.verwendungszweck} onChange={value => setDraft(item => ({ ...item, verwendungszweck: value }))}/></div>
            <div className="form-row"><button type="button" onClick={transferAnlegen}>Speichern</button></div>
        </Dialog>

        <Dialog open={matchOpen} title="Überweisung einer Rechnung zuordnen" onClose={() => setMatchOpen(false)}>
            {selectedPayment && <>
                <div className="form-row">
                    <p><strong>{selectedPayment.name}</strong> · {Number(selectedPayment.betrag || 0).toFixed(2)} EUR · {selectedPayment.verwendungszweck || "ohne Verwendungszweck"}</p>
                </div>
                <div><Label>Passende Rechnung</Label><LookupField value={selectedInvoiceId} options={invoiceOptions} onChange={setSelectedInvoiceId} placeholder="Rechnung auswählen..."/></div>
                <div className="form-row"><button type="button" onClick={zuordnen}>Zuordnen</button></div>
            </>}
        </Dialog>
    </>;
}
