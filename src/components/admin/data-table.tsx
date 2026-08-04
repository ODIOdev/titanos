import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn = {
  key: string;
  /** Column title — string or custom node (e.g. select-all checkbox). */
  header: ReactNode;
  className?: string;
};

type DataTableProps = {
  columns: DataTableColumn[];
  rows: ReactNode[][];
  emptyMessage?: string;
  className?: string;
  /** Fit narrow cards without horizontal scroll. */
  compact?: boolean;
};

export function DataTable({
  columns,
  rows,
  emptyMessage = "No records found.",
  className,
  compact = false,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-sm border border-border-gray bg-white",
        className,
      )}
    >
      <div
        className={cn(
          compact ? "overflow-x-hidden" : "max-lg:scrollbar-hidden overflow-x-auto",
        )}
      >
        <table
          className={cn(
            "w-full border-collapse text-left text-sm",
            compact ? "table-fixed" : "min-w-[640px]",
          )}
        >
          <thead>
            <tr className="border-b border-border-gray bg-light-gray">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal",
                    compact ? "px-2.5 py-2.5 sm:px-3" : "px-4 py-3",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={cn(
                    "text-center text-medium-gray",
                    compact ? "px-2.5 py-8 sm:px-3" : "px-4 py-10",
                  )}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((cells, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-border-gray last:border-0 hover:bg-light-gray/60"
                >
                  {cells.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        "align-middle",
                        compact ? "px-2.5 py-2.5 sm:px-3" : "px-4 py-3",
                        columns[cellIndex]?.className,
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
