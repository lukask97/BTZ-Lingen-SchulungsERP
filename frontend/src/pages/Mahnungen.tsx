import { Link } from "react-router-dom";
import { useState } from "react";
import DataTable from "../components/DataTable";
import OverviewCards from "../components/OverviewCards";
import mahnungenService from "../services/mahnungenService";
import rechnungenService from "../services/rechnungenService";
import kundenService from "../services/customerService";
import { getCustomerName } from "../utils/customerReferences";

const today = "2026-07-26";

export default function Mahnungen() {
    const [mahnungen, setMahnungen] = useState(mahnungenService.list());
    const kunden = kundenService.list();

    const resolveKundenLink = (row) => {
        const rechnung = rechnungenService.list().find(item => item.rechnungsnr === row.rechnungsnr);
        if (rechnung?.kundeId) return `/kunden?focus=${rechnung.kundeId}`;
        const kunde = kunden.find(item => item.firma === row.kunde);
        return kunde ? `/kunden?focus=${kunde.id}` : null;
    };

    const erzeugen = (rechnung) => {
        mahnungenService.create({
            rechnungsnr: rechnung.rechnungsnr,
            kunde: getCustomerName(rechnung.kundeId, rechnung.kunde),
            datum: today,
            status: "gesendet",
            stufe: "1. Mahnung"
        });
        setMahnungen(mahnungenService.list());
    };

    const stornieren = (mahnung) => {
        mahnungenService.update({ ...mahnung, status: "storniert" });
        setMahnungen(mahnungenService.list());
    };

    const offeneRechnungen = rechnungenService.list().filter(item => item.status === "offen" && item.rechnungstyp === "Ausgangsrechnung");

    return <>
        <OverviewCards cards={[
            { label: "Mahnungen", value: mahnungen.length },
            { label: "Offene Rechnungen", value: offeneRechnungen.length },
            { label: "Gesendet", value: mahnungen.filter(item => item.status === "gesendet").length }
        ]}/>
        <DataTable
            title="Mahnungen"
            selectableColumns={false}
            data={mahnungen}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "rechnungsnr", title: "Rechnung", render: row => <Link className="detail-link" to={`/rechnungen?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link> },
                { field: "kunde", title: "Kunde", render: row => {
                    const link = resolveKundenLink(row);
                    return link ? <Link className="detail-link" to={link}>{row.kunde}</Link> : row.kunde;
                } },
                { field: "stufe", title: "Stufe" },
                { field: "status", title: "Status" }
            ]}
            focusField="rechnungsnr"
            detailLinkResolver={({ field, row, value }) => {
                if (field === "rechnungsnr") return `/rechnungen?focus=${value}`;
                if (field === "kunde") return resolveKundenLink(row);
                return null;
            }}
            rowActions={[{ name: "cancel", label: "Stornieren", permission: "buchhaltung.bearbeiten", onClick: stornieren, variant: "danger" }]}
        />
        <DataTable
            title="Mahnbare offene Rechnungen"
            selectableColumns={false}
            data={offeneRechnungen}
            columns={[
                { field: "rechnungsnr", title: "Rechnung", render: row => <Link className="detail-link" to={`/rechnungen?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link> },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "betrag", title: "Betrag" },
                { field: "datum", title: "Datum" }
            ]}
            focusField="rechnungsnr"
            detailLinkResolver={({ field, row, value }) => {
                if (field === "rechnungsnr") return `/rechnungen?focus=${value}`;
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                return null;
            }}
            rowActions={[{ name: "remind", label: "Mahnung erstellen", permission: "buchhaltung.bearbeiten", onClick: erzeugen, variant: "warning" }]}
        />
    </>;
}
