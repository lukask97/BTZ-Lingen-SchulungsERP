import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import useAuth from "../../auth/useAuth";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";
import rechteService from "../../services/verwaltung/rechteService";
import rollenService from "../../services/verwaltung/rollenService";

const columns = [
    { field: "name", title: "Recht" },
    { field: "beschreibung", title: "Beschreibung" },
    { field: "rollenText", title: "Zugeordnete Rollen" }
];

export default function Rechte() {
    const { user } = useAuth();
    const refreshTick = useDataSyncRefresh(["rechte", "rollen", "rollenRechte"]);
    const [search, setSearch] = useState("");

    const rechteMitRollen = useMemo(() => {
        const rollen = rollenService.getAll();
        return rechteService.getAll().map(recht => {
            const zugeordneteRollen = rollen
                .filter(rolle => (rolle.permissions || []).includes(recht.name))
                .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "de"));

            return {
                ...recht,
                rollenText: zugeordneteRollen.length > 0
                    ? zugeordneteRollen.map(rolle => rolle.name).join(", ")
                    : "Keiner Rolle zugeordnet",
                rollen: zugeordneteRollen.map(rolle => ({
                    label: rolle.name,
                    to: `/rollen?focus=${rolle.id}`
                }))
            };
        });
    }, [refreshTick]);

    const sichtbareRechte = useMemo(() => {
        const suchbegriff = search.trim().toLowerCase();
        if (!suchbegriff) return rechteMitRollen;
        return rechteMitRollen.filter(recht =>
            [recht.name, recht.beschreibung, recht.rollenText].join(" ").toLowerCase().includes(suchbegriff)
        );
    }, [rechteMitRollen, search]);

    return <div className="rechte-page erp-page-stack">
        <section className="module-panel rechte-overview">
            <div>
                <p className="header-kicker">Verwaltung</p>
                <h1>Rechteübersicht</h1>
                <p>Alle im System vorhandenen Rechte und die damit ausgestatteten Rollen. Rechte werden hier ausschließlich angezeigt.</p>
            </div>
            <div className="rechte-count" aria-label={`${rechteMitRollen.length} Rechte vorhanden`}>
                <strong>{rechteMitRollen.length}</strong>
                <span>vorhandene Rechte</span>
            </div>
        </section>

        <DataTable
            title="Vorhandene Rechte"
            tableName="rechte"
            username={user.username}
            columns={columns}
            allColumns={columns}
            data={sichtbareRechte}
            searchable={true}
            pageSize={Math.max(10, sichtbareRechte.length)}
            onSearch={setSearch}
            selectableColumns={false}
            toolbarActions={[]}
            rowActions={[]}
            page={1}
        />
    </div>;
}
