import { BACKEND_ORIGIN } from "../core/api";

function resolveImageUrl(path: string) {
    return new URL(path, `${BACKEND_ORIGIN}/`).toString();
}

async function parseJsonResponse(response: Response) {
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const message = data.message || `API request failed with status ${response.status}`;
        throw new Error(message);
    }

    return data;
}

const artikelBilderService = {
    async list(artikelId: string | number) {
        const response = await fetch(`${BACKEND_ORIGIN}/api/artikel/${artikelId}/bilder`, {
            credentials: "include"
        });
        const data = await parseJsonResponse(response);
        return (data.items || []).map((item: Record<string, unknown>) => ({
            ...item,
            url: resolveImageUrl(String(item.url || ""))
        }));
    },

    async upload(artikelId: string | number, slot: number, file: File) {
        const body = new FormData();
        body.append("file", file);

        const response = await fetch(`${BACKEND_ORIGIN}/api/artikel/${artikelId}/bilder/${slot}`, {
            method: "POST",
            credentials: "include",
            body
        });
        const data = await parseJsonResponse(response);
        return {
            ...(data.item || {}),
            url: resolveImageUrl(String(data.item.url || ""))
        };
    },

    async remove(artikelId: string | number, slot: number) {
        const response = await fetch(`${BACKEND_ORIGIN}/api/artikel/${artikelId}/bilder/${slot}`, {
            method: "DELETE",
            credentials: "include"
        });
        return parseJsonResponse(response);
    }
};

export default artikelBilderService;
