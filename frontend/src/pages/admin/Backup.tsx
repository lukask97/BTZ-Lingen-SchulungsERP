import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

import { downloadBackup, restoreBackup } from "../../services/admin/backupService";

function saveJsonFile(payload: unknown, fileName: string) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}

export default function Backup() {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const handleDownload = async () => {
        setBusy(true);
        setError("");
        setStatus("");
        try {
            const backup = await downloadBackup();
            const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
            saveJsonFile(backup, `btz-erp-backup-${stamp}.json`);
            setStatus("Backup wurde heruntergeladen.");
        } catch (downloadError) {
            setError(downloadError instanceof Error ? downloadError.message : "Backup konnte nicht erstellt werden.");
        } finally {
            setBusy(false);
        }
    };

    const handleRestoreSelection = () => {
        setError("");
        setStatus("");
        inputRef.current?.click();
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setBusy(true);
        setError("");
        setStatus("");
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            await restoreBackup(parsed);
            setStatus("Backup wurde wiederhergestellt.");
        } catch (restoreError) {
            setError(restoreError instanceof Error ? restoreError.message : "Backup konnte nicht wiederhergestellt werden.");
        } finally {
            if (inputRef.current) {
                inputRef.current.value = "";
            }
            setBusy(false);
        }
    };

    return (
        <section className="module-panel">
            <h1>Backup</h1>
            <p>Hier lassen sich relationale SQL-Daten und kleinere JSON-Konfigurationen gemeinsam als Sicherungsdatei exportieren und wieder einspielen.</p>
            <div className="thread-document-links">
                <button type="button" onClick={handleDownload} disabled={busy}>Backup herunterladen</button>
                <button type="button" className="button-secondary" onClick={handleRestoreSelection} disabled={busy}>Backup wiederherstellen</button>
            </div>
            <input
                ref={inputRef}
                name="backup-file"
                type="file"
                accept="application/json,.json"
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
            <div className="module-panel" style={{ marginTop: "1rem" }}>
                <h2>Inhalt</h2>
                <p>Das Backup enthaelt die SQL-Haupttabellen wie Kunden, Lieferanten, Artikel, Services, Lager, Rechnungen, Benutzer, Rollen und Rechte sowie die kleineren JSON-Tabellen fuer Einstellungen und Metadaten.</p>
            </div>
            {status && <p>{status}</p>}
            {error && <p className="form-error">{error}</p>}
        </section>
    );
}
