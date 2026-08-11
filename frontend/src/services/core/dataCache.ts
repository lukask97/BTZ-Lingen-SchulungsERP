const tableCache = new Map<string, unknown[]>();

export function getCachedTableData<T>(tableName: string): T[] | null {
    return (tableCache.get(tableName) as T[] | undefined) || null;
}

export function setCachedTableData<T>(tableName: string, rows: T[]): T[] {
    tableCache.set(tableName, rows);
    return rows;
}

export function invalidateTableCache(tableName: string) {
    tableCache.delete(tableName);
}

export function invalidateTableCaches(tableNames: string[]) {
    tableNames.forEach(invalidateTableCache);
}

export function clearTableCache() {
    tableCache.clear();
}
