import { useState } from "react";
import DataTable from "../components/DataTable";
import OverviewCards from "../components/OverviewCards";
import retourenService from "../services/retourenService";

export default function Retouren() {
    const [retouren, setRetouren] = useState(retourenService.list());

    const abschliessen = (retoure) => {
        retourenService.update({ ...retoure, status: "abgeschlossen" });
        setRetouren(retourenService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Retouren", value: retouren.length },
            { label: "Eingegangen", value: retouren.filter(item => item.status === "eingegangen").length },
            { label: "Abgeschlossen", value: retouren.filter(item => item.status === "abgeschlossen").length }
        ]}/>
        <DataTable
            title="Retouren"
            selectableColumns={false}
            data={retouren}
            columns={[
                { field: "retourenNr", title: "Retourennummer" },
                { field: "kunde", title: "Kunde" },
                { field: "artikel", title: "Artikel" },
                { field: "datum", title: "Datum" },
                { field: "grund", title: "Grund" },
                { field: "status", title: "Status" }
            ]}
            rowActions={[{ name: "done", label: "Abschließen", permission: "logistik.bearbeiten", onClick: abschliessen, variant: "success", isVisible: row => row.status !== "abgeschlossen" }]}
        />
    </>;
}
