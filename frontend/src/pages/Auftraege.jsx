import { useState } from "react";
import DataTable from "../components/DataTable";
import auftraegeService from "../services/auftraegeService";
import OverviewCards from "../components/OverviewCards";

export default function Auftraege() {
    const [auftraege] = useState(auftraegeService.getAll());
    const [statusFilter, setStatusFilter] = useState("");
    const data = auftraege.map(auftrag => ({
        ...auftrag,
        positionenText: auftrag.positionen.map(position => `${position.artikel} (${position.menge})`).join(", ")
    }));
    const offeneAuftraege = auftraege.filter(auftrag => auftrag.status === "offen");
    const positionen = auftraege.reduce((summe, auftrag) => summe + auftrag.positionen.length, 0);

    return <>
        <OverviewCards cards={[
            { label: "Aufträge gesamt", value: auftraege.length },
            { label: "Noch offen", value: offeneAuftraege.length },
            { label: "Auftragspositionen", value: positionen }
        ]}/>
        <DataTable title="Aufträge" selectableColumns={false} data={data.filter(item => !statusFilter || item.status === statusFilter)}
        columns={[
            { field: "auftragNr", title: "Auftragsnummer" }, { field: "kunde", title: "Kunde" },
            { field: "datum", title: "Datum" }, { field: "status", title: "Status" },
            { field: "positionenText", title: "Positionen" }
        ]}
        filters={[{ name: "status", label: "Status", options: [{ value: "offen", label: "Offen" }] }]}
        onFilter={filters => setStatusFilter(filters.status || "")}
        />
    </>;
}
