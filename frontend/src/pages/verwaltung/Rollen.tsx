import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import TextField from "../../components/form/TextField";
import Checkbox from "../../components/form/Checkbox";
import Label from "../../components/form/Label";

import useAuth from "../../auth/useAuth";
import { useCRUDPage } from "../../hooks/useCRUDPage";
import rollenService from "../../services/verwaltung/rollenService";
import { getAllTableColumns, getVisibleTableColumns, INITIAL_DATA, PAGE_CONFIG, PERMISSION_GROUPS } from "../../constants/schemas";
import { useMemo } from "react";

export default function Rollen() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.rollen;
    
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
    } = useCRUDPage(config.tableName, INITIAL_DATA.rollen, rollenService);

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

    const handlePermissionToggle = (permission) => {
        const permissions = currentItem.permissions || [];
        if (permissions.includes(permission)) {
            handleFieldChange("permissions", permissions.filter(p => p !== permission));
        } else {
            handleFieldChange("permissions", [...permissions, permission]);
        }
    };

    const handleGroupToggle = (groupPermissions) => {
        const permissions = currentItem.permissions || [];
        const groupKeys = groupPermissions.map(p => p.key);
        const allSelected = groupKeys.every(key => permissions.includes(key));

        if (allSelected) {
            handleFieldChange("permissions", permissions.filter(p => !groupKeys.includes(p)));
        } else {
            const newPermissions = [...new Set([...permissions, ...groupKeys])];
            handleFieldChange("permissions", newPermissions);
        }
    };

    const isPermissionChecked = (permission) => {
        return (currentItem.permissions || []).includes(permission);
    };

    const isGroupChecked = (groupPermissions) => {
        const groupKeys = groupPermissions.map(p => p.key);
        return groupKeys.every(key => isPermissionChecked(key));
    };

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
                    { name: "new", label: "Neue Rolle", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <Dialog
                open={open}
                title={editMode ? "Rolle bearbeiten" : "Neue Rolle"}
                onClose={handleClose}
            >
                <Label required>Name</Label>
                <TextField value={currentItem.name} onChange={v => handleFieldChange("name", v)} />

                <Label>Beschreibung</Label>
                <TextField value={currentItem.beschreibung} onChange={v => handleFieldChange("beschreibung", v)} />

                <div className="form-row">
                    <Label>Berechtigungen</Label>
                    <div style={{ marginTop: "1rem", marginBottom: "1rem", border: "1px solid #ddd", padding: "1rem", borderRadius: "4px", maxHeight: "400px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                        {Object.entries(PERMISSION_GROUPS).map(([groupName, groupPermissions]) => (
                            <div key={groupName}>
                                <div style={{ marginBottom: "0.5rem" }}>
                                    <Checkbox
                                        checked={isGroupChecked(groupPermissions)}
                                        onChange={() => handleGroupToggle(groupPermissions)}
                                    >
                                        <strong>{groupName}</strong>
                                    </Checkbox>
                                </div>
                                <div style={{ marginLeft: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    {groupPermissions.map(permission => (
                                        <Checkbox
                                            key={permission.key}
                                            checked={isPermissionChecked(permission.key)}
                                            onChange={() => handlePermissionToggle(permission.key)}
                                        >
                                            {permission.label}
                                        </Checkbox>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="form-row">
                    <button onClick={speichern}>Speichern</button>
                </div>
            </Dialog>
        </>
    );
}
