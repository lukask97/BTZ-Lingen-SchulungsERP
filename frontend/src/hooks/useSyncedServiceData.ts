import { useEffect, useState } from "react";
import { subscribeToStorageSync } from "../services/mockup/mockStorage";

export function useSyncedServiceData<T>(keys: string[], load: () => T) {
    const [data, setData] = useState(() => load());
    const keysSignature = keys.join("|");

    const refresh = () => {
        setData(load());
    };

    useEffect(() => {
        refresh();

        return subscribeToStorageSync(keys, () => {
            refresh();
        });
    }, [keysSignature]);

    return [data, setData, refresh] as const;
}
