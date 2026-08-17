import DataTable from "../../components/DataTable";
import OverviewCards from "../../components/OverviewCards";
import { PERMISSIONS } from "../../constants/permissions";
import lieferantenService from "../../services/einkauf/lieferantenService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";
import { useNavigate } from "react-router-dom";

export default function Lieferantenvergleich() {
    const navigate = useNavigate();
    useStorageSyncRefresh(["lieferanten"]);
    const lieferanten = lieferantenService.list();

    const alsAMarkieren = (lieferant) => {
        lieferanten.forEach(item => {
            lieferantenService.update({
                ...item,
                abc: item.id === lieferant.id ? "A" : item.abc === "A" ? "B" : (item.abc || "C")
            });
        });
    };

    const bester = [...lieferanten].sort((a, b) => Number(b.bewertung || 0) - Number(a.bewertung || 0))[0] || null;

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
                { field: "fuerBts", title: "Notiz" },
                { field: "abc", title: "ABC" }
            ]}
            rowActions={[
                { name: "favorite", label: "Als A markieren", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: alsAMarkieren, variant: "success" },
                { name: "new", label: "Anfrage starten", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: lieferant => navigate(`/bestellungen?new=lieferantenvergleich&lieferantId=${lieferant.id}`), variant: "secondary" }
            ]}
        />
    </>;
}
