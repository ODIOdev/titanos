"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
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
  /** Never allow horizontal overflow (table fills container width). */
  noHorizontalScroll?: boolean;
  /**
   * Optional per-row href. When set, clicking the row (outside interactive
   * controls) navigates there.
   */
  rowHrefs?: (string | null | undefined)[];
  onRowNavigate?: (href: string) => void;
  /** Click/keyboard activate a row (outside interactive controls). */
  onRowActivate?: (rowIndex: number) => void;
  /** Optional summary row under the body (same column count as `columns`). */
  footer?: ReactNode[] | null;
};

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "a, button, input, select, textarea, label, [role='button'], [data-no-row-nav]",
    ),
  );
}

export function DataTable({
  columns,
  rows,
  emptyMessage = "No records found.",
  className,
  compact = false,
  noHorizontalScroll = false,
  rowHrefs,
  onRowNavigate,
  onRowActivate,
  footer = null,
}: DataTableProps) {
  const lockWidth = compact || noHorizontalScroll;

  function navigate(href: string) {
    if (onRowNavigate) {
      onRowNavigate(href);
      return;
    }
    window.location.assign(href);
  }

  function activateRow(rowIndex: number) {
    if (onRowActivate) {
      onRowActivate(rowIndex);
      return;
    }
    const href = rowHrefs?.[rowIndex];
    if (href) navigate(href);
  }

  function handleRowClick(
    event: MouseEvent<HTMLTableRowElement>,
    rowIndex: number,
  ) {
    if (isInteractiveTarget(event.target)) return;
    if (!onRowActivate && !rowHrefs?.[rowIndex]) return;
    activateRow(rowIndex);
  }

  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    rowIndex: number,
  ) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (isInteractiveTarget(event.target)) return;
    if (!onRowActivate && !rowHrefs?.[rowIndex]) return;
    event.preventDefault();
    activateRow(rowIndex);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-sm border border-border-gray bg-white",
        className,
      )}
    >
      <div
        className={cn(
          lockWidth
            ? "overflow-x-hidden"
            : "max-lg:scrollbar-hidden overflow-x-auto",
        )}
      >
        <table
          className={cn(
            "w-full border-collapse text-left text-sm",
            lockWidth ? "table-fixed" : "min-w-[640px]",
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
                    lockWidth && "min-w-0",
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
              rows.map((cells, rowIndex) => {
                const clickable = Boolean(
                  onRowActivate || rowHrefs?.[rowIndex],
                );
                return (
                  <tr
                    key={rowIndex}
                    className={cn(
                      "border-b border-border-gray last:border-0 hover:bg-light-gray/60",
                      clickable && "cursor-pointer",
                    )}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={
                      clickable
                        ? (event) => handleRowClick(event, rowIndex)
                        : undefined
                    }
                    onKeyDown={
                      clickable
                        ? (event) => handleRowKeyDown(event, rowIndex)
                        : undefined
                    }
                  >
                    {cells.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={cn(
                          "align-middle",
                          compact ? "px-2.5 py-2.5 sm:px-3" : "px-4 py-3",
                          lockWidth && "min-w-0",
                          lockWidth &&
                            !columns[cellIndex]?.className?.includes(
                              "overflow-visible",
                            ) &&
                            "overflow-hidden",
                          columns[cellIndex]?.className,
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
          {footer && footer.length > 0 && rows.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-border-gray bg-light-gray/80">
                {footer.map((cell, cellIndex) => (
                  <td
                    key={`footer-${cellIndex}`}
                    className={cn(
                      "align-middle font-semibold text-dark-charcoal",
                      compact ? "px-2.5 py-2.5 sm:px-3" : "px-4 py-3",
                      lockWidth && "min-w-0",
                      columns[cellIndex]?.className,
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
