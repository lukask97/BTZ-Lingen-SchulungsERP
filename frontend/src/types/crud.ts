export interface EntityWithId {
    id: number | string | null;
    [key: string]: unknown;
}

export interface CrudService<T extends EntityWithId> {
    list: () => T[];
    getAll: () => T[];
    getById: (id: number | string) => T | undefined;
    create: (item: Partial<T> & Record<string, unknown>) => T;
    add: (item: Partial<T> & Record<string, unknown>) => T;
    update: (idOrItem: number | string | (Partial<T> & Record<string, unknown>), payload: Partial<T>) => T;
    remove: (id: number | string) => void;
    delete: (id: number | string) => void;
    removeMany: (ids: Array<number | string>) => void;
    deleteMultiple: (ids: Array<number | string>) => void;
    search: (query: string) => T[];
    sortBy: (field: keyof T | string, order: string) => T[];
}

export interface CrudValidationField {
    field: string;
    label: string;
}

export interface UseCrudPageOptions<T extends EntityWithId> {
    requiredFields: CrudValidationField[];
    createNewItem: () => T;
}

export interface UseCrudPageResult<T extends EntityWithId> {
    data: T[];
    allData: T[];
    open: boolean;
    editMode: boolean;
    pageSize: number;
    search: string;
    currentItem: T;
    error: string;
    setOpen: (value: boolean) => void;
    setPageSize: (value: number) => void;
    setSearch: (value: string) => void;
    setCurrentItem: (value: T) => void;
    neu: () => void;
    bearbeiten: (item: T) => void;
    loeschen: (item: T) => void;
    speichern: () => boolean;
    refreshData: () => void;
    handleClose: () => void;
}
