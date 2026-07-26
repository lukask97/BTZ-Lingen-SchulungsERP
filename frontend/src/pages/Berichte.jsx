import { useState } from "react";
import DataTable from "../components/DataTable";
import OverviewCards from "../components/OverviewCards";
import berichteService from "../services/berichteService";

export default function Berichte() {
    const [berichte] = useState(berichteService.list());

    return <>
        <OverviewCards cards={[
            { label: "Berichte", value: berichte.length },
            { label: "Fertig", value: berichte.filter(item => item.status === "fertig").length },
            { label: "Entwürfe", value: berichte.filter(item => item.status !== "fertig").length }
        ]}/>
        <DataTable
            title="Berichte"
            selectableColumns={false}
            data={berichte}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "titel", title: "Titel" },
                { field: "bereich", title: "Bereich" },
                { field: "status", title: "Status" },
                { field: "zusammenfassung", title: "Zusammenfassung" }
            ]}
        />
    </>;
}
