import { useEffect, useMemo, useState } from "react";
import { clearTableCache } from "../../services/core/dataCache";
import { clearClassData, downloadBackup, getBackupStatus, inspectBackup, restoreBackup } from "../../services/admin/backupService";
import lehrkraftOptionenService from "../../services/lehrkraft/lehrkraftOptionenService";
import { resetSeedData } from "../../services/seed/dataSync";
import fristenOptionenService from "../../services/verwaltung/fristenOptionenService";
import nummernkreiseService from "../../services/verwaltung/nummernkreiseService";
import unternehmenService from "../../services/verwaltung/unternehmenService";

type RestoreGroup = {
    id: string;
    label: string;
    tables: string[];
};

type BackupClassSummary = {
    id: string | number;
    name: string;
    datenbankName: string;
    status?: string;
    tableCounts: Record<string, number>;
};

type BackupSummary = {
    version: number;
    createdAt: string;
    classes: BackupClassSummary[];
    commonTableCounts: Record<string, number>;
    imageCount: number;
    restoreGroups: RestoreGroup[];
};

type ClassMapping = {
    sourceId: string;
    targetMode: "existing" | "new" | "skip";
    targetClassId: string;
    newClassName: string;
    restoreMode: "replace" | "merge";
    groups: string[];
};

const DEFAULT_GROUPS = ["gesamt"];

