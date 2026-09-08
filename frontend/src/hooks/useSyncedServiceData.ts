import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { subscribeToDataSync } from "../services/seed/dataSync";

function isRecoverableFetchError(error: unknown) {
    return error instanceof Error && (
        error.message.toLowerCase().includes("failed to fetch")
        || error.message.toLowerCase().includes("backend nicht erreichbar")
        || error.message.toLowerCase().includes("networkerror")
    );
}

export function useSyncedServiceData<T>(keys: string[], load: () => T) {
    const loadRef = useRef(load);
    loadRef.current = load;
    const [data, setData] = useState(() => {
        try {
            return load();
        } catch (error) {
            if (isRecoverableFetchError(error)) {
                return [] as unknown as T;
            }
            throw error;
        }
    });
    const keysSignature = keys.join("|");
    const watchedKeys = useMemo(() => keysSignature.split("|"), [keysSignature]);

    const refresh = useCallback(() => {
        try {
            setData(loadRef.current());
        } catch (error) {
            if (isRecoverableFetchError(error)) {
                return;
            }
            throw error;
        }
    }, []);

    useEffect(() => {
        refresh();

        return subscribeToDataSync(watchedKeys, () => {
            refresh();
        });
    }, [refresh, watchedKeys]);

    return [data, setData, refresh] as const;
}
