import { useState } from "react";
import DataTable from "../components/DataTable";
import OverviewCards from "../components/OverviewCards";
import mahnungenService from "../services/mahnungenService";
import rechnungenService from "../services/rechnungenService";

const today = "2026-07-26";

export default function Mahnungen() {
    const [mahnungen, setMahnungen] = useState(mahnungenService.list());

    const erzeugen = (rechnung) => {
        mahnungenService.create({
            rechnungsnr: rechnung.rechnungsnr,
            kunde: rechnung.kunde,
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

    const offeneRechnungen = rechnungenService.list().filter(item => item.status === "offen");

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
                { field: "rechnungsnr", title: "Rechnung" },
                { field: "kunde", title: "Kunde" },
                { field: "stufe", title: "Stufe" },
                { field: "status", title: "Status" }
            ]}
            rowActions={[{ name: "cancel", label: "Stornieren", permission: "buchhaltung.bearbeiten", onClick: stornieren, variant: "danger" }]}
        />
        <DataTable
            title="Mahnbare offene Rechnungen"
            selectableColumns={false}
            data={offeneRechnungen}
            columns={[
                { field: "rechnungsnr", title: "Rechnung" },
                { field: "kunde", title: "Kunde" },
                { field: "betrag", title: "Betrag" },
                { field: "datum", title: "Datum" }
            ]}
            rowActions={[{ name: "remind", label: "Mahnung erstellen", permission: "buchhaltung.bearbeiten", onClick: erzeugen, variant: "warning" }]}
        />
    </>;
}