function sumCounts(counts: Record<string, number | null | undefined> = {}) {
    return Object.values(counts).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function formatDate(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString("de-DE");
}

export default function Backup() {
    const [klassen, setKlassen] = useState<BackupClassSummary[]>([]);
    const [restoreGroups, setRestoreGroups] = useState<RestoreGroup[]>([]);
    const [commonCount, setCommonCount] = useState(0);
    const [imageCount, setImageCount] = useState(0);
    const [resetClassIds, setResetClassIds] = useState<Array<string>>([]);
    const [clearClassIds, setClearClassIds] = useState<Array<string>>([]);
    const [clearPassword, setClearPassword] = useState("");
    const [backupFile, setBackupFile] = useState<File | null>(null);
    const [backupSummary, setBackupSummary] = useState<BackupSummary | null>(null);
    const [classMappings, setClassMappings] = useState<ClassMapping[]>([]);
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState("");

    const selectedRestoreGroups = backupSummary?.restoreGroups?.length ? backupSummary.restoreGroups : restoreGroups;

    useEffect(() => {
        void loadStatus();
    }, []);

    const selectedRestoreCount = useMemo(() => classMappings.filter(item => item.targetMode !== "skip").length, [classMappings]);

    async function loadStatus() {
        setError("");
        try {
            const result = await getBackupStatus();
            setKlassen(result.classes || []);
            setRestoreGroups(result.restoreGroups || []);
            setCommonCount(sumCounts(result.commonTableCounts || {}));
            setImageCount(Number(result.imageCount) || 0);
            if ((result.classes || []).length > 0) {
                setResetClassIds([String(result.classes[0].id)]);
                setClearClassIds([String(result.classes[0].id)]);
            }
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Status konnte nicht geladen werden.");
        }
    }

    async function handleDownload() {
        setLoading("export");
        setError("");
        setMessage("");
        try {
            await downloadBackup();
            setMessage("Backup wurde erstellt und heruntergeladen.");
        } catch (downloadError) {
            setError(downloadError instanceof Error ? downloadError.message : "Backup konnte nicht erstellt werden.");
        } finally {
            setLoading("");
        }
    }

    async function handleFileSelected(file: File | null) {
        setBackupFile(file);
        setBackupSummary(null);
        setClassMappings([]);
        setPassword("");
        setError("");
        setMessage("");
        if (!file) return;
        setLoading("inspect");
        try {
            const summary = await inspectBackup(file);
            setBackupSummary(summary);
            const firstClassId = klassen[0]?.id != null ? String(klassen[0].id) : "";
            setClassMappings((summary.classes || []).map((item: BackupClassSummary) => ({
                sourceId: String(item.id),
                targetMode: firstClassId ? "existing" : "new",
                targetClassId: firstClassId,
                newClassName: `${item.name || "Import"} Kopie`,
                restoreMode: "replace",
                groups: [...DEFAULT_GROUPS],
            })));
        } catch (inspectError) {
            setError(inspectError instanceof Error ? inspectError.message : "Backup-Datei konnte nicht gelesen werden.");
        } finally {
            setLoading("");
        }
    }

    function updateMapping(sourceId: string, patch: Partial<ClassMapping>) {
        setClassMappings(items => items.map(item => item.sourceId === sourceId ? { ...item, ...patch } : item));
    }

    function toggleGroup(sourceId: string, groupId: string, checked: boolean) {
        setClassMappings(items => items.map(item => {
            if (item.sourceId !== sourceId) return item;
            const groups = checked
                ? Array.from(new Set([...item.groups, groupId]))
                : item.groups.filter(value => value !== groupId);
            return { ...item, groups: groups.length ? groups : [groupId] };
        }));
    }

    async function handleRestore() {
        if (!backupFile || !backupSummary) {
            setError("Bitte zuerst eine Backup-ZIP auswaehlen.");
            return;
        }
        if (!password.trim()) {
            setError("Bitte Admin-Passwort eingeben.");
            return;
        }
        if (selectedRestoreCount === 0) {
            setError("Bitte mindestens eine Klasse fuer die Wiederherstellung auswaehlen.");
            return;
        }
        if (!confirm("Die Wiederherstellung veraendert Daten in den Zielklassen. Fortfahren?")) return;
        setLoading("restore");
        setError("");
        setMessage("");
        try {
            const result = await restoreBackup(backupFile, password, { classes: classMappings });
            clearTableCache();
            setMessage(`${result.restored?.length || 0} Klasse(n) wiederhergestellt. ${result.imageCount || 0} Bild(er) uebernommen.`);
            await loadStatus();
        } catch (restoreError) {
            setError(restoreError instanceof Error ? restoreError.message : "Backup konnte nicht wiederhergestellt werden.");
        } finally {
            setLoading("");
        }
    }

    function testdatenZuruecksetzen() {
        if (resetClassIds.length === 0) {
            alert("Bitte mindestens eine Klasse auswaehlen.");
            return;
        }
        if (!confirm("Alle Demo- und Seed-Daten werden in den ausgewaehlten Klassendatenbanken zurueckgesetzt. Fortfahren?")) return;
        resetSeedData(resetClassIds);
        window.location.reload();
    }

    async function klasseLeeren() {
        if (clearClassIds.length === 0) {
            setError("Bitte mindestens eine Klasse auswaehlen.");
            return;
        }
        if (!clearPassword.trim()) {
            setError("Bitte Admin-Passwort eingeben.");
            return;
        }
        const classNames = klassen
            .filter(klasse => clearClassIds.includes(String(klasse.id)))
            .map(klasse => klasse.name)
            .join(", ");
        if (!confirm(`Alle Fachdaten der Klasse(n) ${classNames} werden geloescht. Benutzer und Klassenzuordnung bleiben erhalten. Fortfahren?`)) return;
        setLoading("clear");
        setError("");
        setMessage("");
        try {
            const result = await clearClassData(clearClassIds, clearPassword);
            clearTableCache();
            setClearPassword("");
            setMessage(`${result.classes?.length || 0} Klasse(n) geleert. ${result.deletedImages || 0} nicht mehr benoetigte Artikelbild(er) geloescht.`);
            await loadStatus();
        } catch (clearError) {
            setError(clearError instanceof Error ? clearError.message : "Klasse konnte nicht geleert werden.");
        } finally {
            setLoading("");
        }
    }

    function bereichZuruecksetzen(label: string, action: () => void) {
        if (!confirm(`${label} auf die hinterlegten Standardwerte zuruecksetzen?`)) return;
        action();
        window.location.reload();
    }

    return <div className="backup-page">
        <div className="backup-header">
            <div>
                <p className="toolbar-kicker">Administration</p>
                <h1>Backup</h1>
                <p>Datensicherung, Wiederherstellung und Reset fuer Klassen-Firmen.</p>
            </div>
            <div className="backup-header-stats">
                <span><strong>{klassen.length}</strong> Klassen</span>
                <span><strong>{commonCount}</strong> Common</span>
                <span><strong>{imageCount}</strong> Bilder</span>
            </div>
        </div>

        {error && <p className="form-error backup-message">{error}</p>}
        {message && <p className="form-success backup-message">{message}</p>}

        <div className="backup-action-grid">
        <section className="module-panel backup-action-panel backup-action-panel-primary">
            <div className="dashboard-panel-header">
                <h2>Backup erstellen</h2>
                <span>ZIP</span>
            </div>
            <p>Die Sicherung enthaelt erp_common, alle Klassen-Datenbanken und alle Artikelbilder.</p>
            <div className="thread-document-links">
                <button type="button" onClick={handleDownload} disabled={loading === "export"}>
                    {loading === "export" ? "Backup wird erstellt..." : "Vollbackup herunterladen"}
                </button>
            </div>
        </section>

        <section className="module-panel backup-action-panel">
            <div className="dashboard-panel-header">
                <h2>Backup pruefen</h2>
                <span>{backupSummary ? "Bereit" : "ZIP auswaehlen"}</span>
            </div>
            <div className="form-row">
                <label>
                    Backup-Datei
                    <input
                        type="file"
                        accept=".zip,application/zip"
                        onChange={event => void handleFileSelected(event.target.files?.[0] || null)}
                    />
                </label>
            </div>
            {loading === "inspect" && <p>Backup wird gelesen...</p>}
            {backupSummary && <div className="backup-summary-strip">
                <span>{formatDate(backupSummary.createdAt)}</span>
                <span>Version {backupSummary.version}</span>
                <span>{backupSummary.classes.length} Klassen</span>
                <span>{backupSummary.imageCount} Bilder</span>
            </div>}
        </section>
        </div>

        {backupSummary && <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Backup wiederherstellen</h2>
                <span>{selectedRestoreCount} Zielklasse(n)</span>
            </div>
            <p>Benutzer, Rollen und Klassenteilnehmer bleiben erhalten. Fachbereiche werden mit ihren notwendigen Abhaengigkeiten wiederhergestellt.</p>
            <div className="backup-restore-list">
            {backupSummary.classes.map(sourceClass => {
                const mapping = classMappings.find(item => item.sourceId === String(sourceClass.id));
                if (!mapping) return null;
                return <div key={sourceClass.id} className="backup-restore-item">
                    <div className="dashboard-panel-header">
                        <h3>{sourceClass.name}</h3>
                        <span>{sumCounts(sourceClass.tableCounts)} Datensaetze</span>
                    </div>
                    <div className="form-row">
                        <label>
                            Ziel
                            <select value={mapping.targetMode} onChange={event => updateMapping(mapping.sourceId, { targetMode: event.target.value as ClassMapping["targetMode"] })}>
                                <option value="existing">Bestehende Klasse</option>
                                <option value="new">Neue Klasse erzeugen</option>
                                <option value="skip">Ueberspringen</option>
                            </select>
                        </label>
                        {mapping.targetMode === "existing" && <label>
                            Zielklasse
                            <select value={mapping.targetClassId} onChange={event => updateMapping(mapping.sourceId, { targetClassId: event.target.value })}>
                                {klassen.map(klasse => <option key={klasse.id} value={String(klasse.id)}>{klasse.name}</option>)}
                            </select>
                        </label>}
                        {mapping.targetMode === "new" && <label>
                            Name der neuen Klasse
                            <input value={mapping.newClassName} onChange={event => updateMapping(mapping.sourceId, { newClassName: event.target.value })} />
                        </label>}
                        <label>
                            Modus
                            <select value={mapping.restoreMode} onChange={event => updateMapping(mapping.sourceId, { restoreMode: event.target.value as ClassMapping["restoreMode"] })}>
                                <option value="replace">Ersetzen</option>
                                <option value="merge">Dazumischen</option>
                            </select>
                        </label>
                    </div>
                    {mapping.targetMode !== "skip" && <div className="backup-chip-grid">
                        {selectedRestoreGroups.map(group => <label key={group.id} className={`backup-chip ${mapping.groups.includes(group.id) ? "is-selected" : ""}`}>
                            <input
                                type="checkbox"
                                checked={mapping.groups.includes(group.id)}
                                onChange={event => toggleGroup(mapping.sourceId, group.id, event.target.checked)}
                            />
                            {group.label}
                        </label>)}
                    </div>}
                </div>;
            })}
            </div>
            <div className="form-row" style={{ marginTop: "1rem" }}>
                <label>
                    Admin-Passwort
                    <input type="password" value={password} onChange={event => setPassword(event.target.value)} />
                </label>
            </div>
            <div className="thread-document-links">
                <button type="button" onClick={handleRestore} disabled={loading === "restore"}>
                    {loading === "restore" ? "Wiederherstellung laeuft..." : "Auswahl wiederherstellen"}
                </button>
            </div>
        </section>}

        <section className="module-panel backup-reset-panel">
            <div className="dashboard-panel-header">
                <h2>Testdaten zuruecksetzen</h2>
                <span>Reset</span>
            </div>
            <p>Setzt nur die ausgewaehlten Klassendatenbanken auf die hinterlegten Seed-Daten zurueck. erp_common bleibt erhalten.</p>
            <div className="form-row">
                <label>
                    Klassen fuer Reset
                    <select
                        multiple
                        value={resetClassIds}
                        onChange={event => setResetClassIds(Array.from(event.target.selectedOptions).map(option => option.value))}
                    >
                        {klassen.map(klasse => <option key={klasse.id} value={String(klasse.id)}>{klasse.name}</option>)}
                    </select>
                </label>
            </div>
            <div className="thread-document-links">
                <button type="button" className="button-secondary" onClick={testdatenZuruecksetzen}>Testdaten zuruecksetzen</button>
            </div>
        </section>

        <section className="module-panel backup-danger-panel">
            <div className="dashboard-panel-header">
                <h2>Klasse leeren</h2>
                <span>Alle Fachdaten loeschen</span>
            </div>
            <p>Loescht alle Daten in den ausgewaehlten Klassendatenbanken. Benutzer, Rollen, Rechte und Klassenzuordnungen bleiben erhalten.</p>
            <div className="form-row">
                <label>
                    Klassen
                    <select
                        multiple
                        value={clearClassIds}
                        onChange={event => setClearClassIds(Array.from(event.target.selectedOptions).map(option => option.value))}
                    >
                        {klassen.map(klasse => <option key={klasse.id} value={String(klasse.id)}>{klasse.name}</option>)}
                    </select>
                </label>
                <label>
                    Admin-Passwort
                    <input type="password" value={clearPassword} onChange={event => setClearPassword(event.target.value)} />
                </label>
            </div>
            <div className="thread-document-links">
                <button type="button" className="button-secondary" onClick={() => void klasseLeeren()} disabled={loading === "clear"}>
                    {loading === "clear" ? "Klasse wird geleert..." : "Ausgewaehlte Klasse leeren"}
                </button>
            </div>
        </section>

        <section className="module-panel backup-standards-panel">
            <div className="dashboard-panel-header">
                <h2>Einzelne Standards</h2>
                <span>Verwaltung</span>
            </div>
            <div className="thread-document-links" style={{ flexWrap: "wrap" }}>
                <button type="button" className="button-secondary" onClick={() => bereichZuruecksetzen("Unternehmen", () => unternehmenService.reset())}>Unternehmen</button>
                <button type="button" className="button-secondary" onClick={() => bereichZuruecksetzen("Optionen", () => fristenOptionenService.reset())}>Optionen</button>
                <button type="button" className="button-secondary" onClick={() => bereichZuruecksetzen("Lehrkraft-Optionen", () => lehrkraftOptionenService.reset())}>Lehrkraft-Optionen</button>
                <button type="button" className="button-secondary" onClick={() => bereichZuruecksetzen("Nummernkreise", () => nummernkreiseService.reset())}>Nummernkreise</button>
            </div>
        </section>

        <section className="module-panel backup-status-panel">
            <div className="dashboard-panel-header">
                <h2>Status</h2>
                <span>{klassen.length} Klassen</span>
            </div>
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Klasse</th>
                            <th>Datenbank</th>
                            <th>Status</th>
                            <th>Datensaetze</th>
                        </tr>
                    </thead>
                    <tbody>
                        {klassen.map(klasse => <tr key={klasse.id}>
                            <td>{klasse.name}</td>
                            <td>{klasse.datenbankName}</td>
                            <td>{klasse.status || "aktiv"}</td>
                            <td>{sumCounts(klasse.tableCounts)}</td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
            <p>{commonCount} gemeinsame Datensaetze, {imageCount} Artikelbilder.</p>
        </section>
    </div>;
}
