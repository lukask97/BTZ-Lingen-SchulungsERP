import { useEffect, useState } from "react";
import { subscribeToStorageSync } from "../services/mockup/mockStorage";

export function useStorageSyncRefresh(keys: string[]) {
    const [refreshTick, setRefreshTick] = useState(0);
    const keysSignature = keys.join("|");

    useEffect(() => subscribeToStorageSync(keys, () => {
        setRefreshTick(current => current + 1);
    }), [keysSignature]);

    return refreshTick;
}
