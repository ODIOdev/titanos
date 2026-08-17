"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";

const DEFAULT_PAGE_SIZE = 15;

type LoadMoreDataTableProps = {
  columns: DataTableColumn[];
  rows: ReactNode[][];
  emptyMessage?: string;
  className?: string;
  compact?: boolean;
  /** Rows shown before the first Load more click. */
  pageSize?: number;
  rowHrefs?: (string | null | undefined)[];
  reorderable?: boolean;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  rowDragDisabled?: boolean[];
};

/** DataTable that reveals `pageSize` rows at a time on the same page. */
export function LoadMoreDataTable({
  columns,
  rows,
  emptyMessage,
  className,
  compact,
  pageSize = DEFAULT_PAGE_SIZE,
  rowHrefs,
  reorderable,
  onReorder,
  rowDragDisabled,
}: LoadMoreDataTableProps) {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const shown = rows.slice(0, visibleCount);
  const shownHrefs = rowHrefs?.slice(0, visibleCount);
  const remaining = Math.max(0, rows.length - shown.length);

  return (
    <div className="min-w-0">
      <DataTable
        columns={columns}
        rows={shown}
        emptyMessage={emptyMessage}
        className={className}
        compact={compact}
        rowHrefs={shownHrefs}
        onRowNavigate={(href) => router.push(href)}
        reorderable={reorderable}
        onReorder={onReorder}
        rowDragDisabled={rowDragDisabled?.slice(0, visibleCount)}
      />
      {remaining > 0 ? (
        <div className="border-t border-border-gray px-4 py-3 sm:px-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              setVisibleCount((count) => count + pageSize)
            }
          >
            Load more
            <span className="font-sans text-xs font-normal normal-case tracking-normal text-medium-gray">
              · {remaining} more
            </span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
