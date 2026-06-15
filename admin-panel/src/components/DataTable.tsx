import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  isLoading?: boolean;
  emptyText?: string;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  pageCount?: number;
  /** Total rows on server (for footer text). */
  total?: number;
  rowId?: (row: T) => string;
};

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyText = "Kayıt yok",
  pagination,
  onPaginationChange,
  pageCount,
  total,
  rowId,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    state: pagination ? { pagination } : undefined,
    onPaginationChange,
    manualPagination: Boolean(pagination),
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getRowId: rowId,
  });

  const showPaging = Boolean(pagination && onPaginationChange && pageCount !== undefined);

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-500">
                Yükleniyor…
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-500">
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {showPaging && pagination && onPaginationChange && (
        <div className="flex items-center justify-between gap-2 text-sm text-zinc-600">
          <span>
            {total !== undefined
              ? `Toplam ${total} kayıt (sayfa ${pagination.pageIndex + 1} / ${Math.max(pageCount ?? 1, 1)})`
              : `Sayfa ${pagination.pageIndex + 1} / ${Math.max(pageCount ?? 1, 1)}`}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagination.pageIndex <= 0}
              onClick={() =>
                onPaginationChange((old) => ({ ...old, pageIndex: old.pageIndex - 1 }))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagination.pageIndex >= (pageCount ?? 1) - 1}
              onClick={() =>
                onPaginationChange((old) => ({ ...old, pageIndex: old.pageIndex + 1 }))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function offsetToPageIndex(offset: number, limit: number): number {
  return Math.floor(offset / limit);
}

export function pageIndexToOffset(pageIndex: number, limit: number): number {
  return pageIndex * limit;
}
