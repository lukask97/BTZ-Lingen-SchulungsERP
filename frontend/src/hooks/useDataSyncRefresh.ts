import { useEffect, useMemo, useState } from "react";
import { subscribeToDataSync } from "../services/seed/dataSync";

export function useDataSyncRefresh(keys: string[]) {
    const [refreshTick, setRefreshTick] = useState(0);
    const keysSignature = keys.join("|");
    const watchedKeys = useMemo(() => keysSignature.split("|"), [keysSignature]);

    useEffect(() => subscribeToDataSync(watchedKeys, () => {
        setRefreshTick(current => current + 1);
    }), [watchedKeys]);

    return refreshTick;
}
