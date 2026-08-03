import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import TextField from "../../components/form/TextField";
import Label from "../../components/form/Label";

import useAuth from "../../auth/useAuth";
import { useCRUDPage } from "../../hooks/useCRUDPage";
import benutzerService from "../../services/verwaltung/benutzerService";
import { getAllTableColumns, getVisibleTableColumns, INITIAL_DATA, PAGE_CONFIG } from "../../constants/schemas";
import { useState, useMemo } from "react";

export default function Benutzer() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.benutzer;
    
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
    } = useCRUDPage(config.tableName, INITIAL_DATA.benutzer, benutzerService, {
        requiredFields: [
            { field: "username", label: "Benutzername" },
            { field: "email", label: "Email" },
            { field: "password", label: "Passwort" },
            { field: "rolle", label: "Rolle" }
        ]
    });

    const columns = getVisibleTableColumns(config.tableName);
    const allColumns = getAllTableColumns(config.tableName);

    const [roleFilter, setRoleFilter] = useState("");

    const handleFieldChange = (field, value) => {
        setCurrentItem({ ...currentItem, [field]: value });
    };

    const handleFilterChange = (filters) => {
        setRoleFilter(filters.rolle || "");
    };

    const filteredDisplayData = useMemo(() => {
        // Filter auf ungefilterte Daten anwenden
        let filtered = allData;
        if (roleFilter) filtered = filtered.filter(item => item.rolle === roleFilter);
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
    }, [allData, roleFilter, search]);

    const benutzerFilters = useMemo(() => [
        {
            name: "rolle",
            label: "Rolle",
            options: [
                { value: "Admin", label: "Admin" },
                { value: "Lager", label: "Lager" },
                { value: "Buchhaltung", label: "Buchhaltung" }
            ]
        }
    ], []);

    return (
        <>
            <DataTable
                title={config.title}
                tableName={config.tableName}
                username={user.username}
                columns={columns}
                allColumns={allColumns}
                data={filteredDisplayData}
                filters={benutzerFilters}
                onFilter={handleFilterChange}
                searchable={true}
                pageSize={pageSize}
                onSearch={setSearch}
                onPageSizeChange={setPageSize}
                toolbarActions={[
                    { name: "new", label: "Neuer Benutzer", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <Dialog
                open={open}
                title={editMode ? "Benutzer bearbeiten" : "Neuer Benutzer"}
                onClose={handleClose}
            >
                <Label required>Benutzername</Label>
                <TextField value={currentItem.username} onChange={v => handleFieldChange("username", v)} />

                <Label required>Email</Label>
                <TextField value={currentItem.email} onChange={v => handleFieldChange("email", v)} />

                <Label required>Passwort</Label>
                <TextField value={currentItem.password} onChange={v => handleFieldChange("password", v)} type="password" />

                <Label required>Rolle</Label>
                <TextField value={currentItem.rolle} onChange={v => handleFieldChange("rolle", v)} />

                <div className="form-row">
                    {error && <p className="form-error">{error}</p>}
                    <button onClick={speichern}>Speichern</button>
                </div>
            </Dialog>
        </>
    );
}
