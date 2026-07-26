import { Link } from "react-router-dom";
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
        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Retouren als Lernfall</h2>
                    <span>Logistik und Service</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Retouren zeigen, dass der Warenfluss auch nach dem Versand weitergeht.</li>
                    <li>Gründe wie Transportschaden oder Falschlieferung sollen dokumentiert werden.</li>
                    <li>Je nach Fall kann daraus eine Reklamation oder Ersatzlieferung entstehen.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Querverweise</h2>
                    <span>Folgeprozesse</span>
                </div>
                <div className="link-list">
                    <Link className="button-link" to="/versand">Versand öffnen</Link>
                    <Link className="button-link" to="/reklamationen">Reklamationen öffnen</Link>
                    <Link className="button-link" to="/logistik">Zur Logistik</Link>
                </div>
            </article>
        </section>
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
