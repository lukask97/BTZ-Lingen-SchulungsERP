import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PermissionButton from "./PermissionButton";
import Dialog from "./Dialog";
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

function normalizeSortValue(value) {
  if (Array.isArray(value)) return value.map((entry) => normalizeSortValue(entry)).join(", ");
  if (isLinkValue(value)) return String(value.label || "").toLowerCase();
  if (value && typeof value === "object") return formatObjectValue(value).toLowerCase();
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return String(value ?? "").toLowerCase();
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
  focusRowId = "",
  focusField = "id",
  detailLinkResolver,
  rowClassName,
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeFilters, setActiveFilters] = useState({});

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<DataTableColumn[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  /*
        Initialisierung der Spalten
    */

  useEffect(() => {
    if (!columns.length) return;

    if (username && tableName) {
      const saved = getUserColumns(username, tableName);

      if (saved) {
        const savedColumns = columns.filter((c) =>
          saved.sichtbareFelder.includes(c.field)
        );

        setVisibleColumns(savedColumns);

        return;
      }
    }

    setVisibleColumns(columns.filter((c) => c.visible !== false));
  }, [columns, username, tableName]);

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
      const aValue = normalizeSortValue(a?.[sortField]);
      const bValue = normalizeSortValue(b?.[sortField]);

      if (aValue === bValue) return 0;

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      }

      return aValue < bValue ? 1 : -1;
    });
  }, [data, sortField, sortOrder]);

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

  return (
    <div className="card">
      <div className="toolbar">
        <h2>{title}</h2>

        <div className="toolbar-right">
          {toolbarContent}

          {searchable && (
            <input
              placeholder="Suchen..."
              value={search}
              onChange={searchChange}
            />
          )}

          {filters.length > 0 &&
            filters.map((filter) => (
              <select
                key={filter.name}
                value={activeFilters[filter.name] || ""}
                onChange={(e) =>
                  handleFilterChange(filter.name, e.target.value)
                }
                style={{
                  padding: "6px 10px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              >
                <option value="">{filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}

          {selectableColumns && (
            <button
              className="icon-button"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
            >
              ⚙️
            </button>
          )}

          {showColumnMenu && (
            <div className="column-popup">
              <strong>Spalten anzeigen</strong>

              {(allColumns.length > 0 ? allColumns : columns).map((column) => (
                <label key={column.field}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.some(
                      (c) => c.field === column.field
                    )}
                    onChange={() => toggleColumn(column)}
                  />

                  {column.title}
                </label>
              ))}
            </div>
          )}

          {toolbarActions.map((action) => (
            <PermissionButton
              key={action.name}
              permission={action.permission}
              variant={resolveActionVariant(action)}
              className={action.className}
              onClick={action.onClick}
            >
              {action.label}
            </PermissionButton>
          ))}
        </div>
      </div>

      <div className="datatable-wrapper">
        <table className="datatable">
          <thead>
            <tr>
              {visibleColumns.map((column) => (
                <th key={column.field} onClick={() => sort(column.field)}>
                  {column.title}

                  {sortField === column.field &&
                    (sortOrder === "asc" ? " ▲" : " ▼")}
                </th>
              ))}

              {rowActions.length > 0 && <th>Aktionen</th>}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={
                    visibleColumns.length + (rowActions.length > 0 ? 1 : 0)
                  }
                >
                  Laden...
                </td>
              </tr>
            )}

            {!loading && sortedData.length === 0 && (
              <tr>
                <td
                  colSpan={
                    visibleColumns.length + (rowActions.length > 0 ? 1 : 0)
                  }
                >
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
                  {visibleColumns.map((column) => (
                    <td key={column.field}>
                      {column.render
                        ? column.render(row)
                        : displayValue(row[column.field])}
                    </td>
                  ))}

                  {rowActions.length > 0 && (
                    <td>
                      <div className="table-actions">
                        {rowActions
                          .filter((action) =>
                            action.isVisible ? action.isVisible(row) : true
                          )
                          .map((action) => (
                            <PermissionButton
                              key={action.name}
                              permission={action.permission}
                              variant={resolveActionVariant(action)}
                              className={action.className}
                              disabled={
                                action.isDisabled
                                  ? action.isDisabled(row)
                                  : false
                              }
                              onClick={(e) => {
                                e.stopPropagation();

                                action.onClick(row);
                              }}
                            >
                              {action.label}
                            </PermissionButton>
                          ))}
                      </div>
                    </td>
                  )}
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
        {detailData &&
          Object.entries(detailData).map(([key, value]) => (
            <div className="detail-field" key={key}>
              <span className="detail-label">{formatDetailLabel(key)}</span>
              <div className="detail-value">
                {renderDetailValue(key, detailData, value)}
              </div>
            </div>
          ))}
      </Dialog>

      <div className="pagination">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange && onPageChange(page - 1)}
        >
          ◀
        </button>

        <span>
          Seite {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange && onPageChange(page + 1)}
        >
          ▶
        </button>

        <select
          value={pageSize}
          onChange={(e) =>
            onPageSizeChange && onPageSizeChange(Number(e.target.value))
          }
        >
          <option value="10">10</option>

          <option value="25">25</option>

          <option value="50">50</option>

          <option value="100">100</option>
        </select>

        <span>pro Seite</span>
      </div>
    </div>
  );
}
