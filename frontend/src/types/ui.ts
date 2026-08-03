import type { ReactNode } from "react";

export interface DialogProps {
    open: boolean;
    title: ReactNode;
    children: ReactNode;
    onClose: () => void;
    footer?: ReactNode;
}

export interface LookupOption {
    value: string | number;
    label: string;
}

export interface LookupFieldProps {
    value?: string | number;
    options?: LookupOption[];
    onChange?: (value: string) => void;
    onCreate?: () => void;
    onEdit?: (value: string | number) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
}

export interface TextFieldProps {
    value?: string | number;
    onChange?: (value: string) => void;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    maxLength?: number;
    autoFocus?: boolean;
}

export interface NumberFieldProps {
    value?: string | number;
    onChange?: (value: string) => void;
    type?: string;
    format?: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    placeholder?: string;
    disabled?: boolean;
}

export interface TextAreaProps {
    value?: string;
    onChange: (value: string) => void;
    rows?: number;
    placeholder?: string;
}

export interface DataTableAction {
    name?: string;
    label: string;
    permission?: string;
    access?: string;
    onClick?: (...args: any[]) => void;
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
    render?: (row: any, value?: any) => ReactNode;
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
    onColumnsChange?: (columns: DataTableColumn[]) => void;
    showDetails?: boolean;
    username?: string;
    tableName?: string;
    filters?: DataTableFilter[];
    focusRowId?: string | number;
    focusField?: string;
    detailLinkResolver?: (args: { field: string; row: any; value: any }) => string | null;
    rowClassName?: (row: any) => string;
}
