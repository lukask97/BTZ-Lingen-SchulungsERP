import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import { PERMISSIONS } from "../../constants/permissions";
import bestellungenService from "../../services/einkauf/bestellungenService";
import { bucheWareneingang } from "../../services/einkauf/wareneingangService";
import OverviewCards from "../../components/OverviewCards";
import { canBookGoodsReceipt, getOpenGoodsReceiptOrders, getPurchaseStep, getPurchaseStepLabel } from "../../utils/processFlow";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";

export default function Wareneingaenge() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [bestellungen, setBestellungen] = useSyncedServiceData(["bestellungen"], () => bestellungenService.getAll());
    const offeneBestellungen = getOpenGoodsReceiptOrders(bestellungen);
    const offenePositionen = offeneBestellungen.reduce((summe, bestellung) => summe + bestellung.positionen.length, 0);

    const buchen = bestellung => {
        if (!confirm(`Wareneingang für ${bestellung.bestellNr} buchen? Der Artikelbestand wird erhöht.`)) return;
        bucheWareneingang(bestellung.id);
        setBestellungen(bestellungenService.getAll());
    };

    return <>
        <OverviewCards cards={[
            { label: "Offene Wareneingänge", value: offeneBestellungen.length },
            { label: "Offene Positionen", value: offenePositionen },
            { label: "Bereits gebucht", value: bestellungen.filter(item => item.status === "eingegangen").length }
        ]}/>
        <DataTable
        title="Offene Wareneingänge"
        columns={[
            { field: "bestellNr", title: "Bestellnummer", render: row => <Link className="detail-link" to={`/bestellungen?focus=${row.id}`}>{row.bestellNr}</Link> },
            { field: "lieferant", title: "Lieferant" },
            { field: "datum", title: "Bestelldatum" },
            { field: "prozess", title: "Prozess" },
            { field: "positionen", title: "Lieferung", render: row => row.positionen.map(position => `${position.artikel}: ${position.menge}`).join(", ") }
        ]}
        data={offeneBestellungen.map(item => ({ ...item, prozess: getPurchaseStepLabel(getPurchaseStep(item)) }))}
        selectableColumns={false}
        focusRowId={searchParams.get("focus") || ""}
        focusField="id"
        detailLinkResolver={({ field, row }) => field === "bestellNr" ? `/bestellungen?focus=${row.id}` : null}
        rowActions={[
            { name: "book", label: "Wareneingang buchen", permission: PERMISSIONS.LAGER_BUCHEN, onClick: buchen, isVisible: row => canBookGoodsReceipt(row) }
        ]}
        />
    </>;
}
