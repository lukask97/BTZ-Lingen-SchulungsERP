import DataTable from "../../components/DataTable";
import OverviewCards from "../../components/OverviewCards";
import lieferantenService from "../../services/einkauf/lieferantenService";

export default function Lieferantenvergleich() {
    const lieferanten = lieferantenService.list();

    const alsAMarkieren = (lieferant) => {
        lieferanten.forEach(item => {
            lieferantenService.update({
                ...item,
                abc: item.id === lieferant.id ? "A" : item.abc === "A" ? "B" : (item.abc || "C")
            });
        });
    };

    const bester = [...lieferanten].sort((a, b) => Number(b.bewertung || 0) - Number(a.bewertung || 0))[0];

    return <>
        <OverviewCards cards={[
            { label: "Lieferanten", value: lieferanten.length },
            { label: "Bester Lieferant", value: bester?.firma || "-" },
            { label: "ABC A", value: lieferanten.filter(item => item.abc === "A").length }
        ]}/>
        <DataTable
            title="Lieferantenvergleich"
            selectableColumns={false}
            data={lieferanten}
            columns={[
                { field: "firma", title: "Lieferant" },
                { field: "segment", title: "Segment" },
                { field: "bewertung", title: "Bewertung" },
                { field: "fuerBts", title: "Fuer BTS" },
                { field: "abc", title: "ABC" }
            ]}
            rowActions={[{ name: "favorite", label: "Als A markieren", permission: "einkauf.bearbeiten", onClick: alsAMarkieren, variant: "success" }]}
        />
    </>;
}
