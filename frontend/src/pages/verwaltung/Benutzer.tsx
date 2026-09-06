import { useEffect, useMemo, useRef, useState } from "react";
import useAuth from "../../auth/useAuth";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import TextField from "../../components/form/TextField";
import SaveButton from "../../components/SaveButton";
import { getAllTableColumns, getVisibleTableColumns, INITIAL_DATA, PAGE_CONFIG } from "../../constants/schemas";
import { useCRUDPage } from "../../hooks/useCRUDPage";
import { listKlassen } from "../../services/admin/klassenService";
import benutzerService from "../../services/verwaltung/benutzerService";
import rollenService from "../../services/verwaltung/rollenService";
import {
    buildUsername,
    exportUsersToExcel,
    generateSimplePassword,
    normalizeImportedUsers,
    parseUserImportFile
} from "../../utils/userSpreadsheet";
import { getUserDisplayNameWithRole } from "../../utils/userDisplay";

export default function Benutzer() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.benutzer;
    const activeClassId = String((user.activeClass as any)?.id ?? "");

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
        refreshData,
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
    const rollen = useMemo(() => rollenService.list(), []);
    const roleOptions = useMemo(() => rollen.map(item => item.name), [rollen]);

    const [roleFilter, setRoleFilter] = useState("");
    const [importRole, setImportRole] = useState("Verkauf Azubi");
    const [klassen, setKlassen] = useState<any[]>([]);
    const [classFilter, setClassFilter] = useState(activeClassId);
    const [importClassId, setImportClassId] = useState("0");
    const [importError, setImportError] = useState("");
    const [importSummary, setImportSummary] = useState("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFieldChange = (field, value) => {
        setCurrentItem({ ...currentItem, [field]: value });
    };

    useEffect(() => {
        void listKlassen().then(items => {
            setKlassen(items);
            if (items.length > 0 && !items.some(item => String(item.id) === String(importClassId))) {
                setImportClassId(String(items[0].id));
            }
        }).catch(() => setKlassen([]));
    }, []);

    useEffect(() => {
        setClassFilter(activeClassId);
    }, [activeClassId]);

    const getClassName = (classId) => {
        const klasse = klassen.find(item => String(item.id) === String(classId));
        return klasse?.name || (classId !== undefined && classId !== null && classId !== "" ? `Klasse ${classId}` : "-");
    };

    const getUserClassIds = (item) => {
        if (Array.isArray(item.klasseIds)) return item.klasseIds.map(String);
        if (item.klasseId !== undefined && item.klasseId !== null && item.klasseId !== "") return [String(item.klasseId)];
        return [];
    };

    const setUserClassIds = (values: string[]) => {
        setCurrentItem({
            ...currentItem,
            klasseIds: values,
            klasseId: values[0] || ""
        });
    };

    const handleFilterChange = (filters) => {
        setRoleFilter(filters.rolle || "");
        setClassFilter(filters.klasse || "");
    };

    const filteredDisplayData = useMemo(() => {
        let filtered = allData;
        if (roleFilter) filtered = filtered.filter(item => item.rolle === roleFilter);
        if (classFilter) filtered = filtered.filter(item => getUserClassIds(item).includes(String(classFilter)));
        if (search) {
            filtered = filtered.filter(item =>
                Object.values(item)
                    .join(" ")
                    .toLowerCase()
                    .includes(search.toLowerCase())
            );
        }
        return filtered;
    }, [allData, roleFilter, classFilter, search]);

    const benutzerFilters = useMemo(() => [
        {
            name: "rolle",
            label: "Rolle",
            options: roleOptions.map(role => ({ value: role, label: role }))
        },
        {
            name: "klasse",
            label: "Klasse",
            options: klassen.map(klasse => ({ value: String(klasse.id), label: klasse.name }))
        }
    ], [roleOptions, klassen]);

    const displayData = useMemo(() => filteredDisplayData.map(item => ({
        ...item,
        klasse: getUserClassIds(item).map(getClassName).join(", ")
    })), [filteredDisplayData, klassen]);

    const exportiereBenutzer = () => {
        exportUsersToExcel(
            allData.map(item => ({
                Vorname: item.vorname || String(item.name || "").split(" ").slice(0, -1).join(" "),
                Nachname: item.nachname || String(item.name || "").split(" ").slice(-1).join(" "),
                Benutzername: item.username || "",
                Passwort: item.password || "",
                Rolle: item.rolle || "",
                Klasse: getUserClassIds(item).map(getClassName).join(", "),
                "E-Mail": item.email || ""
            })),
            "Benutzer_Export"
        );
    };

    const oeffneDateiauswahl = () => {
        setImportError("");
        fileInputRef.current?.click();
    };

    const importiereBenutzerliste = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportError("");
        setImportSummary("");

        try {
            const parsedRows = await parseUserImportFile(file);
            const importedUsers = normalizeImportedUsers(parsedRows);

            if (importedUsers.length === 0) {
                setImportError("Keine gültigen Zeilen gefunden. Erwartet werden mindestens die Spalten Vorname und Name oder Nachname.");
                return;
            }

            const existingUsernames = benutzerService.list().map(item => String(item.username || ""));
            const createdUsers = importedUsers.map(item => {
                const username = buildUsername(item.vorname, item.nachname, existingUsernames);
                existingUsernames.push(username);

                return benutzerService.create({
                    vorname: item.vorname,
                    nachname: item.nachname,
                    username,
                    email: `${username}@schulung.local`,
                    password: generateSimplePassword(),
                    rolle: importRole,
                    klasseId: importClassId,
                    klasseIds: [importClassId]
                });
            });

            setImportSummary(`${createdUsers.length} Benutzer wurden angelegt und als Excel exportiert.`);
            refreshData();
            exportUsersToExcel(
                createdUsers.map(item => ({
                    Vorname: item.vorname || "",
                    Nachname: item.nachname || "",
                    Benutzername: item.username || "",
                    Passwort: item.password || "",
                    Rolle: item.rolle || "",
                    Klasse: getUserClassIds(item).map(getClassName).join(", "),
                    "E-Mail": item.email || ""
                })),
                "Benutzer_Import_Ergebnis"
            );
        } catch {
            setImportError("Die Datei konnte nicht gelesen werden. Bitte eine Excel-Datei mit Vorname und Name oder Nachname hochladen.");
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <>
            <DataTable
                title={config.title}
                tableName={config.tableName}
                username={user.username}
                columns={columns}
                allColumns={allColumns}
                data={displayData}
                filters={benutzerFilters}
                initialFilters={{ klasse: classFilter }}
                onFilter={handleFilterChange}
                searchable={true}
                pageSize={pageSize}
                onSearch={setSearch}
                onPageSizeChange={setPageSize}
                toolbarActions={[
                    { name: "import", label: "Schülerliste importieren", permission: config.permissionCreate, onClick: oeffneDateiauswahl },
                    { name: "export", label: "Benutzer exportieren", permission: config.permissionCreate, onClick: exportiereBenutzer },
                    { name: "new", label: "Neuer Benutzer", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <section className="module-panel">
                <h2>Schülerliste importieren</h2>
                <p>Die Excel-Datei soll mindestens die Spalten <strong>Vorname</strong> und <strong>Name</strong> oder <strong>Nachname</strong> enthalten. Benutzername und Passwort werden automatisch erzeugt.</p>
                <div className="form-row">
                    <div>
                        <Label>Rolle für importierte Nutzer</Label>
                        <select name="import-role" value={importRole} onChange={event => setImportRole(event.target.value)}>
                            {roleOptions.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label>Klasse fuer importierte Nutzer</Label>
                        <select name="import-class" value={importClassId} onChange={event => setImportClassId(event.target.value)}>
                            {klassen.map(klasse => <option key={klasse.id} value={klasse.id}>{klasse.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="thread-document-links">
                    <button type="button" onClick={oeffneDateiauswahl}>Excel auswählen</button>
                    <button type="button" className="button-secondary" onClick={exportiereBenutzer}>Alle Benutzer als Excel</button>
                </div>
                <input
                    ref={fileInputRef}
                    name="import-file"
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    onChange={importiereBenutzerliste}
                />
                {importSummary && <p>{importSummary}</p>}
                {importError && <p className="form-error">{importError}</p>}
            </section>

            <Dialog
                open={open}
                title={editMode ? "Benutzer bearbeiten" : "Neuer Benutzer"}
                onClose={handleClose}
                footer={<SaveButton onSave={speichern} onSuccess={handleClose}>Speichern</SaveButton>}
            >
                <Label>Vorname</Label>
                <TextField value={currentItem.vorname || ""} onChange={v => handleFieldChange("vorname", v)} />

                <Label>Nachname</Label>
                <TextField value={currentItem.nachname || ""} onChange={v => handleFieldChange("nachname", v)} />

                <Label required>Benutzername</Label>
                <TextField value={currentItem.username} onChange={v => handleFieldChange("username", v)} />

                <Label required>Email</Label>
                <TextField value={currentItem.email} onChange={v => handleFieldChange("email", v)} />

                <Label required>Passwort</Label>
                <TextField value={currentItem.password} onChange={v => handleFieldChange("password", v)} type="password" />

                <Label required>Rolle</Label>
                <TextField value={currentItem.rolle} onChange={v => handleFieldChange("rolle", v)} />

                <Label>Klassen</Label>
                <select
                    name="klasseIds"
                    multiple
                    value={getUserClassIds(currentItem)}
                    onChange={event => setUserClassIds(Array.from(event.target.selectedOptions).map(option => option.value))}
                >
                    {klassen.map(klasse => <option key={klasse.id} value={String(klasse.id)}>{klasse.name}</option>)}
                </select>

                <Label>Anzeigename</Label>
                <TextField value={getUserDisplayNameWithRole(currentItem, "")} onChange={() => {}} disabled />

                <div className="form-row">{error && <p className="form-error">{error}</p>}</div>
            </Dialog>
        </>
    );
}
