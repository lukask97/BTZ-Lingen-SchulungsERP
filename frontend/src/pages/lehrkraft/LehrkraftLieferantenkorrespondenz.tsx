import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import SaveButton from "../../components/SaveButton";
import TextArea from "../../components/form/TextArea";
import { PERMISSIONS } from "../../constants/permissions";
import bestellungenService, { bestaetigeBestellung, versendeBestellung } from "../../services/einkauf/bestellungenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import lieferantenService from "../../services/einkauf/lieferantenService";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { getBerlinDate } from "../../utils/dateTime";
import { canConfirmPurchaseOrder, canSendPurchaseOrder, getOpenGoodsReceiptOrders, getPurchaseOrdersByStatus } from "../../utils/processFlow";

function getInvoiceViewStatus(rechnung: any) {
    const today = getBerlinDate();
    if (rechnung.status === "bezahlt") return "bezahlt";
    if (rechnung.faelligAm && rechnung.faelligAm < today) return "ueberfaellig";
    return "offen";
}

function getAnfrageQuelleLabel(bestellung: any) {
    if (bestellung.anfrageQuelle === "lieferantenvergleich") return "Lieferantenkonditionen";
    return "Bedarfsmeldung";
}

function getPositionenText(positionen: any[] = []) {
    return positionen.map(position => {
        const artikelNr = position.artikelNr ? `${position.artikelNr}: ` : "";
        return `${artikelNr}${position.artikel} (${position.menge})`;
    }).join(", ");
}

function createOfferDraft(row: any = null) {
    return {
        bestellungId: row?.id || "",
        lieferantId: row?.lieferantId ? String(row.lieferantId) : "",
        preis: Number(row?.lehrkraftAngebotPreis || 0),
        lieferzeitTage: Number(row?.lehrkraftLieferzeitTage || 7),
        nachricht: row?.lehrkraftAngebotText || ""
    };
}

