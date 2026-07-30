import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import TextField from "../../components/form/TextField";
import Label from "../../components/form/Label";

import useAuth from "../../auth/useAuth";
import { useCRUDPage } from "../../hooks/useCRUDPage";
import lagerService from "../../services/logistik/lagerService";
import { getAllTableColumns, getVisibleTableColumns, INITIAL_DATA, PAGE_CONFIG } from "../../constants/schemas";
import { useMemo } from "react";
import OverviewCards from "../../components/OverviewCards";

export default function Lager() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.lager;
    
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
    } = useCRUDPage(config.tableName, INITIAL_DATA.lager, lagerService);

    const columns = getVisibleTableColumns(config.tableName);
    const allColumns = getAllTableColumns(config.tableName);

    const handleFieldChange = (field, value) => {
        setCurrentItem({ ...currentItem, [field]: value });
    };

    const filteredDisplayData = useMemo(() => {
        // Filter auf ungefilterte Daten anwenden
        let filtered = allData;
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
    }, [allData, search]);
    const kapazitaet = allData.reduce((summe, item) => summe + Number(item.kapazitaet || 0), 0);

    return (
        <>
            <OverviewCards cards={[
                { label: "Lager gesamt", value: allData.length },
                { label: "Durchschnittskapazität", value: allData.length ? Math.round(kapazitaet / allData.length) : 0 },
                { label: "Gesamtkapazität", value: kapazitaet }
            ]}/>
            <DataTable
                title={config.title}
                tableName={config.tableName}
                username={user.username}
                columns={columns}
                allColumns={allColumns}
                data={filteredDisplayData}
                searchable={true}
                pageSize={pageSize}
                onSearch={setSearch}
                onPageSizeChange={setPageSize}
                toolbarActions={[
                    { name: "new", label: "Neues Lager", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <Dialog
                open={open}
                title={editMode ? "Lager bearbeiten" : "Neues Lager"}
                onClose={handleClose}
            >
                <Label required>Name</Label>
                <TextField value={currentItem.name} onChange={v => handleFieldChange("name", v)} />

                <Label>Standort</Label>
                <TextField value={currentItem.standort} onChange={v => handleFieldChange("standort", v)} />

                <Label>Kapazität</Label>
                <TextField value={currentItem.kapazitaet} onChange={v => handleFieldChange("kapazitaet", v)} />

                <div className="form-row">
                    <button onClick={speichern}>Speichern</button>
                </div>
            </Dialog>
        </>
    );
}
