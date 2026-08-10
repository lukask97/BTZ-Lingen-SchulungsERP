import { Link } from "react-router-dom";
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
import { isOpenItem } from "../../utils/openItems";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getBerlinDate } from "../../utils/dateTime";

function createTransferDraft(today: string) {
    return {
        zahlungsart: "Eingang",
        name: "",
        iban: "",
        ausfuehrungsdatum: today,
        betrag: 0,
        verwendungszweck: ""
    };
}

export default function Zahlungen() {
    const today = getBerlinDate();
    const [zahlungen, setZahlungen] = useSyncedServiceData(
        ["zahlungen", "auftraege", "bestellungen", "kunden", "lieferanten"],
        () => zahlungenService.list()
    );
    const [transferOpen, setTransferOpen] = useState(false);
    const [matchOpen, setMatchOpen] = useState(false);
    const [draft, setDraft] = useState(createTransferDraft(today));
    const [selectedPaymentId, setSelectedPaymentId] = useState("");
    const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

    const rechnungen = rechnungenService.list();
    const offeneRechnungen = rechnungen.filter(isOpenItem);
    const unmatchedTransfers = zahlungen.filter(item => !item.rechnungId);
    const matchedTransfers = zahlungen.filter(item => !!item.rechnungId);
    const offeneEingaenge = unmatchedTransfers.filter(item => item.zahlungsart !== "Ausgang");
    const offeneAusgaenge = unmatchedTransfers.filter(item => item.zahlungsart === "Ausgang");
    const summeBankbewegungen = zahlungen.reduce((summe, item) => summe + Number(item.betrag || 0), 0);

    const candidateInvoices = useMemo(() => {
        const payment = selectedPaymentId ? zahlungenService.getById(selectedPaymentId) : null;
        if (!payment) return offeneRechnungen;
        return offeneRechnungen.filter(rechnung => payment.zahlungsart === "Ausgang"
            ? rechnung.rechnungstyp === "Eingangsrechnung"
            : rechnung.rechnungstyp !== "Eingangsrechnung"
        );
    }, [offeneRechnungen, selectedPaymentId]);

    const invoiceOptions = candidateInvoices.map(item => ({
        value: String(item.id),
        label: `${item.rechnungsnr} - ${item.kunde} (${Number(item.betrag || 0).toFixed(2)} EUR)`
    }));

    const resolvePartnerLink = (zahlung: any) => {
        if (zahlung.rechnungId) {
            const rechnung = rechnungenService.getById(zahlung.rechnungId);
            if (!rechnung) return null;
            if (rechnung.rechnungstyp === "Eingangsrechnung") {
                return rechnung.lieferantId ? `/lieferanten?focus=${rechnung.lieferantId}` : null;
            }
            return rechnung.kundeId ? `/kunden?focus=${rechnung.kundeId}` : null;
        }
        return null;
    };

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
        setDraft(createTransferDraft(today));
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
        <OverviewCards cards={[
            { label: "Überweisungen", value: zahlungen.length },
            { label: "Offene Bankeingänge", value: offeneEingaenge.length },
            { label: "Offene Bankausgänge", value: offeneAusgaenge.length },
            { label: "Zugeordnet", value: matchedTransfers.length },
            { label: "Summe", value: `${summeBankbewegungen.toFixed(2)} €` }
        ]}/>
        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Bankauszug zuordnen</h2>
                    <span>Einfacher Zahlungsabgleich</span>
                </div>
                <p>Überweisungen bleiben offen sichtbar, bis sie genau einer Ausgangs- oder Eingangsrechnung zugeordnet sind.</p>
                <div className="link-list">
                    <button type="button" className="button-link" onClick={() => setTransferOpen(true)}>Überweisung erfassen</button>
                    <Link className="button-link" to="/ausgangsrechnungen">Ausgangsrechnungen</Link>
                    <Link className="button-link" to="/eingangsrechnungen">Eingangsrechnungen</Link>
                    <Link className="button-link" to="/bankauszug">Bankauszug</Link>
                </div>
            </article>
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Merksätze</h2>
                    <span>Unterrichtshilfe</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Kundenzahlungen werden Ausgangsrechnungen zugeordnet.</li>
                    <li>Lieferantenzahlungen werden Eingangsrechnungen zugeordnet.</li>
                    <li>Der Verwendungszweck hilft bei der schnellen Auswahl, ersetzt die Prüfung aber nicht.</li>
                </ul>
            </article>
        </section>
        <DataTable
            title="Offene Überweisungen"
            selectableColumns={false}
            data={unmatchedTransfers}
            columns={[
                { field: "ausfuehrungsdatum", title: "Ausführung" },
                { field: "zahlungsart", title: "Art" },
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
            title="Zugeordnete Zahlungen"
            selectableColumns={false}
            data={matchedTransfers}
            columns={[
                { field: "ausfuehrungsdatum", title: "Ausführung" },
                { field: "rechnungsnr", title: "Rechnung", render: row => <Link className="detail-link" to={`/rechnungen?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link> },
                { field: "zahlungsart", title: "Art" },
                { field: "name", title: "Name", render: row => {
                    const link = resolvePartnerLink(row);
                    return link ? <Link className="detail-link" to={link}>{row.name}</Link> : row.name;
                } },
                { field: "iban", title: "IBAN" },
                { field: "betrag", title: "Betrag" },
                { field: "verwendungszweck", title: "Verwendungszweck" },
                { field: "status", title: "Status" }
            ]}
            detailLinkResolver={({ field, row, value }) => {
                if (field === "rechnungsnr") return `/rechnungen?focus=${value}`;
                if (field === "name") return resolvePartnerLink(row);
                return null;
            }}
            rowActions={[
                { name: "unmatch", label: "Zuordnung lösen", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: zuordnungLoesen, variant: "secondary" },
                { name: "cancel", label: "Stornieren", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: stornieren, variant: "danger" }
            ]}
        />

        <Dialog open={transferOpen} title="Überweisung erfassen" onClose={() => setTransferOpen(false)}>
            <div><Label>Art</Label><select value={draft.zahlungsart} onChange={event => setDraft(item => ({ ...item, zahlungsart: event.target.value }))}>
                <option value="Eingang">Eingang</option>
                <option value="Ausgang">Ausgang</option>
            </select></div>
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
