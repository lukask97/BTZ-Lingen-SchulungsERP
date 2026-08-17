import { apiRequest } from "../core/api";

export async function downloadBackup() {
    const result = await apiRequest("/admin/backup");
    return result.backup;
}

export async function restoreBackup(backup: unknown) {
    return apiRequest("/admin/restore", {
        method: "POST",
        body: JSON.stringify({ backup })
    });
}
