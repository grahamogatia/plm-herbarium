import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./button";

/** Estimate how many table rows fit in the viewport. */
function useDynamicPageSize(rowHeight = 44, reservedHeight = 280) {
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    function calc() {
      const available = window.innerHeight - reservedHeight;
      setPageSize(Math.max(5, Math.floor(available / rowHeight)));
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [rowHeight, reservedHeight]);

  return pageSize;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  globalFilter,
  onGlobalFilterChange,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [internalGlobalFilter, setInternalGlobalFilter] = useState("");
  const filterValue = globalFilter ?? internalGlobalFilter;
  const handleGlobalFilterChange = onGlobalFilterChange ?? setInternalGlobalFilter;
  const pageSize = useDynamicPageSize();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: handleGlobalFilterChange,
    state: {
      globalFilter: filterValue,
    },
    initialState: {
      pagination: { pageSize, pageIndex: 0 },
    },
  });

  // Keep pageSize in sync when it changes from resize
  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="bg-zinc-900 font-semibold text-zinc-50 first:rounded-tl-lg last:rounded-tr-lg"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={[
                    onRowClick ? "group/row cursor-pointer" : "group/row",
                    "transition-colors hover:bg-lime-50/40 border-none",
                    rowIndex % 2 === 0 ? "bg-white" : "bg-zinc-50/60",
                  ].join(" ")}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-zinc-400"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-3">
          <p className="text-xs text-zinc-400">
            Page {currentPage + 1} of {totalPages}
            <span className="ml-2 text-zinc-300">
              ({table.getFilteredRowModel().rows.length} total)
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
