import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import TextField from "../../components/form/TextField";
import TextArea from "../../components/form/TextArea";
import Label from "../../components/form/Label";

import useAuth from "../../auth/useAuth";
import { useCRUDPage } from "../../hooks/useCRUDPage";
import rechteService from "../../services/verwaltung/rechteService";
import { getAllTableColumns, getVisibleTableColumns, INITIAL_DATA, PAGE_CONFIG } from "../../constants/schemas";
import { useMemo } from "react";

export default function Rechte() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.rechte;
    
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
        handleClose,
        error
    } = useCRUDPage(config.tableName, INITIAL_DATA.rechte, rechteService, {
        requiredFields: [
            { field: "name", label: "Name" }
        ]
    });

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

    return (
        <>
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
                    { name: "new", label: "Neues Recht", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <Dialog
                open={open}
                title={editMode ? "Recht bearbeiten" : "Neues Recht"}
                onClose={handleClose}
            >
                <Label required>Name</Label>
                <TextField value={currentItem.name} onChange={v => handleFieldChange("name", v)} />

                <div className="form-row">
                    <Label>Beschreibung</Label>
                    <TextArea
                        rows={2}
                        placeholder="Beschreibung des Rechts..."
                        value={currentItem.beschreibung}
                        onChange={v => handleFieldChange("beschreibung", v)}
                    />
                </div>

                <div className="form-row">
                    {error && <p className="form-error">{error}</p>}
                    <button onClick={speichern}>Speichern</button>
                </div>
            </Dialog>
        </>
    );
}
