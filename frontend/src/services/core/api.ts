function getBackendOrigin(): string {
    const envBackendOrigin = String(import.meta.env.VITE_API_URL || "").trim();
    if (envBackendOrigin) {
        return envBackendOrigin.replace(/\/$/, "");
    }

    const { protocol, hostname } = window.location;

    if (hostname.includes(".app.github.dev")) {
        const backendHostname = hostname.replace(/-\d+\.app\.github\.dev$/, "-5000.app.github.dev");
        return `${protocol}//${backendHostname}`;
    }

    if (hostname.includes(".devtunnels.ms")) {
        const backendHostname = hostname.replace(/-\d+(\.[^.]+\.devtunnels\.ms)$/, "-5000$1");
        if (backendHostname !== hostname) {
            return `${protocol}//${backendHostname}`;
        }
    }

    return `${protocol}//${hostname}:5000`;
}

export const BACKEND_ORIGIN = getBackendOrigin();
const API_URL = `${BACKEND_ORIGIN}/api`;
const DATABASE_API_URL = `${API_URL}/datenbanken`;

export function getApiConfig() {
    return {
        baseUrl: API_URL,
        databaseBaseUrl: DATABASE_API_URL
    };
}

export function buildDatabasePath(path: string) {
    if (/^https?:\/\//.test(path)) {
        return path;
    }

    return `${DATABASE_API_URL}${path}`;
}

function parseApiPayload(responseText: string) {
    if (!responseText) {
        return null;
    }

    try {
        return JSON.parse(responseText);
    } catch {
        return null;
    }
}

function resolveApiUrl(path: string) {
    if (/^https?:\/\//.test(path)) {
        return path;
    }

    return `${API_URL}${path}`;
}

export function isPermissionError(error: unknown) {
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();
    return message.startsWith("keine berechtigung")
        || message.includes("status 403")
        || message.includes("403")
        || message.includes("forbidden");
}

export function syncApiRequest(path: string, options: { method?: string; body?: unknown } = {}) {
    const request = new XMLHttpRequest();
    request.open(options.method || "GET", resolveApiUrl(path), false);
    request.withCredentials = true;
    request.setRequestHeader("Content-Type", "application/json");
    try {
        request.send(options.body ? JSON.stringify(options.body) : null);
    } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (
            message.includes("failed to fetch")
            || message.includes("failed to load")
            || message.includes("networkerror")
            || message.includes("xmlhttprequest")
            || message.includes("cors")
        ) {
            throw new Error(`Backend unter ${BACKEND_ORIGIN} nicht erreichbar.`);
        }
        throw error;
    }

    const data = parseApiPayload(request.responseText);

    if (request.status < 200 || request.status >= 300) {
        const message = data?.message || `API request failed with status ${request.status}`;
        throw new Error(message);
    }

    return data;
}

export async function apiRequest(path: string, options: RequestInit = {}) {
    let response: Response;
    try {
        response = await fetch(resolveApiUrl(path), {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        });
    } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (
            message.includes("failed to fetch")
            || message.includes("failed to load")
            || message.includes("networkerror")
            || message.includes("cors")
        ) {
            throw new Error(`Backend unter ${BACKEND_ORIGIN} nicht erreichbar.`);
        }
        throw error;
    }

    const text = await response.text();
    const data = parseApiPayload(text);

    if (!response.ok) {
        const message = data?.message || `API request failed with status ${response.status}`;
        throw new Error(message);
    }

    return data;
}

export default API_URL;
