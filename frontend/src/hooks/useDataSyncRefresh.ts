import { useEffect, useState } from "react";
import { subscribeToDataSync } from "../services/seed/dataSync";

export function useDataSyncRefresh(keys: string[]) {
    const [refreshTick, setRefreshTick] = useState(0);
    const keysSignature = keys.join("|");

    useEffect(() => subscribeToDataSync(keys, () => {
        setRefreshTick(current => current + 1);
    }), [keysSignature]);

    return refreshTick;
}
