// @ts-nocheck
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import TextField from "../components/form/TextField";
import LookupField from "../components/form/LookupField";
import Label from "../components/form/Label";

import { getColumns, getAllColumns } from "../services/metadataService";
import useAuth from "../auth/useAuth";
import { useCRUDPage } from "../hooks/useCRUDPage";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import artikelService from "../services/artikelService";
import bestellungenService from "../services/bestellungenService";
import rechnungenService from "../services/rechnungenService";
import kundenService from "../services/customerService";
import lieferantenService from "../services/lieferantenService";
import { INITIAL_DATA, PAGE_CONFIG } from "../constants/schemas";
import { useEffect, useMemo, useState } from "react";

const today = "2026-07-26";

function ampelStatus(rechnung) {
    if (rechnung.status === "bezahlt") return "bezahlt";
    if (rechnung.status === "storniert") return "storniert";
    if (rechnung.faelligAm && rechnung.faelligAm < today) return "fällig";
    return "offen";
}

export default function Rechnungen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const config = PAGE_CONFIG.rechnungen;
    
    const {
        allData,
        open,
        editMode,
        pageSize,
        search,
        currentItem,
        setOpen,
        setPageSize,
        setSearch,
        setCurrentItem,
        neu,
        bearbeiten,
        loeschen,
        speichern,
        handleClose
    } = useCRUDPage(config.tableName, INITIAL_DATA.rechnungen, rechnungenService);

    const columns = getColumns(config.tableName, user.username);
    const allColumns = getAllColumns(config.tableName);
    const kunden = kundenService.list();
    const lieferanten = lieferantenService.list();
    const bestellungen = bestellungenService.list();
    const artikel = artikelService.list();
    const kundenOptionen = kunden.map(item => ({ value: String(item.id), label: `${item.kundenNr} - ${item.firma}` }));
    const lieferantenOptionen = lieferanten.map(item => ({ value: String(item.id), label: `${item.lieferantenNr} - ${item.firma}` }));

    const [statusFilter, setStatusFilter] = useState("");
    const [typFilter, setTypFilter] = useState("");

    const displayData = useMemo(() => allData.map(item => ({ ...item, ampel: ampelStatus(item) })), [allData]);
    const ampelKennzahlen = useMemo(() => ({
        offen: displayData.filter(item => item.ampel === "offen").length,
        faellig: displayData.filter(item => item.ampel === "fällig").length,
        bezahlt: displayData.filter(item => item.ampel === "bezahlt").length,
        storniert: displayData.filter(item => item.ampel === "storniert").length
    }), [displayData]);
    const beispielBelegnummern = useMemo(() => {
        const ausgang = displayData.find(item => item.rechnungstyp === "Ausgangsrechnung")?.rechnungsnr || "RE-2026-001";
        const eingang = displayData.find(item => item.rechnungstyp === "Eingangsrechnung")?.rechnungsnr || "ER-2026-001";
        return { ausgang, eingang };
    }, [displayData]);

    useEffect(() => {
        if (searchParams.get("new") !== "eingangsrechnung") return;

        const bestellungId = searchParams.get("bestellungId") || "";
        const bestellung = bestellungen.find(item => String(item.id) === String(bestellungId));
        const lieferantId = searchParams.get("lieferantId") || String(bestellung?.lieferantId || "");
        const lieferant = lieferanten.find(item => String(item.id) === String(lieferantId));
        const berechneterBetrag = bestellung
            ? bestellung.positionen.reduce((summe, position) => {
                const artikelEintrag = artikel.find(item => item.id === position.artikelId);
                return summe + Number(position.menge) * Number(artikelEintrag?.einkaufspreis ?? artikelEintrag?.preis ?? 0);
            }, 0)
            : 0;
        const betrag = Number(searchParams.get("betrag") || berechneterBetrag || 0);
        const sequenz = allData.filter(item => item.rechnungstyp === "Eingangsrechnung").length + 1;

        setCurrentItem({
            ...INITIAL_DATA.rechnungen,
            rechnungsnr: `ER-2026-${String(sequenz).padStart(3, "0")}`,
            rechnungstyp: "Eingangsrechnung",
            kundeId: "",
            lieferantId,
            kunde: lieferant?.firma || "",
            bestellungId,
            bestellNr: searchParams.get("bestellNr") || bestellung?.bestellNr || "",
            datum: today,
            faelligAm: today,
            betrag
        });
        setOpen(true);
    }, [searchParams, bestellungen, lieferanten, artikel, allData, setCurrentItem, setOpen]);

    const resolvePartnerLink = (row) => {
        if (row.rechnungstyp === "Eingangsrechnung") {
            const lieferantId = row.lieferantId || lieferanten.find(item => item.firma === row.kunde)?.id;
            return lieferantId ? `/lieferanten?focus=${lieferantId}` : null;
        }
        const kundeId = row.kundeId || kunden.find(item => item.firma === row.kunde)?.id;
        return kundeId ? `/kunden?focus=${kundeId}` : null;
    };

    const handleFieldChange = (field, value) => {
        setCurrentItem({ ...currentItem, [field]: value });
    };

    const handlePartnerChange = (value) => {
        const istAusgang = currentItem.rechnungstyp !== "Eingangsrechnung";
        const partnerListe = istAusgang ? kunden : lieferanten;
        const partner = partnerListe.find(item => String(item.id) === String(value));
        setCurrentItem({
            ...currentItem,
            kundeId: istAusgang ? value : "",
            lieferantId: istAusgang ? "" : value,
            kunde: partner?.firma || ""
        });
    };

    const handleFilterChange = (filters) => {
        setStatusFilter(filters.status || "");
        setTypFilter(filters.rechnungstyp || "");
    };

    const filteredDisplayData = useMemo(() => {
        // Filter auf ungefilterte Daten anwenden
        let filtered = [...displayData];
        if (typFilter) {
            filtered = filtered.filter(item => item.rechnungstyp === typFilter);
        }
        if (statusFilter) {
            filtered = filtered.filter(item => item.ampel === statusFilter || item.status === statusFilter);
        }
        // Dann Suche anwenden
        if (search) {
            filtered = filtered.filter(item =>
                Object.values(item)
                    .join(" ")
                    .toLowerCase()
                    .includes(search.toLowerCase())
            );
        }
        return filtered;
    }, [displayData, statusFilter, typFilter, search]);

    const rechnungFilters = useMemo(() => [
        {
            name: "rechnungstyp",
            label: "Typ",
            options: [
                { value: "Ausgangsrechnung", label: "Ausgangsrechnung" },
                { value: "Eingangsrechnung", label: "Eingangsrechnung" }
            ]
        },
        {
            name: "status",
            label: "Status",
            options: [
                { value: "offen", label: "Offen" },
                { value: "fällig", label: "Fällig" },
                { value: "bezahlt", label: "Bezahlt" },
                { value: "storniert", label: "Storniert" }
            ]
        }
    ], []);

    return (
        <>
            <section className="dashboard-two-column">
                <article className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <h2>Statusampel</h2>
                        <span>Buchhaltung</span>
                    </div>
                    <div className="ampel-grid">
                        <div className="ampel-card ampel-open">
                            <span>Gelb</span>
                            <strong>{ampelKennzahlen.offen}</strong>
                            <small>offen, aber noch nicht fällig</small>
                        </div>
                        <div className="ampel-card ampel-due">
                            <span>Rot</span>
                            <strong>{ampelKennzahlen.faellig}</strong>
                            <small>fällig oder überfällig</small>
                        </div>
                        <div className="ampel-card ampel-paid">
                            <span>Grün</span>
                            <strong>{ampelKennzahlen.bezahlt}</strong>
                            <small>bereits bezahlt</small>
                        </div>
                        <div className="ampel-card ampel-cancelled">
                            <span>Grau</span>
                            <strong>{ampelKennzahlen.storniert}</strong>
                            <small>storniert oder hinfällig</small>
                        </div>
                    </div>
                </article>

                <article className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <h2>Belegnummernlogik</h2>
                        <span>Lernhilfe</span>
                    </div>
                    <ul className="dashboard-note-list">
                        <li><strong>Ausgangsrechnung:</strong> Beispiel <code>{beispielBelegnummern.ausgang}</code> für einen Kundenvorgang.</li>
                        <li><strong>Eingangsrechnung:</strong> Beispiel <code>{beispielBelegnummern.eingang}</code> für einen Lieferantenvorgang.</li>
                        <li>Über den Bestellbezug lässt sich eine Eingangsrechnung mit dem Einkauf verbinden.</li>
                        <li>Über Belegfluss, Zahlungen und Mahnungen bleibt derselbe Vorgang in mehreren Modulen nachvollziehbar.</li>
                    </ul>
                </article>
            </section>

            <DataTable
                title={config.title}
                tableName={config.tableName}
                username={user.username}
                columns={columns.map(column => {
                    if (column.field === "status") {
                        return {
                            ...column,
                            field: "ampel",
                            title: "Ampel / Status",
                            render: row => <span className={`ampel-badge ampel-${row.ampel === "fällig" ? "due" : row.ampel === "offen" ? "open" : row.ampel === "bezahlt" ? "paid" : "cancelled"}`}>
                                {row.ampel === "fällig" ? "Rot - fällig" : row.ampel === "offen" ? "Gelb - offen" : row.ampel === "bezahlt" ? "Grün - bezahlt" : "Grau - storniert"}
                            </span>
                        };
                    }
                    if (column.field === "kunde") {
                        return {
                            ...column,
                            render: row => {
                                const link = resolvePartnerLink(row);
                                return link ? <Link className="detail-link" to={link}>{row.kunde}</Link> : row.kunde;
                            }
                        };
                    }
                    if (column.field === "bestellNr") {
                        return {
                            ...column,
                            render: row => row.bestellungId ? <Link className="detail-link" to={`/bestellungen?focus=${row.bestellungId}`}>{row.bestellNr}</Link> : row.bestellNr
                        };
                    }
                    return column;
                })}
                allColumns={allColumns.map(column => column.field === "status" ? { ...column, field: "ampel", title: "Ampel / Status" } : column)}
                data={filteredDisplayData}
                focusRowId={searchParams.get("focus") || ""}
                focusField="rechnungsnr"
                detailLinkResolver={({ field, row }) => {
                    if (field === "kunde") return resolvePartnerLink(row);
                    if (field === "bestellNr" && row.bestellungId) return `/bestellungen?focus=${row.bestellungId}`;
                    return null;
                }}
                filters={rechnungFilters}
                onFilter={handleFilterChange}
                searchable={true}
                pageSize={pageSize}
                onSearch={setSearch}
                onPageSizeChange={setPageSize}
                toolbarActions={[
                    { name: "new", label: "Neue Rechnung", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "documents", label: "Belegfluss", permission: config.permissionEdit, onClick: row => navigate(`/belege?bezug=${row.rechnungsnr}`), variant: "secondary" },
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <Dialog
                open={open}
                title={editMode ? "Rechnung bearbeiten" : "Neue Rechnung"}
                onClose={handleClose}
            >
                <Label required>Rechnungsnummer</Label>
                <TextField value={currentItem.rechnungsnr} onChange={v => handleFieldChange("rechnungsnr", v)} />

                <Label>Rechnungstyp</Label>
                <select value={currentItem.rechnungstyp} onChange={event => setCurrentItem(item => ({ ...item, rechnungstyp: event.target.value, kundeId: "", lieferantId: "", kunde: "" }))}>
                    <option value="Ausgangsrechnung">Ausgangsrechnung</option>
                    <option value="Eingangsrechnung">Eingangsrechnung</option>
                </select>

                <Label required>{currentItem.rechnungstyp === "Eingangsrechnung" ? "Lieferant" : "Kunde"}</Label>
                <LookupField
                    value={currentItem.rechnungstyp === "Eingangsrechnung"
                        ? currentItem.lieferantId || String(lieferanten.find(item => item.firma === currentItem.kunde)?.id || "")
                        : currentItem.kundeId || String(kunden.find(item => item.firma === currentItem.kunde)?.id || "")}
                    options={currentItem.rechnungstyp === "Eingangsrechnung" ? lieferantenOptionen : kundenOptionen}
                    onChange={handlePartnerChange}
                    placeholder={currentItem.rechnungstyp === "Eingangsrechnung" ? "Lieferant suchen..." : "Kunde suchen..."}
                />

                <Label>Datum</Label>
                <TextField value={currentItem.datum} onChange={v => handleFieldChange("datum", v)} type="date" />

                {currentItem.rechnungstyp === "Eingangsrechnung" && <>
                    <Label>Bestellbezug</Label>
                    <TextField value={currentItem.bestellNr || ""} onChange={v => handleFieldChange("bestellNr", v)} />
                </>}

                <Label>Fällig am</Label>
                <TextField value={currentItem.faelligAm || ""} onChange={v => handleFieldChange("faelligAm", v)} type="date" />

                <Label>Betrag</Label>
                <TextField value={currentItem.betrag} onChange={v => handleFieldChange("betrag", v)} type="number" />

                <Label>Status</Label>
                <select value={currentItem.status} onChange={event => handleFieldChange("status", event.target.value)}>
                    <option value="offen">Offen</option>
                    <option value="bezahlt">Bezahlt</option>
                    <option value="storniert">Storniert</option>
                </select>

                <Label>Mahnstufe</Label>
                <select value={currentItem.mahnstufe || "-"} onChange={event => handleFieldChange("mahnstufe", event.target.value)}>
                    <option value="-">-</option>
                    <option value="1. Mahnung">1. Mahnung</option>
                    <option value="2. Mahnung">2. Mahnung</option>
                </select>

                <div className="form-row">
                    <button onClick={speichern}>Speichern</button>
                </div>
            </Dialog>
        </>
    );
}