export default function LehrkraftLieferantenkorrespondenz() {
    const [bestellungen, setBestellungen] = useSyncedServiceData(
        ["bestellungen", "auftraege"],
        () => bestellungenService.list()
    );
    const [activeTab, setActiveTab] = useState("anfragen");
    const [offerOpen, setOfferOpen] = useState(false);
    const [offerDraft, setOfferDraft] = useState(() => createOfferDraft());
    const [offerError, setOfferError] = useState("");
    const rechnungen = rechnungenService.list();
    const lieferanten = lieferantenService.list();
    const lieferantenOptionen = lieferanten.map(item => ({
        value: String(item.id),
        label: `${item.lieferantenNr} - ${item.firma}`
    }));
    const offeneRechnungen = rechnungen.filter(item => item.rechnungstyp === "Eingangsrechnung" && item.status !== "bezahlt");
    const rechnungsDaten = rechnungen
        .filter(item => item.rechnungstyp === "Eingangsrechnung")
        .map(item => ({
            ...item,
            sichtStatus: getInvoiceViewStatus(item),
            bezug: "Lieferant -> Schülerfirma"
        }));
    const dashboardTabs = [
        { key: "anfragen", label: "Anfragen offen", value: getPurchaseOrdersByStatus(bestellungen, "angefragt").length },
        { key: "rechnungen", label: "Offene Rechnungen", value: offeneRechnungen.length },
        { key: "bestaetigt", label: "Bestätigt", value: getPurchaseOrdersByStatus(bestellungen, "bestaetigt").length },
        { key: "versendet", label: "Versendet", value: getOpenGoodsReceiptOrders(bestellungen).length }
    ];

    const bestaetigen = (row: any) => {
        bestaetigeBestellung(row);
        setBestellungen(bestellungenService.list());
    };

    const versenden = (row: any) => {
        versendeBestellung(row);
        setBestellungen(bestellungenService.list());
    };

    const angebotOeffnen = (row: any) => {
        setOfferError("");
        setOfferDraft(createOfferDraft(row));
        setOfferOpen(true);
    };

    const angebotSpeichern = () => {
        const bestellung = bestellungen.find(item => String(item.id) === String(offerDraft.bestellungId));
        const lieferant = lieferanten.find(item => String(item.id) === String(offerDraft.lieferantId));
        const preis = Number(offerDraft.preis || 0);
        const lieferzeitTage = Number(offerDraft.lieferzeitTage || 0);
        if (!bestellung || !lieferant || preis <= 0 || lieferzeitTage <= 0) {
            setOfferError("Bitte Lieferant, Angebotspreis und Lieferzeit ausfüllen.");
            return false;
        }
        bestellungenService.update(bestellung.id, {
            ...bestellung,
            lieferantId: lieferant.id,
            lehrkraftAngebotAm: getBerlinDate(),
            lehrkraftAngebotPreis: preis,
            lehrkraftLieferzeitTage: lieferzeitTage,
            lehrkraftAngebotText: offerDraft.nachricht || ""
        });
        setOfferError("");
        setBestellungen(bestellungenService.list());
        return true;
    };

    const bestellungsDaten = useMemo(() => bestellungen.map(item => ({
        ...item,
        anfrageQuelleLabel: getAnfrageQuelleLabel(item),
        positionenText: getPositionenText(item.positionen || []),
        artikelnummernText: (item.positionen || []).map(position => position.artikelNr || "-").join(", "),
        angebotsText: item.lehrkraftAngebotAm
             ? `${item.lehrkraftAngebotAm} · ${Number(item.lehrkraftAngebotPreis || 0).toFixed(2)} EUR`
            : "Noch kein Angebot"
    })), [bestellungen]);

    return <>
        <h1>Lehrkraft: Lieferantenkorrespondenz</h1>
        <p>Hier begleitet die Lehrkraft den vereinfachten Einkaufsprozess. Die Schülerfirma erfasst Artikelnummern und Mengen, die Lehrkraft erstellt darauf aufbauend ein Angebot, bestätigt die Anfrage und markiert die Bestellung anschließend als versendet.</p>
        <div className="kennzahlen">
            {dashboardTabs.map(card => <button key={card.key} type="button" className={`kennzahl kennzahl-button${activeTab === card.key ? " is-active" : ""}`} onClick={() => setActiveTab(card.key)}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
            </button>)}
        </div>

        {(activeTab === "anfragen" || activeTab === "bestaetigt" || activeTab === "versendet") && <DataTable
            title="Einkaufsanfragen extern"
            selectableColumns={false}
            data={bestellungsDaten.filter(item => {
                if (activeTab === "anfragen") return canConfirmPurchaseOrder(item);
                if (activeTab === "bestaetigt") return canSendPurchaseOrder(item);
                if (activeTab === "versendet") return getOpenGoodsReceiptOrders([item]).length > 0;
                return true;
            })}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "bestellNr", title: "Bestellung", render: row => <Link className="detail-link" to={`/bestellungen?focus=${row.id}`}>{row.bestellNr}</Link> },
                { field: "anfrageQuelleLabel", title: "Auslöser" },
                { field: "artikelnummernText", title: "Artikelnummern" },
                { field: "positionenText", title: "Bedarf" },
                { field: "lieferant", title: "Lieferant", render: row => row.lieferantId ? <Link className="detail-link" to={`/lieferanten?focus=${row.lieferantId}`}>{row.lieferant}</Link> : "Noch offen" },
                { field: "angebotsText", title: "Angebot" },
                { field: "status", title: "Status" },
                { field: "versendetAm", title: "Versendet am", render: row => row.versendetAm || "-" }
            ]}
            detailLinkResolver={({ field, row }) => {
                if (field === "bestellNr") return `/bestellungen?focus=${row.id}`;
                if (field === "lieferant" && row.lieferantId) return `/lieferanten?focus=${row.lieferantId}`;
                return null;
            }}
            rowActions={[
                { name: "edit", label: "Angebot erfassen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: angebotOeffnen, variant: "secondary", isVisible: row => canConfirmPurchaseOrder(row) },
                { name: "approve", label: "Bestätigen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: bestaetigen, variant: "success", isVisible: row => canConfirmPurchaseOrder(row), isDisabled: row => !row.lehrkraftAngebotAm },
                { name: "send", label: "Versenden", permission: PERMISSIONS.GF_BEARBEITEN, onClick: versenden, variant: "secondary", isVisible: row => canSendPurchaseOrder(row) }
            ]}
        />}

        {activeTab === "rechnungen" && <DataTable
            title="Externe Rechnungen"
            selectableColumns={false}
            data={rechnungsDaten}
            columns={[
                { field: "rechnungsnr", title: "Rechnung" },
                { field: "bezug", title: "Aussenbezug" },
                { field: "kunde", title: "Partner" },
                { field: "datum", title: "Datum" },
                { field: "faelligAm", title: "Fällig am" },
                { field: "betrag", title: "Betrag" },
                { field: "sichtStatus", title: "Status" }
            ]}
            detailLinkResolver={({ field, row }) => field === "rechnungsnr" ? `/rechnungen?focus=${row.rechnungsnr}` : null}
        />}

        <Dialog
            open={offerOpen}
            title="Lehrkraftangebot erfassen"
            onClose={() => {
                setOfferError("");
                setOfferOpen(false);
            }}
            footer={<SaveButton onSave={angebotSpeichern} onSuccess={() => {
                setOfferError("");
                setOfferOpen(false);
            }}>Angebot speichern</SaveButton>}
        >
            <div>
                <Label required glossaryKey="lieferantenvergleich">Lieferant</Label>
                <LookupField value={offerDraft.lieferantId} options={lieferantenOptionen} onChange={value => {
                    setOfferError("");
                    setOfferDraft(item => ({ ...item, lieferantId: value }));
                }} placeholder="Lieferant wählen..."/>
            </div>
            <div className="form-row">
                <div>
                    <Label required glossaryKey="angebotspreis">Angebotspreis gesamt</Label>
                    <NumberField value={offerDraft.preis} min="0" step="0.01" format="currency" onChange={wert => {
                        setOfferError("");
                        setOfferDraft(item => ({ ...item, preis: Number(wert || 0) }));
                    }}/>
                </div>
                <div>
                    <Label required glossaryKey="lieferzeit">Lieferzeit in Tagen</Label>
                    <NumberField value={offerDraft.lieferzeitTage} min="0" step="1" onChange={wert => {
                        setOfferError("");
                        setOfferDraft(item => ({ ...item, lieferzeitTage: Number(wert || 0) }));
                    }}/>
                </div>
            </div>
            <div className="form-row">
                <Label>Hinweis zum Angebot</Label>
                <TextArea rows={3} value={offerDraft.nachricht} onChange={wert => {
                    setOfferError("");
                    setOfferDraft(item => ({ ...item, nachricht: wert }));
                }}/>
            </div>
            <div className="form-row">
                {offerError && <p className="form-error">{offerError}</p>}
            </div>
        </Dialog>
    </>;
}
