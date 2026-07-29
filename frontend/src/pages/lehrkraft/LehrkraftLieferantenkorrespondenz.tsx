import { useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/DataTable";
import OverviewCards from "../../components/OverviewCards";
import bestellungenService from "../../services/einkauf/bestellungenService";

const today = "2026-07-28";

export default function LehrkraftLieferantenkorrespondenz() {
    const [bestellungen, setBestellungen] = useState(bestellungenService.list());

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

    return <>
        <h1>Lehrkraft: Lieferantenkorrespondenz</h1>
        <p>Hier begleitet die Lehrkraft den vereinfachten Einkaufsprozess. Sie bestaetigt Anfragen der Schuelerfirma und markiert die Bestellung anschliessend als versendet.</p>
        <OverviewCards cards={[
            { label: "Anfragen offen", value: bestellungen.filter(item => item.status === "angefragt").length },
            { label: "Bestaetigt", value: bestellungen.filter(item => item.status === "bestaetigt").length },
            { label: "Versendet", value: bestellungen.filter(item => item.status === "versendet").length }
        ]}/>
        <DataTable
            title="Einkaufsanfragen extern"
            selectableColumns={false}
            data={bestellungen.map(item => ({
                ...item,
                positionenText: (item.positionen || []).map(position => `${position.artikel} (${position.menge})`).join(", ")
            }))}
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
        />
    </>;
}
