// Dynamisch die Backend-URL ermitteln - funktioniert lokal, in Codespaces und mit VS Code Dev Tunnels.
function getBackendOrigin(): string {
    const envBackendOrigin = import.meta.env.VITE_API_URL?.trim();
    if (envBackendOrigin) {
        return envBackendOrigin.replace(/\/$/, "");
    }

    const { protocol, hostname } = window.location;

    // GitHub Codespaces: Frontend-Port durch Backend-Port ersetzen.
    if (hostname.includes(".app.github.dev")) {
        const backendHostname = hostname.replace(/-\d+\.app\.github\.dev$/, "-5000.app.github.dev");
        return `${protocol}//${backendHostname}`;
    }

    // VS Code Dev Tunnels: Frontend-Port durch Backend-Port ersetzen.
    if (hostname.includes(".devtunnels.ms")) {
        const backendHostname = hostname.replace(/-\d+(\.[^.]+\.devtunnels\.ms)$/, "-5000$1");
        if (backendHostname !== hostname) {
            return `${protocol}//${backendHostname}`;
        }
    }

    // Lokal oder auf anderen Servern: nutze denselben Host mit Backend-Port 5000.
    return `${protocol}//${hostname}:5000`;
}

export const BACKEND_ORIGIN = getBackendOrigin();
const API_URL = `${BACKEND_ORIGIN}/api`; // Backend-Port 5000 verwenden

const DATABASE_API_URL = `${API_URL}/datenbanken`;

export const DATABASE_PROVIDER = "backend-postgres";
export const DATA_PROVIDER = DATABASE_PROVIDER;
export const MOCK_PROVIDER = "mock-local-storage";
const DATA_PROVIDER_STORAGE_KEY = "data-provider";

export function getApiConfig() {
    return {
        baseUrl: API_URL,
        databaseBaseUrl: DATABASE_API_URL,
        provider: DATA_PROVIDER,
        databaseProvider: DATABASE_PROVIDER,
        readyForBackend: true,
        supportsDatabaseMode: true
    };
}

export function buildDatabasePath(path: string) {
    return `${DATABASE_API_URL}${path}`;
}

function resolveApiUrl(path: string) {
    if (/^https?:\/\//.test(path)) {
        return path;
    }

    return `${API_URL}${path}`;
}

export function getDataProvider() {
    if (typeof window !== "undefined") {
        const runtimeProvider = window.localStorage.getItem(DATA_PROVIDER_STORAGE_KEY);
        if (runtimeProvider) return runtimeProvider;
    }

    const envProvider = import.meta.env.VITE_DATA_PROVIDER;
    if (envProvider) return envProvider;

    return DATA_PROVIDER;
}

export function isDatabaseModeEnabled() {
    return getDataProvider() === DATABASE_PROVIDER;
}

export function setDataProvider(provider: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DATA_PROVIDER_STORAGE_KEY, provider);
}

export function syncApiRequest(path: string, options: { method?: string; body?: unknown } = {}) {
    const request = new XMLHttpRequest();
    request.open(options.method || "GET", resolveApiUrl(path), false);
    request.withCredentials = true;
    request.setRequestHeader("Content-Type", "application/json");
    request.send(options.body ? JSON.stringify(options.body) : null);

    const data = request.responseText ? JSON.parse(request.responseText) : null;

    if (request.status < 200 || request.status >= 300) {
        const message = data?.message || `API request failed with status ${request.status}`;
        throw new Error(message);
    }

    return data;
}

export async function apiRequest(path: string, options: RequestInit = {}) {
    const response = await fetch(resolveApiUrl(path), {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const message = data?.message || `API request failed with status ${response.status}`;
        throw new Error(message);
    }

    return data;
}

export default API_URL;
