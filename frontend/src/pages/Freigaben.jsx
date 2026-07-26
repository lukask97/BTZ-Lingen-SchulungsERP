import { useState } from "react";
import DataTable from "../components/DataTable";
import OverviewCards from "../components/OverviewCards";
import freigabenService from "../services/freigabenService";

export default function Freigaben() {
    const [freigaben, setFreigaben] = useState(freigabenService.list());

    const freigeben = (item) => {
        freigabenService.update({ ...item, status: "freigegeben" });
        setFreigaben(freigabenService.list());
    };

    const ablehnen = (item) => {
        freigabenService.update({ ...item, status: "abgelehnt" });
        setFreigaben(freigabenService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Freigaben", value: freigaben.length },
            { label: "Offen", value: freigaben.filter(item => item.status === "offen").length },
            { label: "Freigegeben", value: freigaben.filter(item => item.status === "freigegeben").length },
            { label: "Abgelehnt", value: freigaben.filter(item => item.status === "abgelehnt").length }
        ]}/>
        <DataTable
            title="Freigaben"
            selectableColumns={false}
            data={freigaben}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "titel", title: "Vorgang" },
                { field: "bereich", title: "Bereich" },
                { field: "verantwortung", title: "Verantwortung" },
                { field: "status", title: "Status" }
            ]}
            rowActions={[
                { name: "approve", label: "Freigeben", permission: "gf.bearbeiten", onClick: freigeben, variant: "success", isVisible: row => row.status === "offen" },
                { name: "reject", label: "Ablehnen", permission: "gf.bearbeiten", onClick: ablehnen, variant: "danger", isVisible: row => row.status === "offen" }
            ]}
        />
    </>;
}
