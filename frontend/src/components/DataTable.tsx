import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PermissionButton from "./PermissionButton";
import Dialog from "./Dialog";
import HelpHint from "./HelpHint";
import { saveUserColumns, getUserColumns } from "../services/core/metadataService";
import type { DataTableColumn, DataTableProps } from "../types/ui";

function resolveActionVariant(action) {
  if (action.variant) return action.variant;

  const name = String(action.name || "").toLowerCase();

  if (["edit", "new", "create"].includes(name)) return "secondary";
  if (["delete", "remove", "reject", "cancel"].includes(name)) return "danger";
  if (
    ["approve", "done", "start", "ship", "invite", "favorite", "book"].includes(
      name
    )
  )
    return "success";
  if (["remind"].includes(name)) return "warning";

  return "primary";
}

function formatDetailLabel(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function formatObjectValue(value) {
  if (!value || typeof value !== "object") return value ?? "";

  if ("label" in value) return value.label;

  if ("artikel" in value && "menge" in value) {
    return `${value.artikel}: ${value.menge}`;
  }

  if ("name" in value) return value.name;
  if ("titel" in value) return value.titel;
  if ("firma" in value) return value.firma;

  return Object.entries(value)
    .filter(
      ([, entry]) => entry !== null && entry !== undefined && entry !== ""
    )
    .map(([key, entry]) => `${formatDetailLabel(key)}: ${entry}`)
    .join(", ");
}

function isLinkValue(value) {
  return !!value && typeof value === "object" && "label" in value && "to" in value;
}

function extractNumericSortValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? 1 : 0;

  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const normalized = raw
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.+-]/g, "");

  if (!normalized || !/[0-9]/.test(normalized)) return null;

  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeSortValue(value) {
  if (Array.isArray(value)) {
    const joined = value.map((entry) => formatObjectValue(entry)).join(", ");
    return {
      type: "text",
      value: joined.toLowerCase()
    };
  }

  if (isLinkValue(value)) {
    const label = String(value.label || "");
    const numericValue = extractNumericSortValue(label);
    return numericValue !== null
       ? { type: "number", value: numericValue }
      : { type: "text", value: label.toLowerCase() };
  }

  if (value && typeof value === "object") {
    const objectText = formatObjectValue(value);
    const numericValue = extractNumericSortValue(objectText);
    return numericValue !== null
       ? { type: "number", value: numericValue }
      : { type: "text", value: objectText.toLowerCase() };
  }

  const numericValue = extractNumericSortValue(value);
  if (numericValue !== null) {
    return { type: "number", value: numericValue };
  }

  return {
    type: "text",
    value: String(value ?? "").toLowerCase()
  };
}

function haveSameColumns(
  currentColumns: DataTableColumn[],
  nextColumns: DataTableColumn[]
) {
  if (currentColumns.length !== nextColumns.length) return false;

  return currentColumns.every((column, index) => {
    const nextColumn = nextColumns[index];
    return (
      column.field === nextColumn.field &&
      column.title === nextColumn.title &&
      column.visible === nextColumn.visible
    );
  });
}

function getTableColSpan(columnCount: number, hasRowActions: boolean) {
  return columnCount + (hasRowActions ? 1 : 0);
}

