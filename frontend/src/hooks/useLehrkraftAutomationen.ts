import { useEffect } from "react";
import { useDataSyncRefresh } from "./useDataSyncRefresh";
import { applyLehrkraftAutomationen } from "../services/lehrkraft/lehrkraftAutomationService";

export function useLehrkraftAutomationen() {
    const syncTick = useDataSyncRefresh([
        "lehrkraftOptionen",
        "vertriebsdokumente",
        "zahlungen",
        "auftraege"
    ]);

    useEffect(() => {
        applyLehrkraftAutomationen();
    }, [syncTick]);
}
