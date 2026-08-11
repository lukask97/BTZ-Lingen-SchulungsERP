// Dynamisch die Server-IP-Adresse ermitteln
const SERVER_IP = window.location.hostname; // Nimmt die aktuelle Host-IP oder Domain
export const BACKEND_ORIGIN = `http://${SERVER_IP}:5000`;
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
