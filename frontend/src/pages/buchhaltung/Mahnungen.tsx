import { Link } from "react-router-dom";
import DataTable from "../../components/DataTable";
import OverviewCards from "../../components/OverviewCards";
import { PERMISSIONS } from "../../constants/permissions";
import mahnungenService from "../../services/buchhaltung/mahnungenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import { canCreateReminder, canTransferToInkasso, getNextMahnstufe } from "../../utils/accountingWorkflow";
import { isOpenItem } from "../../utils/openItems";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { getBerlinDate } from "../../utils/dateTime";

export default function Mahnungen() {
    const today = getBerlinDate();
    const [mahnungen, setMahnungen] = useSyncedServiceData(
        ["mahnungen", "auftraege", "bestellungen", "zahlungen", "kunden", "rechnungen"],
        () => mahnungenService.list()
    );

    const refresh = () => setMahnungen(mahnungenService.list());

    const resolveKundenLink = (row: any) => {
        const rechnung = row.rechnungId ? rechnungenService.getById(row.rechnungId) : null;
        if (rechnung?.kundeId) return `/kunden?focus=${rechnung.kundeId}`;
        return null;
    };

    const erzeugen = (rechnung: any) => {
        mahnungenService.create({
            rechnungId: rechnung.id,
            datum: today,
            status: "gesendet",
            stufe: getNextMahnstufe(mahnungenService.list().filter(item => String(item.rechnungId || "") === String(rechnung.id) && item.status !== "storniert"))
        });
        refresh();
    };

    const inkasso = (rechnung: any) => {
        mahnungenService.create({
            rechnungId: rechnung.id,
            datum: today,
            status: "uebergeben",
            stufe: "Inkasso"
        });
        refresh();
    };

    const stornieren = (mahnung: any) => {
        mahnungenService.update({ ...mahnung, status: "storniert" });
        refresh();
    };

    const offeneRechnungen = rechnungenService.list().filter(item => isOpenItem(item) && item.rechnungstyp === "Ausgangsrechnung");
    const mahnbareRechnungen = offeneRechnungen.filter(item => canCreateReminder(item, item.zahlungen || [], item.mahnungen || [], today));
    const inkassoRechnungen = offeneRechnungen.filter(item => canTransferToInkasso(item, item.zahlungen || [], item.mahnungen || [], today));

    return <>
        <OverviewCards cards={[
            { label: "Mahnungen", value: mahnungen.length },
            { label: "Mahnbare Posten", value: mahnbareRechnungen.length },
            { label: "Inkasso faellig", value: inkassoRechnungen.length },
            { label: "Gesendet", value: mahnungen.filter(item => item.status === "gesendet").length }
        ]}/>
        <DataTable
            title="Mahnungen und Inkasso"
            selectableColumns={false}
            data={mahnungen}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "rechnungsnr", title: "Rechnung", render: row => <Link className="detail-link" to={`/ausgangsrechnungen?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link> },
                { field: "kunde", title: "Kunde", render: row => {
                    const link = resolveKundenLink(row);
                    return link ? <Link className="detail-link" to={link}>{row.kunde}</Link> : row.kunde;
                } },
                { field: "stufe", title: "Stufe" },
                { field: "fristPhase", title: "Fristbezug" },
                { field: "status", title: "Status" }
            ]}
            focusField="rechnungsnr"
            detailLinkResolver={({ field, row, value }) => {
                if (field === "rechnungsnr") return `/ausgangsrechnungen?focus=${value}`;
                if (field === "kunde") return resolveKundenLink(row);
                return null;
            }}
            rowActions={[{ name: "cancel", label: "Stornieren", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: stornieren, variant: "danger" }]}
        />
        <DataTable
            title="Mahnbare offene Posten"
            selectableColumns={false}
            data={mahnbareRechnungen}
            columns={[
                { field: "rechnungsnr", title: "Rechnung", render: row => <Link className="detail-link" to={`/ausgangsrechnungen?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link> },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "betrag", title: "Betrag" },
                { field: "faelligAm", title: "Faellig am" },
                { field: "nextAction", title: "Naechster Schritt" }
            ]}
            focusField="rechnungsnr"
            detailLinkResolver={({ field, row, value }) => {
                if (field === "rechnungsnr") return `/ausgangsrechnungen?focus=${value}`;
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                return null;
            }}
            rowActions={[{ name: "remind", label: "Mahnstufe anlegen", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: erzeugen, variant: "warning" }]}
        />
        <DataTable
            title="Inkasso-Kandidaten"
            selectableColumns={false}
            data={inkassoRechnungen}
            columns={[
                { field: "rechnungsnr", title: "Rechnung", render: row => <Link className="detail-link" to={`/ausgangsrechnungen?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link> },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "betrag", title: "Betrag" },
                { field: "mahnstufe", title: "Bisherige Stufe" },
                { field: "nextAction", title: "Naechster Schritt" }
            ]}
            rowActions={[{ name: "inkasso", label: "An Inkasso uebergeben", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: inkasso, variant: "danger" }]}
        />
    </>;
}
