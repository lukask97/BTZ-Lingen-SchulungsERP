import { useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/DataTable";
import bestellungenService from "../../services/einkauf/bestellungenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";

const today = "2026-07-29";

function getInvoiceViewStatus(rechnung: any) {
    if (rechnung.status === "bezahlt") return "bezahlt";
    if (rechnung.faelligAm && rechnung.faelligAm < today) return "ueberfaellig";
    return "offen";
}

export default function LehrkraftLieferantenkorrespondenz() {
    const [bestellungen, setBestellungen] = useState(bestellungenService.list());
    const [activeTab, setActiveTab] = useState("anfragen");
    const rechnungen = rechnungenService.list();
    const offeneRechnungen = rechnungen.filter(item => item.rechnungstyp === "Eingangsrechnung" && item.status !== "bezahlt");
    const rechnungsDaten = rechnungen
        .filter(item => item.rechnungstyp === "Eingangsrechnung")
        .map(item => ({
            ...item,
            sichtStatus: getInvoiceViewStatus(item),
            bezug: "Lieferant -> Schuelerfirma"
        }));
    const dashboardTabs = [
        { key: "anfragen", label: "Anfragen offen", value: bestellungen.filter(item => item.status === "angefragt").length },
        { key: "rechnungen", label: "Offene Rechnungen", value: offeneRechnungen.length },
        { key: "bestaetigt", label: "Bestaetigt", value: bestellungen.filter(item => item.status === "bestaetigt").length },
        { key: "versendet", label: "Versendet", value: bestellungen.filter(item => item.status === "versendet").length }
    ];

    const bestaetigen = (row: any) => {
        bestellungenService.update(row.id, {
            ...row,
            status: "bestaetigt"
        });
        setBestellungen(bestellungenService.list());
    };

    const versenden = (row: any) => {
        bestellungenService.update(row.id, {
            ...row,
            status: "versendet",
            versendetAm: today
        });
        setBestellungen(bestellungenService.list());
    };

    const bestellungsDaten = bestellungen.map(item => ({
        ...item,
        positionenText: (item.positionen || []).map(position => `${position.artikel} (${position.menge})`).join(", ")
    }));

    return <>
        <h1>Lehrkraft: Lieferantenkorrespondenz</h1>
        <p>Hier begleitet die Lehrkraft den vereinfachten Einkaufsprozess. Sie bestaetigt Anfragen der Schuelerfirma und markiert die Bestellung anschliessend als versendet.</p>
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
                if (activeTab === "anfragen") return item.status === "angefragt";
                if (activeTab === "bestaetigt") return item.status === "bestaetigt";
                if (activeTab === "versendet") return item.status === "versendet";
                return true;
            })}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "bestellNr", title: "Bestellung", render: row => <Link className="detail-link" to={`/bestellungen?focus=${row.id}`}>{row.bestellNr}</Link> },
                { field: "lieferant", title: "Lieferant", render: row => row.lieferantId ? <Link className="detail-link" to={`/lieferanten?focus=${row.lieferantId}`}>{row.lieferant}</Link> : row.lieferant },
                { field: "positionenText", title: "Artikel" },
                { field: "status", title: "Status" },
                { field: "versendetAm", title: "Versendet am", render: row => row.versendetAm || "-" }
            ]}
            detailLinkResolver={({ field, row }) => {
                if (field === "bestellNr") return `/bestellungen?focus=${row.id}`;
                if (field === "lieferant" && row.lieferantId) return `/lieferanten?focus=${row.lieferantId}`;
                return null;
            }}
            rowActions={[
                { name: "approve", label: "Bestaetigen", permission: "gf", onClick: bestaetigen, variant: "success", isVisible: row => row.status === "angefragt" },
                { name: "send", label: "Versenden", permission: "gf", onClick: versenden, variant: "secondary", isVisible: row => row.status === "bestaetigt" }
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
                { field: "faelligAm", title: "Faellig am" },
                { field: "betrag", title: "Betrag" },
                { field: "sichtStatus", title: "Status" }
            ]}
            detailLinkResolver={({ field, row }) => field === "rechnungsnr" ? `/rechnungen?focus=${row.rechnungsnr}` : null}
        />}
    </>;
}
