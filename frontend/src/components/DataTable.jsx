import {useMemo, useState} from "react";
import PermissionButton from "./PermissionButton";

export default function DataTable({
                                      title = "",
                                      columns = [],
                                      data = [],
                                      loading = false,
                                      page = 1,
                                      totalPages = 1,
                                      pageSize = 10,
                                      onPageChange,
                                      onPageSizeChange,
                                      onSearch,
                                      onSort,
                                      toolbarActions = [],
                                      rowActions = [],
                                      searchable = false,
                                      selectableColumns = true,
                                      onColumnsChange,
                                      showDetails = true,
                                      onRowClick
                                  }) {


    const [sortField, setSortField] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");
    const columnCount = columns.length + (rowActions.length > 0 ? 1 : 0);
    const [search, setSearch] = useState("");

    const [showColumns, setShowColumns] = useState(false);
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    const [visibleColumns, setVisibleColumns] = useState(columns.filter(c => c.visible !== false));

    const detectedColumns = data.length > 0 ? Object.keys(data[0]).map(field => ({
        field, title: field
    })) : [];

    const availableColumns = columns.length > 0 ? columns : detectedColumns;

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailData, setDetailData] = useState(null);

    function searchChange(e) {

        const value = e.target.value;

        setSearch(value);

        if (onSearch) onSearch(value);

    }

    function openDetails(row) {

        if (!showDetails) return;

        setDetailData(row);
        setDetailOpen(true);

    }

    function sort(field) {

        let order = "asc";

        if (field === sortField) order = sortOrder === "asc" ? "desc" : "asc";

        setSortField(field);
        setSortOrder(order);

        onSort && onSort(field, order);
    }

    function toggleColumn(column) {

        const exists = visibleColumns.some(c => c.field === column.field);


        let result;


        if (exists) {

            result = visibleColumns.filter(c => c.field !== column.field);

        } else {

            result = [...visibleColumns, column];

        }


        setVisibleColumns(result);


        if (onColumnsChange) onColumnsChange(result);

    }

    return (

        <div className="card">
            <div className="toolbar">
                <h2>{title}</h2>
                <div className="toolbar-right">

                    {searchable && <input
                        placeholder="Suchen..."
                        value={search}
                        onChange={searchChange}
                    />}

                    {selectableColumns && <button
                        className="icon-button"
                        title="Spalten auswählen"
                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                    >
                        ⚙️
                    </button>}

                    {showColumnMenu && <div className="column-popup">

                        <strong>
                            Spalten
                        </strong>


                        {availableColumns.map(c =>

                            <label key={c.field}>

                                <input
                                    type="checkbox"

                                    checked={visibleColumns.some(v => v.field === c.field)}

                                    onChange={() => toggleColumn(c)}
                                />

                                {c.title}

                            </label>)}

                    </div>}
                    {toolbarActions.map(action => <PermissionButton
                        key={action.name}
                        permission={action.permission}
                        onClick={action.onClick}
                    >
                        {action.label}
                    </PermissionButton>)}

                </div>
            </div>
            <table className="datatable">
                <thead>
                <tr>
                    {visibleColumns.map(c => <th
                        key={c.field}
                        onClick={() => sort(c.field)}
                    >
                        {c.title}
                        {sortField === c.field && (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>)}
                    {rowActions.length > 0 && <th>Aktionen</th>}
                </tr>
                </thead>
                <tbody>
                {loading === true && <tr>
                    <td colSpan={columnCount}>
                        Laden...
                    </td>
                </tr>}
                {loading === false && data.length === 0 && <tr>
                    <td colSpan={columnCount}>
                        Keine Daten vorhanden
                    </td>

                </tr>}
                {!loading && data.map(r => <tr
                    key={r.id}
                    onClick={() => openDetails(r)}
                    className={showDetails ? "clickable-row" : ""}
                >

                    {visibleColumns.map(c => <td key={c.field}>
                        {c.render ? c.render(r) : r[c.field]}
                    </td>)}


                    {rowActions.length > 0 && <td>

                        <div className="table-actions">

                            {rowActions.map(action =>

                                <PermissionButton
                                    key={action.name}
                                    permission={action.permission}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick(r);
                                    }}
                                >
                                    {action.label}
                                </PermissionButton>)}

                        </div>

                    </td>}

                </tr>)}
                </tbody>
            </table>


            {detailOpen && detailData &&

                <div className="detail-popup">

                    <div className="detail-header">

                        <h3>
                            Details

                            <button
                                onClick={() => setDetailOpen(false)}
                            >
                                ✕
                            </button>
                        </h3>


                    </div>


                    <div className="detail-body">

                        {Object.entries(detailData).map(([key, value]) =>

                                <div
                                    key={key}
                                    className="detail-field"
                                >

                                    <strong>
                                        {key}
                                    </strong>

                                    <span>
                        {String(value)}
                    </span>

                                </div>
                        )}

                    </div>

                </div>

            }


            <div className="pagination">

                <button
                    disabled={page <= 1}
                    onClick={() => onPageChange && onPageChange(page - 1)}
                >
                    ◀
                </button>


                <span>
        Seite {page} / {totalPages}
    </span>


                <button
                    disabled={page >= totalPages}
                    onClick={() => onPageChange && onPageChange(page + 1)}
                >
                    ▶
                </button>


                <select
                    value={pageSize}
                    onChange={e =>
                        onPageSizeChange &&
                        onPageSizeChange(Number(e.target.value))
                    }
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>


                <span>
                pro Seite
                </span>

            </div>


        </div>
    );
}