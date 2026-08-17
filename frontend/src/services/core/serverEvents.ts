import { clearTableCache, invalidateTableCache } from "./dataCache";
import API_URL, { isDatabaseModeEnabled } from "./api";

type TableChangedPayload = {
    table: string;
    action: string;
    id: string | number;
};

type DataResetPayload = {
    mode: string;
    tables: string[];
};

type SystemPayload = {
    mode: string;
};

type TableListener = (payload: TableChangedPayload) => void;
type ResetListener = (payload: DataResetPayload) => void;
type SystemListener = (payload: SystemPayload) => void;

const tableListeners = new Set<TableListener>();
const resetListeners = new Set<ResetListener>();
const systemListeners = new Set<SystemListener>();

let eventSource: EventSource | null = null;
let latestSystemPayload: SystemPayload | null = null;

function notifyTableChanged(payload: TableChangedPayload) {
    const tableName = payload.table;
    if (tableName) {
        invalidateTableCache(tableName);
    }
    tableListeners.forEach(listener => listener(payload));
}

function notifyDataReset(payload: DataResetPayload) {
    clearTableCache();
    resetListeners.forEach(listener => listener(payload));
}

function notifySystem(payload: SystemPayload) {
    latestSystemPayload = payload;
    systemListeners.forEach(listener => listener(payload));
}

function ensureEventSource() {
    if (typeof window === "undefined" || !isDatabaseModeEnabled() || eventSource) {
        return;
    }

    eventSource = new EventSource(`${API_URL}/events`, {
        withCredentials: true
    });

    eventSource.addEventListener("table-changed", event => {
        const payload = JSON.parse(event.data) as TableChangedPayload;
        notifyTableChanged(payload);
    });

    eventSource.addEventListener("data-reset", event => {
        const payload = JSON.parse(event.data) as DataResetPayload;
        notifyDataReset(payload);
    });

    eventSource.addEventListener("system", event => {
        const payload = JSON.parse(event.data) as SystemPayload;
        notifySystem(payload);
    });

    eventSource.onerror = () => {
        if (!eventSource) return;
        if (eventSource.readyState === EventSource.CLOSED) {
            eventSource = null;
        }
    };
}

export function subscribeToServerTableEvents(callback: TableListener) {
    ensureEventSource();
    tableListeners.add(callback);
    return () => {
        tableListeners.delete(callback);
    };
}

export function subscribeToServerResetEvents(callback: ResetListener) {
    ensureEventSource();
    resetListeners.add(callback);
    return () => {
        resetListeners.delete(callback);
    };
}

export function subscribeToServerSystemEvents(callback: SystemListener) {
    ensureEventSource();
    systemListeners.add(callback);
    if (latestSystemPayload) {
        callback(latestSystemPayload);
    }
    return () => {
        systemListeners.delete(callback);
    };
}
