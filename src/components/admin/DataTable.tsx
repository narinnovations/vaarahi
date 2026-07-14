import { useMemo, useState, useEffect, type ReactNode } from "react";
import {
  Download,
  Search as SearchIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
  Trash2,
  Loader2,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { downloadCSV, downloadXLSX } from "@/lib/csv";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  accessor?: (row: T) => unknown;
  className?: string;
  sortable?: boolean;
  filterOptions?: { label: string; value: string }[];
};

export type BulkAction<T> = {
  label: string;
  icon?: ReactNode;
  variant?: "default" | "danger";
  onClick: (rows: T[]) => void | Promise<void>;
  confirm?: string;
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  searchable?: boolean;
  pageSize?: number;
  exportName?: string;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  actions?: ReactNode;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  getRowId?: (row: T) => string;
  bulkActions?: BulkAction<T>[];
  printable?: boolean;
  initialSort?: { key: string; dir: "asc" | "desc" };
};

export function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  searchable = true,
  pageSize = 20,
  exportName,
  emptyMessage = "No records",
  emptyIcon,
  actions,
  isLoading = false,
  error,
  onRetry,
  getRowId,
  bulkActions,
  printable = true,
  initialSort,
}: Props<T>) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => setSelected(new Set()), [rows]);

  const rowId = (r: T, i: number): string => getRowId?.(r) ?? String((r as { id?: unknown }).id ?? i);

  const getValue = (r: T, c: Column<T>) => (c.accessor ? c.accessor(r) : r[c.key]);

  const filtered = useMemo(() => {
    let out = rows;
    if (q) {
      const needle = q.toLowerCase();
      out = out.filter((r) =>
        columns.some((c) => {
          const v = getValue(r, c);
          return v != null && String(v).toLowerCase().includes(needle);
        }),
      );
    }
    for (const [k, v] of Object.entries(filters)) {
      if (!v) continue;
      const col = columns.find((c) => c.key === k);
      if (!col) continue;
      out = out.filter((r) => String(getValue(r, col) ?? "") === v);
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        const dir = sort.dir === "asc" ? 1 : -1;
        out = [...out].sort((a, b) => {
          const va = getValue(a, col);
          const vb = getValue(b, col);
          if (va == null && vb == null) return 0;
          if (va == null) return -dir;
          if (vb == null) return dir;
          const na = Number(va);
          const nb = Number(vb);
          if (!Number.isNaN(na) && !Number.isNaN(nb) && typeof va !== "string" && typeof vb !== "string") {
            return (na - nb) * dir;
          }
          return String(va).localeCompare(String(vb)) * dir;
        });
      }
    }
    return out;
  }, [rows, q, filters, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const p = Math.min(page, totalPages);
  const start = (p - 1) * size;
  const pageRows = filtered.slice(start, start + size);

  const allPageSelected = pageRows.length > 0 && pageRows.every((r, i) => selected.has(rowId(r, start + i)));
  const togglePage = () => {
    const next = new Set(selected);
    if (allPageSelected) pageRows.forEach((r, i) => next.delete(rowId(r, start + i)));
    else pageRows.forEach((r, i) => next.add(rowId(r, start + i)));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectedRows = useMemo(
    () => filtered.filter((r, i) => selected.has(rowId(r, i))),
    [filtered, selected],
  );

  const exportRows = () =>
    filtered.map((r) => {
      const out: Record<string, unknown> = {};
      for (const c of columns) out[c.header] = getValue(r, c);
      return out;
    });

  const doPrint = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const headers = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("");
    const body = filtered
      .map(
        (r) =>
          `<tr>${columns
            .map((c) => `<td>${escapeHtml(String(getValue(r, c) ?? ""))}</td>`)
            .join("")}</tr>`,
      )
      .join("");
    w.document.write(`<!doctype html><html><head><title>${exportName ?? "Print"}</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}
      h1{font-size:18px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
      th{background:#f5f5f5}</style></head><body>
      <h1>${escapeHtml(exportName ?? "Records")} (${filtered.length})</h1>
      <table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>
      <script>window.print();</script></body></html>`);
    w.document.close();
  };

  const filterableCols = columns.filter((c) => c.filterOptions && c.filterOptions.length > 0);
  const showBulk = !!bulkActions?.length;

  return (
    <div className="rounded-2xl border bg-background shadow-soft">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b p-3">
        {searchable && (
          <div className="relative flex-1 min-w-48">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search…"
              className="w-full rounded-full border border-border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-champagne"
            />
          </div>
        )}
        {filterableCols.map((c) => (
          <select
            key={c.key}
            value={filters[c.key] ?? ""}
            onChange={(e) => {
              setFilters((f) => ({ ...f, [c.key]: e.target.value }));
              setPage(1);
            }}
            className="rounded-full border bg-background px-3 py-2 text-xs"
          >
            <option value="">All {c.header}</option>
            {c.filterOptions!.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {actions}
          {printable && filtered.length > 0 && (
            <button
              onClick={doPrint}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs hover:bg-blush"
              title="Print"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
          )}
          {exportName && (
            <>
              <button
                onClick={() => downloadCSV(exportName, exportRows())}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs hover:bg-blush"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button
                onClick={() => downloadXLSX(exportName, exportRows())}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs hover:bg-blush"
              >
                <Download className="h-3.5 w-3.5" /> Excel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {showBulk && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-blush/30 px-3 py-2 text-xs">
          <span className="font-medium">{selected.size} selected</span>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-full border px-2.5 py-1 hover:bg-background"
          >
            Clear
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            {bulkActions!.map((a, i) => (
              <button
                key={i}
                onClick={async () => {
                  if (a.confirm && !confirm(a.confirm.replace("{n}", String(selectedRows.length)))) return;
                  await a.onClick(selectedRows);
                  setSelected(new Set());
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 hover:bg-background",
                  a.variant === "danger" && "border-ruby/40 text-ruby hover:bg-ruby/10",
                )}
              >
                {a.icon ?? <Trash2 className="h-3.5 w-3.5" />} {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-blush/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              {showBulk && (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={togglePage}
                    aria-label="Select page"
                  />
                </th>
              )}
              {columns.map((c) => {
                const sortable = c.sortable !== false && c.key !== "actions" && c.key !== "";
                const active = sort?.key === c.key;
                return (
                  <th key={c.key} className={cn("px-4 py-2.5 font-medium", c.className)}>
                    {sortable ? (
                      <button
                        onClick={() =>
                          setSort((s) =>
                            s?.key === c.key
                              ? s.dir === "asc"
                                ? { key: c.key, dir: "desc" }
                                : null
                              : { key: c.key, dir: "asc" },
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {c.header}
                        {active ? (
                          sort!.dir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (showBulk ? 1 : 0)}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  <div className="mt-2 text-xs">Loading…</div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={columns.length + (showBulk ? 1 : 0)}
                  className="px-4 py-12 text-center text-ruby"
                >
                  <AlertCircle className="mx-auto h-5 w-5" />
                  <div className="mt-2 text-xs">
                    {(error as { message?: string })?.message ?? "Failed to load"}
                  </div>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="mt-3 rounded-full border px-3 py-1 text-xs hover:bg-blush"
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showBulk ? 1 : 0)}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {emptyIcon ?? <Inbox className="mx-auto h-6 w-6 opacity-50" />}
                  <div className="mt-2 text-xs">{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              pageRows.map((r, i) => {
                const id = rowId(r, start + i);
                const isSel = selected.has(id);
                return (
                  <tr
                    key={id}
                    className={cn("border-b last:border-0 hover:bg-blush/20", isSel && "bg-blush/40")}
                  >
                    {showBulk && (
                      <td className="w-10 px-3 py-2.5">
                        <input type="checkbox" checked={isSel} onChange={() => toggleOne(id)} />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-2.5 align-middle", c.className)}>
                        {c.render ? c.render(r) : (r[c.key] as ReactNode)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              {start + 1}–{Math.min(start + size, filtered.length)} of {filtered.length}
            </span>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded border bg-background px-2 py-1 text-xs"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={p <= 1}
              onClick={() => setPage(1)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              «
            </button>
            <button
              disabled={p <= 1}
              onClick={() => setPage(p - 1)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-2">
              Page {p} / {totalPages}
            </span>
            <button
              disabled={p >= totalPages}
              onClick={() => setPage(p + 1)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
            <button
              disabled={p >= totalPages}
              onClick={() => setPage(totalPages)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
