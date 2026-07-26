const API_URL = "http://localhost:5000/api";

export const DATA_PROVIDER = "mock-session-storage";

export function getApiConfig() {
    return {
        baseUrl: API_URL,
        provider: DATA_PROVIDER,
        readyForBackend: true
    };
}

export default API_URL;
