er Artikel in der zweiten Zeilleimport type { ReactNode } from "react";

export interface DialogProps {
    open: boolean;
    title: ReactNode;
    children: ReactNode;
    onClose: () => void;
    footer?: ReactNode;
    bodyClassName?: string;
    contentClassName?: string;
    showCancelButton?: boolean;
    cancelLabel?: string;
}

export interface LookupOption {
    value: string | number;
    label: string;
    action?: boolean;
}

export interface LookupFieldProps {
    id?: string;
    name?: string;
    value: string | number;
    options: LookupOption[];
    onChange?: (value: string) => void;
    onCreate?: () => void;
    onEdit?: (value: string | number) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    autoComplete?: string;
}

export interface TextFieldProps {
    id?: string;
    name?: string;
    value: string | number;
    onChange?: (value: string) => void;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    maxLength?: number;
    autoFocus?: boolean;
}

export interface NumberFieldProps {
    id?: string;
    name?: string;
    value: string | number;
    onChange: (value: string) => void;
    onBlur?: () => void;
    type?: "number" | "date" | "time" | "datetime-local" | "month" | "week";
    format?: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    placeholder?: string;
    disabled?: boolean;
}

export interface TextAreaProps {
    id?: string;
    name?: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    placeholder?: string;
    onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export interface DataTableAction {
    name: string;
    label: string;
    permission?: string;
    access?: string;
    onClick: (...args: any[]) => void;
    isVisible?: (...args: any[]) => boolean;
    isDisabled?: (...args: any[]) => boolean;
    variant?: string;
    className?: string;
}

export interface DataTableColumn {
    field: string;
    title: string;
    helpText?: string;
    visible?: boolean;
    render?: (row: any, value: any) => ReactNode;
}

export interface DataTableFilter {
    name: string;
    label: string;
    options: LookupOption[];
}

export interface DataTableProps {
    title?: string;
    toolbarContent?: ReactNode;
    columns?: DataTableColumn[];
    allColumns?: DataTableColumn[];
    data?: any[];
    loading?: boolean;
    page?: number;
    totalPages?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onSearch?: (value: string) => void;
    onSort?: (field: string, order: string) => void;
    onFilter?: (filters: Record<string, string>) => void;
    toolbarActions?: DataTableAction[];
    rowActions?: DataTableAction[];
    searchable?: boolean;
    selectableColumns?: boolean;
    resizableColumns?: boolean;
    reorderableColumns?: boolean;
    onColumnsChange?: (columns: DataTableColumn[]) => void;
    showDetails?: boolean;
    username?: string;
    tableName?: string;
    filters?: DataTableFilter[];
    initialFilters?: Record<string, string>;
    focusRowId?: string | number;
    focusField?: string;
    detailLinkResolver?: (args: { field: string; row: any; value: any }) => string | null;
    rowClassName?: (row: any) => string;
    selectableRows?: boolean;
    selectedRowIds?: Array<string | number>;
    onSelectedRowsChange?: (rowIds: Array<string | number>) => void;
}
