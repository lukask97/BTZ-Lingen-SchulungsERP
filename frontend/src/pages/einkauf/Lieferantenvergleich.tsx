import DataTable from "../../components/DataTable";
import OverviewCards from "../../components/OverviewCards";
import lieferantenService from "../../services/einkauf/lieferantenService";

export default function Lieferantenvergleich() {
    const lieferanten = lieferantenService.list();

    const favoritMarkieren = (lieferant) => {
        lieferanten.forEach(item => {
            lieferantenService.update({ ...item, favorit: item.id === lieferant.id });
        });
    };

    const bester = [...lieferanten].sort((a, b) => Number(b.bewertung || 0) - Number(a.bewertung || 0))[0];

    return <>
        <OverviewCards cards={[
            { label: "Lieferanten", value: lieferanten.length },
            { label: "Bester Lieferant", value: bester?.firma || "–" },
            { label: "Favorit gesetzt", value: lieferanten.filter(item => item.favorit).length }
        ]}/>
        <DataTable
            title="Lieferantenvergleich"
            selectableColumns={false}
            data={lieferanten.map(item => ({
                ...item,
                favoritLabel: item.favorit ? "Ja" : "Nein"
            }))}
            columns={[
                { field: "firma", title: "Lieferant" },
                { field: "segment", title: "Segment" },
                { field: "bewertung", title: "Bewertung" },
                { field: "fuerBts", title: "Für BTS" },
                { field: "favoritLabel", title: "Favorit" }
            ]}
            rowActions={[{ name: "favorite", label: "Als Favorit markieren", permission: "einkauf.bearbeiten", onClick: favoritMarkieren, variant: "success" }]}
        />
    </>;
}
