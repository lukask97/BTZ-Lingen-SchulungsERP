import { useEffect } from "react";
import { useStorageSyncRefresh } from "./useStorageSyncRefresh";
import { applyLehrkraftAutomationen } from "../services/lehrkraft/lehrkraftAutomationService";

export function useLehrkraftAutomationen() {
    const syncTick = useStorageSyncRefresh([
        "lehrkraftOptionen",
        "vertriebsdokumente",
        "zahlungen",
        "auftraege"
    ]);

    useEffect(() => {
        applyLehrkraftAutomationen();
    }, [syncTick]);
}
