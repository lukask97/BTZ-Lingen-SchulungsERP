import DataTable from "../../components/DataTable";
import abteilungenService from "../../services/organisation/abteilungenService";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";

export default function Organisation() {
    useDataSyncRefresh(["abteilungen"]);

    const abteilungen = abteilungenService.getAll().map(abteilung => ({
        ...abteilung,
        aufgabenText: abteilung.aufgaben.join(", ")
    }));

    return <>
        <h1>Organisation und Verantwortlichkeiten</h1>
        <p>Die Übersicht ordnet die Fachmodule den Abteilungen und Verantwortungsbereichen zu.</p>
        <DataTable
            title="Abteilungen"
            selectableColumns={false}
            data={abteilungen}
            columns={[
                { field: "kuerzel", title: "Kürzel" },
                { field: "name", title: "Abteilung" },
                { field: "zuordnung", title: "Zuordnung" },
                { field: "aufgabenText", title: "Aufgaben" }
            ]}
        />
    </>;
}
