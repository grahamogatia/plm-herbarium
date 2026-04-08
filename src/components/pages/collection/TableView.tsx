import type { CollectionRow, DeleteSpecimenResult } from "@/api/collection";
import { DataTable } from "@/components/ui/datatable";
import { specimenColumns } from "@/data/columns";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

type TableViewProps = {
  isLoading: boolean;
  errorMessage: string | null;
  rows: CollectionRow[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onDeleteRow?: (row: CollectionRow, result: DeleteSpecimenResult) => void;
};

function TableView({
  isLoading,
  errorMessage,
  rows,
  searchQuery,
  onSearchQueryChange,
  onDeleteRow,
}: TableViewProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const columns = useMemo(
    () => specimenColumns({ onDeleted: onDeleteRow, isAuthenticated: !!currentUser }),
    [onDeleteRow, currentUser],
  );

  if (isLoading) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-zinc-500">Loading collection data...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-red-600">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <DataTable
        columns={columns}
        data={rows}
        globalFilter={searchQuery}
        onGlobalFilterChange={onSearchQueryChange}
        onRowClick={(row) =>
          navigate(`../collections/${encodeURIComponent(row.accessionNo)}`, {
            state: { row },
          })
        }
      />
    </div>
  );
}

export default TableView;