export default function DataTable({
  title = "",
  toolbarContent,

  columns = [],
  allColumns = [],
  data = [],

  loading = false,

  page = 1,
  totalPages = 1,
  pageSize = 10,

  onPageChange,
  onPageSizeChange,

  onSearch,
  onSort,
  onFilter,

  toolbarActions = [],
  rowActions = [],

  searchable = false,

  selectableColumns = true,

  onColumnsChange: _onColumnsChange,

  showDetails = true,
  username,
  tableName,

  filters = [],
  initialFilters = {},
  focusRowId = "",
  focusField = "id",
  detailLinkResolver,
  rowClassName,
  selectableRows = false,
  selectedRowIds = [],
  onSelectedRowsChange,
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeFilters, setActiveFilters] = useState(initialFilters);

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<DataTableColumn[]>([]);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const [hasLeftOverflow, setHasLeftOverflow] = useState(false);
  const [hasRightOverflow, setHasRightOverflow] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const sourceColumns = useMemo(
    () => (allColumns.length > 0 ? allColumns : columns),
    [allColumns, columns]
  );
  const sourceColumnsSignature = useMemo(
    () =>
      sourceColumns
        .map((column) => `${column.field}:${column.title}:${column.visible !== false}`)
        .join("|"),
    [sourceColumns]
  );
  const hasRowActions = rowActions.length > 0;
  const selectionColumnOffset = selectableRows ? 1 : 0;
  const tableColSpan = getTableColSpan(visibleColumns.length + selectionColumnOffset, hasRowActions);
  const pageSizeOptions = [10, 25, 50, 100];

  /*
        Initialisierung der Spalten
    */

  useEffect(() => {
    if (!sourceColumns.length) return;

    let nextVisibleColumns = sourceColumns.filter((c) => c.visible !== false);

    if (username && tableName) {
      const saved = getUserColumns(username, tableName);

      if (saved) {
        nextVisibleColumns = sourceColumns.filter((c) =>
          saved.sichtbareFelder.includes(c.field)
        );
      }
    }

    setVisibleColumns((currentColumns) =>
      haveSameColumns(currentColumns, nextVisibleColumns)
        ? currentColumns
        : nextVisibleColumns
    );
  }, [sourceColumnsSignature, username, tableName]);

  function searchChange(e) {
    const value = e.target.value;

    setSearch(value);

    if (onSearch) onSearch(value);
  }

  function handleFilterChange(filterName, value) {
    const newFilters = { ...activeFilters, [filterName]: value };
    setActiveFilters(newFilters);
    if (onFilter) onFilter(newFilters);
  }

  useEffect(() => {
    setActiveFilters(initialFilters);
  }, [JSON.stringify(initialFilters)]);

  function sort(field) {
    let order = "asc";

    if (field === sortField) {
      order = sortOrder === "asc" ? "desc" : "asc";
    }

    setSortField(field);
    setSortOrder(order);

    if (onSort) onSort(field, order);
  }

  const sortedData = useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = normalizeSortValue(a[sortField]);
      const bValue = normalizeSortValue(b[sortField]);

      if (aValue.type === "number" && bValue.type === "number") {
        if (aValue.value === bValue.value) return 0;

        if (sortOrder === "asc") {
          return aValue.value > bValue.value ? 1 : -1;
        }

        return aValue.value < bValue.value ? 1 : -1;
      }

      const aComparable = String(aValue.value);
      const bComparable = String(bValue.value);

      if (aComparable === bComparable) return 0;

      if (sortOrder === "asc") {
        return aComparable > bComparable ? 1 : -1;
      }

      return aComparable < bComparable ? 1 : -1;
    });
  }, [data, sortField, sortOrder]);

  const columnLabelMap = useMemo(() => {
    return Object.fromEntries(
      sourceColumns.map((column) => [column.field, column.title])
    );
  }, [sourceColumns]);
  const detailEntries = useMemo(
    () => (detailData ? Object.entries(detailData) : []),
    [detailData]
  );

  function toggleColumn(column) {
    let result;

    const exists = visibleColumns.some((c) => c.field === column.field);

    if (exists) {
      result = visibleColumns.filter((c) => c.field !== column.field);
    } else {
      result = [...visibleColumns, column];
    }

    setVisibleColumns(result);

    if (username && tableName) {
      saveUserColumns(
        username,
        tableName,
        result.map((c) => c.field)
      );
    }
  }

  function openDetails(row) {
    if (!showDetails) return;

    setDetailData(row);

    setDetailOpen(true);
  }

  function closeDetails() {
    setDetailOpen(false);
    setDetailData(null);

    if (!focusRowId || !searchParams.has("focus")) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("focus");
    setSearchParams(nextParams, { replace: true });
  }

  function displayValue(value) {
    if (Array.isArray(value))
      return value
        .map((entry) =>
          typeof entry === "object" ? formatObjectValue(entry) : entry
        )
        .join(", ");

    if (typeof value === "object" && value !== null)
      return formatObjectValue(value);

    if (typeof value === "boolean") return value ? "Ja" : "Nein";

    return value ?? "";
  }

  function renderDetailValue(field, row, value) {
    if (Array.isArray(value) && value.every(isLinkValue)) {
      return (
        <div className="link-list">
          {value.map((entry) => (
            <Link key={`${field}-${entry.to}-${entry.label}`} className="detail-link" to={entry.to}>
              {entry.label}
            </Link>
          ))}
        </div>
      );
    }

    if (isLinkValue(value)) {
      return (
        <Link className="detail-link" to={value.to}>
          {value.label}
        </Link>
      );
    }

    const linkTarget = detailLinkResolver
      ? detailLinkResolver({ field, row, value })
      : null;

    if (linkTarget) {
      return (
        <Link className="detail-link" to={linkTarget}>
          {displayValue(value)}
        </Link>
      );
    }

    return displayValue(value);
  }

  useEffect(() => {
    if (!focusRowId || !data.length) return;

    const match = data.find(
      (row) => String(row[focusField] ?? "") === String(focusRowId)
    );
    if (!match) return;

    setDetailData(match);
    setDetailOpen(true);
  }, [focusRowId, focusField, data]);

  useEffect(() => {
    if (!showColumnMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!columnMenuRef.current?.contains(event.target as Node)) {
        setShowColumnMenu(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showColumnMenu]);

  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;

    const updateOverflowState = () => {
      const maxScrollLeft = wrapper.scrollWidth - wrapper.clientWidth;
      setHasLeftOverflow(wrapper.scrollLeft > 4);
      setHasRightOverflow(maxScrollLeft - wrapper.scrollLeft > 4);
    };

    updateOverflowState();

    const resizeObserver = new ResizeObserver(updateOverflowState);
    resizeObserver.observe(wrapper);

    window.addEventListener("resize", updateOverflowState);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOverflowState);
    };
  }, [visibleColumns, data, rowActions]);

  function renderToolbarFilters() {
    if (filters.length === 0) return null;

    return filters.map((filter) => (
      <select
        className="toolbar-select"
        key={filter.name}
        name={`filter-${filter.name}`}
        value={activeFilters[filter.name] || ""}
        onChange={(e) => handleFilterChange(filter.name, e.target.value)}
      >
        <option value="">{filter.label}</option>
        {filter.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ));
  }

  function renderColumnMenu() {
    if (!showColumnMenu) return null;

    return (
      <div className="column-popup" ref={columnMenuRef}>
        <strong>Spalten anzeigen</strong>

        {sourceColumns.map((column) => (
          <label key={column.field}>
            <input
              name={`column-${column.field}`}
              type="checkbox"
              checked={visibleColumns.some((visible) => visible.field === column.field)}
              onChange={() => toggleColumn(column)}
            />

            {column.title}
          </label>
        ))}
      </div>
    );
  }

  function renderRowActions(row) {
    const visibleActions = rowActions.filter((action) =>
      action.isVisible ? action.isVisible(row) : true
    );

    if (visibleActions.length === 0) return null;

    return (
      <div className="table-actions">
        {visibleActions.map((action) => (
          <PermissionButton
            key={action.name}
            permission={action.permission}
            access={action.access}
            variant={resolveActionVariant(action)}
            className={action.className}
            disabled={action.isDisabled ? action.isDisabled(row) : false}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(row);
            }}
          >
            {action.label}
          </PermissionButton>
        ))}
      </div>
    );
  }

  function toggleRowSelection(rowId) {
    if (!onSelectedRowsChange) return;
    const exists = selectedRowIds.some((id) => String(id) === String(rowId));
    onSelectedRowsChange(
      exists
        ? selectedRowIds.filter((id) => String(id) !== String(rowId))
        : [...selectedRowIds, rowId]
    );
  }

  function toggleSelectAllRows() {
    if (!onSelectedRowsChange) return;
    const visibleIds = sortedData.map((row) => row.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedRowIds.some((selectedId) => String(selectedId) === String(id)));
    onSelectedRowsChange(allSelected ? [] : visibleIds);
  }

  function renderPagination() {
    return (
      <div className="pagination">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange && onPageChange(page - 1)}
        >
          Zurück
        </button>

        <span>
          Seite {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange && onPageChange(page + 1)}
        >
          Weiter
        </button>

        <select
          name="page-size"
          value={pageSize}
          onChange={(e) =>
            onPageSizeChange && onPageSizeChange(Number(e.target.value))
          }
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span>pro Seite</span>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="toolbar">
        <h2>{title}</h2>

        <div className="toolbar-right">
          {toolbarContent}

          {searchable && (
            <input
              name="table-search"
              placeholder="Suchen..."
              value={search}
              onChange={searchChange}
            />
          )}

          {renderToolbarFilters()}

          {sourceColumns.length > 0 && (
            <button
              className="icon-button"
              type="button"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
            >
              Spalten
            </button>
          )}

          {renderColumnMenu()}

          {toolbarActions.map((action) => (
            <PermissionButton
              key={action.name}
              permission={action.permission}
              access={action.access}
              variant={resolveActionVariant(action)}
              className={action.className}
              disabled={action.isDisabled ? action.isDisabled() : false}
              onClick={action.onClick}
            >
              {action.label}
            </PermissionButton>
          ))}
        </div>
      </div>

      <div
        ref={tableWrapperRef}
        className={[
          "datatable-wrapper",
          hasLeftOverflow ? "has-left-overflow" : "",
          hasRightOverflow ? "has-right-overflow" : "",
        ].filter(Boolean).join(" ")}
        onScroll={() => {
          const wrapper = tableWrapperRef.current;
          if (!wrapper) return;
          const maxScrollLeft = wrapper.scrollWidth - wrapper.clientWidth;
          setHasLeftOverflow(wrapper.scrollLeft > 4);
          setHasRightOverflow(maxScrollLeft - wrapper.scrollLeft > 4);
        }}
      >
        <table className="datatable">
          <thead>
            <tr>
              {selectableRows && (
                <th className="datatable-selection-column">
                  <input
                    name="select-all-rows"
                    type="checkbox"
                    checked={sortedData.length > 0 && sortedData.every((row) => selectedRowIds.some((id) => String(id) === String(row.id)))}
                    onChange={toggleSelectAllRows}
                    aria-label="Alle Zeilen auswählen"
                  />
                </th>
              )}
              {visibleColumns.map((column) => (
                <th key={column.field} onClick={() => sort(column.field)}>
                  <span className="datatable-header">
                    <span>{column.title}</span>
                    {column.helpText && <HelpHint text={column.helpText} delay={500} />}
                    {sortField === column.field &&
                      <span>{sortOrder === "asc" ? " aufsteigend" : " absteigend"}</span>}
                  </span>
                </th>
              ))}

              {hasRowActions && <th className="datatable-actions-column">Aktionen</th>}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={tableColSpan}>
                  Laden...
                </td>
              </tr>
            )}

            {!loading && sortedData.length === 0 && (
              <tr>
                <td colSpan={tableColSpan}>
                  Keine Daten vorhanden
                </td>
              </tr>
            )}

            {!loading &&
              sortedData.map((row) => (
                <tr
                  key={row.id}
                  className={[showDetails ? "clickable-row" : "", rowClassName ? rowClassName(row) : ""].filter(Boolean).join(" ")}
                  onClick={() => openDetails(row)}
                >
                  {selectableRows && (
                    <td className="datatable-selection-column" onClick={(e) => e.stopPropagation()}>
                      <input
                        name={`select-row-${row.id}`}
                        type="checkbox"
                        checked={selectedRowIds.some((id) => String(id) === String(row.id))}
                        onChange={() => toggleRowSelection(row.id)}
                        aria-label={`Zeile ${row.id} auswählen`}
                      />
                    </td>
                  )}
                  {visibleColumns.map((column) => (
                    <td key={column.field}>
                      {column.render
                        ? column.render(row, row[column.field])
                        : displayValue(row[column.field])}
                    </td>
                  ))}

                  {hasRowActions && <td className="datatable-actions-column">{renderRowActions(row)}</td>}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={detailOpen && !!detailData}
        title="Details"
        onClose={closeDetails}
      >
        <div className="form-row detail-summary">
          <p>
            Ausgewählter Datensatz mit allen aktuell sichtbaren Informationen.
          </p>
        </div>
        {detailEntries.map(([key, value]) => (
            <div className="detail-field" key={key}>
              <span className="detail-label">
                {columnLabelMap[key] || formatDetailLabel(key)}
              </span>
              <div className="detail-value">
                {renderDetailValue(key, detailData, value)}
              </div>
            </div>
          ))}
      </Dialog>

      {renderPagination()}
    </div>
  );
}
