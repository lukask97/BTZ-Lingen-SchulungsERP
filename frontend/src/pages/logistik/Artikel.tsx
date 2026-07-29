// @ts-nocheck
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import TextField from "../../components/form/TextField";
import TextArea from "../../components/form/TextArea";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";

import { getColumns, getAllColumns } from "../../services/core/metadataService";
import useAuth from "../../auth/useAuth";
import { useCRUDPage } from "../../hooks/useCRUDPage";
import artikelService from "../../services/logistik/artikelService";
import kategorienService from "../../services/logistik/kategorienService";
import { INITIAL_DATA, PAGE_CONFIG } from "../../constants/schemas";
import { useState, useMemo } from "react";

export default function Artikel() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.artikel;
    
    const {
        allData,
        open,
        editMode,
        pageSize,
        search,
        currentItem,
        setPageSize,
        setSearch,
        setCurrentItem,
        neu,
        bearbeiten,
        loeschen,
        speichern,
        handleClose
    } = useCRUDPage(config.tableName, INITIAL_DATA.artikel, artikelService);

    const columns = getColumns(config.tableName, user.username);
    const allColumns = getAllColumns(config.tableName);
    const kategorien = useMemo(() => kategorienService.list(), []);

    const [categoryFilter, setCategoryFilter] = useState("");
    const [komponenteId, setKomponenteId] = useState("");
    const [komponentenMenge, setKomponentenMenge] = useState(1);

    const handleFieldChange = (field, value) => {
        setCurrentItem({ ...currentItem, [field]: value });
    };

    const komponentenOptionen = useMemo(() => allData
        .filter(item => item.id !== currentItem.id)
        .map(item => ({
            value: String(item.id),
            label: `${item.artikelNr} - ${item.name} (${item.artikelTyp || "Einzelartikel"})`
        })), [allData, currentItem.id]);
    const kategorienOptionen = useMemo(() => kategorien.map(item => ({
        value: String(item.id),
        label: item.pfad
    })), [kategorien]);

    const komponenteHinzufuegen = () => {
        const auswahl = allData.find(item => String(item.id) === String(komponenteId));
        if (!auswahl || Number(komponentenMenge) <= 0) return;

        setCurrentItem(item => {
            const vorhandeneKomponenten = Array.isArray(item.komponenten) ? item.komponenten : [];
            const vorhanden = vorhandeneKomponenten.find(eintrag => eintrag.artikelId === auswahl.id);
            if (vorhanden) {
                return {
                    ...item,
                    komponenten: vorhandeneKomponenten.map(eintrag => eintrag.artikelId === auswahl.id
                        ? { ...eintrag, menge: eintrag.menge + Number(komponentenMenge) }
                        : eintrag)
                };
            }
            return {
                ...item,
                komponenten: [...vorhandeneKomponenten, {
                    artikelId: auswahl.id,
                    artikel: auswahl.name,
                    menge: Number(komponentenMenge)
                }]
            };
        });
        setKomponenteId("");
        setKomponentenMenge(1);
    };

    const komponenteEntfernen = (artikelId) => {
        setCurrentItem(item => ({
            ...item,
            komponenten: (item.komponenten || []).filter(eintrag => eintrag.artikelId !== artikelId)
        }));
    };

    const handleFilterChange = (filters) => {
        setCategoryFilter(filters.kategorie || "");
    };

    const filteredDisplayData = useMemo(() => {
        // Filter auf ungefilterte Daten anwenden
        let filtered = allData;
        if (categoryFilter) {
            filtered = filtered.filter(item => String(item.kategorieId) === String(categoryFilter));
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
    }, [allData, categoryFilter, search]);

    const artikelFilters = useMemo(() => [
        {
            name: "kategorie",
            label: "Kategorie",
            options: kategorien.map(item => ({ value: String(item.id), label: item.pfad }))
        }
    ], [kategorien]);

    return (
        <>
            <DataTable
                title={config.title}
                tableName={config.tableName}
                username={user.username}
                columns={columns}
                allColumns={allColumns}
                data={filteredDisplayData}
                filters={artikelFilters}
                onFilter={handleFilterChange}
                searchable={true}
                pageSize={pageSize}
                onSearch={setSearch}
                onPageSizeChange={setPageSize}
                toolbarActions={[
                    { name: "new", label: "Neuer Artikel", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <Dialog
                open={open}
                title={editMode ? "Artikel bearbeiten" : "Neuer Artikel"}
                onClose={handleClose}
            >
                <Label required>Artikelnummer</Label>
                <TextField value={currentItem.artikelNr} onChange={v => handleFieldChange("artikelNr", v)} />

                <Label required>Name</Label>
                <TextField value={currentItem.name} onChange={v => handleFieldChange("name", v)} />

                <Label>Kategorie</Label>
                <LookupField value={currentItem.kategorieId || ""} options={kategorienOptionen} onChange={value => {
                    const kategorie = kategorien.find(item => String(item.id) === String(value));
                    setCurrentItem(item => ({
                        ...item,
                        kategorieId: value,
                        kategorie: kategorie?.pfad.split(" > ")[0] || "",
                        kategoriePfad: kategorie?.pfad || ""
                    }));
                }} placeholder="Kategorie waehlen..." />

                <Label>Typ</Label>
                <select value={currentItem.artikelTyp || "Einzelartikel"} onChange={event => handleFieldChange("artikelTyp", event.target.value)}>
                    <option value="Einzelartikel">Einzelartikel</option>
                    <option value="Komponente">Komponente</option>
                    <option value="Baugruppe">Baugruppe</option>
                </select>

                <Label>Einkaufspreis</Label>
                <NumberField value={currentItem.einkaufspreis} min="0" step="0.01" format="currency" onChange={v => handleFieldChange("einkaufspreis", Number(v || 0))} />

                <Label>Verkaufspreis</Label>
                <NumberField value={currentItem.verkaufspreis} min="0" step="0.01" format="currency" onChange={v => handleFieldChange("verkaufspreis", Number(v || 0))} />

                <div className="form-row">
                    <p>Ohne EK-Preis gilt der Artikel als selbst hergestellt. Ohne VK-Preis ist er nicht verkaufbar. Komponenten und Baugruppen können verkauft werden, sobald ein VK-Preis hinterlegt ist.</p>
                </div>

                <Label>Bestand</Label>
                <NumberField value={currentItem.bestand} min="0" step="1" onChange={v => handleFieldChange("bestand", Number(v || 0))} />

                {currentItem.artikelTyp === "Baugruppe" && <>
                    <div className="form-row bestellposition-hinzufuegen">
                        <div>
                            <Label>Komponente</Label>
                            <LookupField
                                value={komponenteId}
                                options={komponentenOptionen}
                                onChange={setKomponenteId}
                                placeholder="Komponente suchen..."
                            />
                        </div>
                        <div>
                            <Label>Menge</Label>
                            <NumberField value={komponentenMenge} min="1" step="1" onChange={v => setKomponentenMenge(Number(v || 1))} />
                        </div>
                        <button type="button" onClick={komponenteHinzufuegen}>Komponente hinzufügen</button>
                    </div>
                    <div className="form-row">
                        <Label>Stückliste</Label>
                        {currentItem.komponenten?.length
                            ? <ul className="positionsliste">
                                {currentItem.komponenten.map(position => <li key={position.artikelId}>
                                    {position.artikel}: {position.menge}
                                    <button type="button" className="link-button" onClick={() => komponenteEntfernen(position.artikelId)}>Entfernen</button>
                                </li>)}
                            </ul>
                            : <p>Noch keine Komponenten hinterlegt.</p>}
                    </div>
                </>}

                <div className="form-row">
                    <Label>Beschreibung</Label>
                    <TextArea
                        rows={2}
                        placeholder="Beschreibung des Artikels..."
                        value={currentItem.beschreibung}
                        onChange={v => handleFieldChange("beschreibung", v)}
                    />
                </div>

                <div className="form-row">
                    <button onClick={speichern}>Speichern</button>
                </div>
            </Dialog>
        </>
    );
}
