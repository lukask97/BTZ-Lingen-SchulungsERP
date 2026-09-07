import { getApiConfig } from "../core/api";

const { baseUrl } = getApiConfig();

async function parseError(response: Response) {
    const text = await response.text();
    try {
        return JSON.parse(text).message || text;
    } catch {
        return text || `API request failed with status ${response.status}`;
    }
}

export async function getBackupStatus() {
    const response = await fetch(`${baseUrl}/admin/backup/status`, { credentials: "include" });
    if (!response.ok) throw new Error(await parseError(response));
    const result = await response.json();
    return result;
}

export async function downloadBackup() {
    const response = await fetch(`${baseUrl}/admin/backup/export`, {
        method: "POST",
        credentials: "include"
    });
    if (!response.ok) throw new Error(await parseError(response));
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match?.[1] || `schulungserp-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export async function inspectBackup(file: File) {
    const formData = new FormData();
    formData.append("backup", file);
    const response = await fetch(`${baseUrl}/admin/backup/inspect`, {
        method: "POST",
        credentials: "include",
        body: formData
    });
    if (!response.ok) throw new Error(await parseError(response));
    const result = await response.json();
    return result.summary;
}

export async function restoreBackup(file: File, password: string, mapping: unknown) {
    const formData = new FormData();
    formData.append("backup", file);
    formData.append("password", password);
    formData.append("mapping", JSON.stringify(mapping));
    const response = await fetch(`${baseUrl}/admin/backup/restore`, {
        method: "POST",
        credentials: "include",
        body: formData
    });
    if (!response.ok) throw new Error(await parseError(response));
    return response.json();
}

export async function clearClassData(klasseIds: Array<string | number>, password: string) {
    const response = await fetch(`${baseUrl}/admin/backup/clear-class`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ klasseIds, password })
    });
    if (!response.ok) throw new Error(await parseError(response));
    return response.json();
}
