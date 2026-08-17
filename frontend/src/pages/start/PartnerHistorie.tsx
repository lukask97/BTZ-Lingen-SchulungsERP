import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import kundenService from "../../services/verkauf/customerService";
import lieferantenService from "../../services/einkauf/lieferantenService";
import angeboteService from "../../services/verkauf/angeboteService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import bestellungenService from "../../services/einkauf/bestellungenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { exportRowsToExcel } from "../../utils/excelExport";

type PartnerTyp = "kunde" | "lieferant";
type HistorieTab = "angebote" | "auftraege" | "bestellungen" | "rechnungen";

const KUNDEN_TABS: { key: HistorieTab; label: string }[] = [
    { key: "angebote", label: "Angebote" },
    { key: "auftraege", label: "Aufträge" },
    { key: "rechnungen", label: "Rechnungen" }
];

const LIEFERANTEN_TABS: { key: HistorieTab; label: string }[] = [
    { key: "bestellungen", label: "Bestellungen" },
    { key: "rechnungen", label: "Rechnungen" }
];

function euro(value: unknown) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

export default function PartnerHistorie() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTyp = searchParams.get("typ") === "lieferant" ? "lieferant" : "kunde";
    const [partnerTyp, setPartnerTyp] = useState<PartnerTyp>(initialTyp);
    const [kunden] = useSyncedServiceData(["kunden"], () => kundenService.getAll());
    const [lieferanten] = useSyncedServiceData(["lieferanten"], () => lieferantenService.getAll());
    const [angebote] = useSyncedServiceData(["angebote"], () => angeboteService.getAll());
    const [auftraege] = useSyncedServiceData(["auftraege"], () => auftraegeService.getAll());
    const [bestellungen] = useSyncedServiceData(["bestellungen"], () => bestellungenService.getAll());
    const [rechnungen] = useSyncedServiceData(["auftraege", "bestellungen"], () => rechnungenService.getAll());
    const initialPartnerId = searchParams.get("id") || "";
    const [selectedPartnerId, setSelectedPartnerId] = useState(initialPartnerId);
    const [activeTab, setActiveTab] = useState<HistorieTab>(initialTyp === "lieferant" ? "bestellungen" : "auftraege");

    const partnerOptionen = useMemo(
        () => (partnerTyp === "kunde" ? kunden : lieferanten).map(item => ({
            value: String(item.id),
            label: `${partnerTyp === "kunde" ? item.kundenNr : item.lieferantenNr} - ${item.firma}`
        })),
        [kunden, lieferanten, partnerTyp]
    );

    const selectedPartner = useMemo(
        () => (partnerTyp === "kunde" ? kunden : lieferanten).find(item => String(item.id) === String(selectedPartnerId)),
        [kunden, lieferanten, partnerTyp, selectedPartnerId]
    );

    const tabs = partnerTyp === "kunde" ? KUNDEN_TABS : LIEFERANTEN_TABS;

    const kundenAngebote = useMemo(
        () => angebote
            .filter(item => String(item.kundeId || "") === String(selectedPartnerId))
            .map(item => ({
                id: item.id,
                nummer: item.angebotsNr,
                datum: item.datum,
                status: item.status,
                freigabe: item.freigabeStatus || "-",
                gesamt: euro(item.gesamtbetrag || 0),
                link: `/angebote?focus=${item.id}`
            })),
        [angebote, selectedPartnerId]
    );

    const kundenAuftraege = useMemo(
        () => auftraege
            .filter(item => String(item.kundeId || "") === String(selectedPartnerId))
            .map(item => ({
                id: item.id,
                nummer: item.auftragNr,
                datum: item.datum,
                status: item.status,
                gesamt: euro(item.gesamtbetrag || 0),
                link: `/auftraege?focus=${item.id}`
            })),
        [auftraege, selectedPartnerId]
    );

    const partnerBestellungen = useMemo(
        () => bestellungen
            .filter(item => String(item.lieferantId || "") === String(selectedPartnerId))
            .map(item => ({
                id: item.id,
                nummer: item.bestellNr,
                datum: item.datum,
                status: item.status,
                gesamt: euro(item.gesamtbetrag || 0),
                link: `/bestellungen?focus=${item.id}`
            })),
        [bestellungen, selectedPartnerId]
    );

    const partnerRechnungen = useMemo(
        () => rechnungen
            .filter(item => partnerTyp === "kunde"
                 ? String(item.kundeId || "") === String(selectedPartnerId) && item.rechnungstyp === "Ausgangsrechnung"
                : String(item.lieferantId || "") === String(selectedPartnerId) && item.rechnungstyp === "Eingangsrechnung"
            )
            .map(item => ({
                id: item.id,
                nummer: item.rechnungsnr,
                datum: item.datum,
                faelligAm: item.faelligAm || "-",
                status: item.status,
                betrag: euro(item.betrag),
                link: `/${item.rechnungstyp === "Eingangsrechnung" ? "eingangsrechnungen" : "ausgangsrechnungen"}?focus=${item.rechnungsnr}`
            })),
        [partnerTyp, rechnungen, selectedPartnerId]
    );

    const visibleData = activeTab === "angebote"
        ? kundenAngebote
        : activeTab === "auftraege"
            ? kundenAuftraege
            : activeTab === "bestellungen"
                ? partnerBestellungen
                : partnerRechnungen;

    const columns = activeTab === "rechnungen"
        ? [
            { field: "nummer", title: "Rechnung", render: row => <Link className="detail-link" to={row.link}>{row.nummer}</Link> },
            { field: "datum", title: "Datum" },
            { field: "faelligAm", title: "Fällig am" },
            { field: "status", title: "Status" },
            { field: "betrag", title: "Betrag" }
        ]
        : [
            { field: "nummer", title: activeTab === "angebote" ? "Angebot" : activeTab === "auftraege" ? "Auftrag" : "Bestellung", render: row => <Link className="detail-link" to={row.link}>{row.nummer}</Link> },
            { field: "datum", title: "Datum" },
            { field: "status", title: "Status" },
            ...(activeTab === "angebote" ? [{ field: "freigabe", title: "Freigabe" }] : []),
            { field: "gesamt", title: "Gesamt" }
        ];

    const exportColumns = activeTab === "rechnungen"
        ? [
            { key: "nummer", label: "Rechnung" },
            { key: "datum", label: "Datum" },
            { key: "faelligAm", label: "Fällig am" },
            { key: "status", label: "Status" },
            { key: "betrag", label: "Betrag" }
        ]
        : [
            { key: "nummer", label: activeTab === "angebote" ? "Angebot" : activeTab === "auftraege" ? "Auftrag" : "Bestellung" },
            { key: "datum", label: "Datum" },
            { key: "status", label: "Status" },
            ...(activeTab === "angebote" ? [{ key: "freigabe", label: "Freigabe" }] : []),
            { key: "gesamt", label: "Gesamt" }
        ];

    const updateRoute = (nextTyp: PartnerTyp, nextId: string) => {
        const nextTab = nextTyp === "kunde" ? "auftraege" : "bestellungen";
        setPartnerTyp(nextTyp);
        setSelectedPartnerId(nextId);
        setActiveTab(nextTab);
        navigate(`/partnerhistorie?typ=${nextTyp}${nextId ? `&id=${nextId}` : ""}`);
    };

    const exportiereAktuellenTab = () => {
        if (!selectedPartner || !selectedPartnerId || visibleData.length === 0) {
            return;
        }

        const tabLabel = tabs.find(item => item.key === activeTab)?.label || "Historie";
        exportRowsToExcel({
            fileName: `${selectedPartner.firma}_${tabLabel}`,
            sheetName: tabLabel,
            columns: exportColumns,
            rows: visibleData.map(item => Object.fromEntries(
                exportColumns.map(column => [column.key, item[column.key]])
            ))
        });
    };

    return <>
        <h1>Partnerhistorie</h1>
        <p>Hier lassen sich Vorgänge zu einem Kunden oder Lieferanten gebündelt nachschlagen. Die Auswahl funktioniert wie bei den Vertriebsdokumenten über ein Suchfeld.</p>

        <section className="module-panel">
            <div className="personalakte-toolbar">
                <div className="personalakte-select">
                    <Label>Partnerart</Label>
                    <select name="partner-typ" value={partnerTyp} onChange={event => updateRoute(event.target.value as PartnerTyp, "")}>
                        <option value="kunde">Kunde</option>
                        <option value="lieferant">Lieferant</option>
                    </select>
                </div>
                <div className="personalakte-select">
                    <Label>{partnerTyp === "kunde" ? "Kunde auswählen" : "Lieferant auswählen"}</Label>
                    <LookupField
                        value={selectedPartnerId}
                        options={partnerOptionen}
                        onChange={value => {
                            setSelectedPartnerId(value);
                            navigate(`/partnerhistorie?typ=${partnerTyp}&id=${value}`);
                        }}
                        placeholder={partnerTyp === "kunde" ? "Kunde suchen..." : "Lieferant suchen..."}
                    />
                </div>
                <div className="personalakte-links">
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={exportiereAktuellenTab}
                        disabled={!selectedPartnerId || visibleData.length === 0}
                    >
                        Excel exportieren
                    </button>
                    <Link className="button-link" to={partnerTyp === "kunde" ? "/kunden" : "/lieferanten"}>
                        {partnerTyp === "kunde" ? "Kunden öffnen" : "Lieferanten öffnen"}
                    </Link>
                </div>
            </div>
            {selectedPartner && <div className="personalakte-summary">
                <div><span>{partnerTyp === "kunde" ? "Kunde" : "Lieferant"}</span><strong>{selectedPartner.firma}</strong></div>
                <div><span>Nummer</span><strong>{partnerTyp === "kunde" ? selectedPartner.kundenNr : selectedPartner.lieferantenNr}</strong></div>
                <div><span>Ort</span><strong>{selectedPartner.ort || "-"}</strong></div>
                <div><span>IBAN</span><strong>{selectedPartner.iban || "-"}</strong></div>
            </div>}
        </section>

        <div className="kennzahlen" role="tablist" aria-label="Partnerhistorie Tabs">
            {tabs.map(tab => <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`kennzahl kennzahl-button${activeTab === tab.key ? " is-active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
            >
                <span>{tab.label}</span>
                <strong>{tab.key === "angebote"
                    ? kundenAngebote.length
                    : tab.key === "auftraege"
                        ? kundenAuftraege.length
                        : tab.key === "bestellungen"
                            ? partnerBestellungen.length
                            : partnerRechnungen.length}
                </strong>
            </button>)}
        </div>

        <DataTable
            title={selectedPartner
                ? `${tabs.find(item => item.key === activeTab)?.label || "Historie"} von ${selectedPartner.firma}`
                : "Partnerhistorie"}
            selectableColumns={false}
            data={selectedPartnerId ? visibleData : []}
            columns={columns}
            detailLinkResolver={({ field, row }) => field === "nummer" ? row.link : null}
        />
    </>;
}
