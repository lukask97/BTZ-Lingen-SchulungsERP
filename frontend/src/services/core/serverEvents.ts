import { clearTableCache, invalidateTableCache } from "./dataCache";
import API_URL from "./api";

type TableChangedPayload = {
    table: string;
    action: string;
    id: string | number;
};

type DataResetPayload = {
    tables: string[];
};

type TableListener = (payload: TableChangedPayload) => void;
type ResetListener = (payload: DataResetPayload) => void;

const tableListeners = new Set<TableListener>();
const resetListeners = new Set<ResetListener>();

let eventSource: EventSource | null = null;

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

function ensureEventSource() {
    if (typeof window === "undefined" || eventSource) {
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
