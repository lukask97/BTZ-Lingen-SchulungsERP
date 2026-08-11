import { Link } from "react-router-dom";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import OverviewCards from "../../components/OverviewCards";
import { PERMISSIONS } from "../../constants/permissions";
import mahnungenService from "../../services/buchhaltung/mahnungenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import { isOpenItem, isOverdueOpenItem } from "../../utils/openItems";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { getBerlinDate } from "../../utils/dateTime";

export default function Mahnungen() {
    const today = getBerlinDate();
    const [mahnungen, setMahnungen] = useSyncedServiceData(
        ["mahnungen", "auftraege", "bestellungen", "zahlungen", "kunden"],
        () => mahnungenService.list()
    );

    const resolveKundenLink = (row) => {
        const rechnung = row.rechnungId ? rechnungenService.getById(row.rechnungId) : null;
        if (rechnung?.kundeId) return `/kunden?focus=${rechnung.kundeId}`;
        return null;
    };

    const erzeugen = (rechnung) => {
        mahnungenService.create({
            rechnungId: rechnung.id,
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

    const offeneRechnungen = rechnungenService.list().filter(item => isOpenItem(item) && item.rechnungstyp === "Ausgangsrechnung");
    const ueberfaelligeRechnungen = offeneRechnungen.filter(isOverdueOpenItem);

    return <>
        <OverviewCards cards={[
            { label: "Mahnungen", value: mahnungen.length },
            { label: "Offene Posten", value: offeneRechnungen.length },
            { label: "Überfällig", value: ueberfaelligeRechnungen.length },
            { label: "Gesendet", value: mahnungen.filter(item => item.status === "gesendet").length }
        ]}/>
        <DataTable
            title="Mahnungen"
            selectableColumns={false}
            data={mahnungen}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "rechnungsnr", title: "Rechnung", render: row => <Link className="detail-link" to={`/ausgangsrechnungen?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link> },
                { field: "kunde", title: "Kunde", render: row => {
                    const link = resolveKundenLink(row);
                    return link ? <Link className="detail-link" to={link}>{row.kunde}</Link> : row.kunde;
                } },
                { field: "stufe", title: "Stufe" },
                { field: "status", title: "Status" }
            ]}
            focusField="rechnungsnr"
            detailLinkResolver={({ field, row, value }) => {
                if (field === "rechnungsnr") return `/ausgangsrechnungen?focus=${value}`;
                if (field === "kunde") return resolveKundenLink(row);
                return null;
            }}
            rowActions={[{ name: "cancel", label: "Stornieren", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: stornieren, variant: "danger" }]}
        />
        <DataTable
            title="Mahnbare offene Posten"
            selectableColumns={false}
            data={offeneRechnungen}
            columns={[
                { field: "rechnungsnr", title: "Rechnung", render: row => <Link className="detail-link" to={`/ausgangsrechnungen?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link> },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "betrag", title: "Betrag" },
                { field: "datum", title: "Datum" }
            ]}
            focusField="rechnungsnr"
            detailLinkResolver={({ field, row, value }) => {
                if (field === "rechnungsnr") return `/ausgangsrechnungen?focus=${value}`;
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                return null;
            }}
            rowActions={[{ name: "remind", label: "Mahnung erstellen", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: erzeugen, variant: "warning" }]}
        />
    </>;
}
