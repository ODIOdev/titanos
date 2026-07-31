import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn = {
  key: string;
  header: string;
  className?: string;
};

type DataTableProps = {
  columns: DataTableColumn[];
  rows: ReactNode[][];
  emptyMessage?: string;
  className?: string;
};

export function DataTable({
  columns,
  rows,
  emptyMessage = "No records found.",
  className,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-sm border border-border-gray bg-white",
        className,
      )}
    >
      <div className="max-lg:scrollbar-hidden overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-gray bg-light-gray">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal",
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
                  className="px-4 py-10 text-center text-medium-gray"
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
                        "px-4 py-3 align-middle",
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
