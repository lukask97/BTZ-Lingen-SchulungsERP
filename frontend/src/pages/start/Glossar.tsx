import glossaryEntries from "../../content/glossary.json";
import DataTable from "../../components/DataTable";

export default function Glossar() {
    const data = Object.entries(glossaryEntries).map(([begriff, erklaerung]) => ({
        id: begriff,
        begriff,
        erklaerung
    }));

    return <>
        <h1>Glossar</h1>
        <p>Diese Seite bündelt die zentralen Begriffe aus dem Schulungs-ERP an einer Stelle.</p>
        <DataTable
            title="Begriffe und Erklärungen"
            selectableColumns={false}
            searchable
            data={data}
            columns={[
                { field: "begriff", title: "Begriff" },
                { field: "erklaerung", title: "Erklärung" }
            ]}
        />
    </>;
}
