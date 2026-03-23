import type { CollectionRow } from "@/api/collection";
import { DataTable } from "@/components/ui/datatable";
import { specimenColumns } from "@/data/columns";
import { useNavigate } from "react-router-dom";

type TableViewProps = {
  isLoading: boolean;
  errorMessage: string | null;
  rows: CollectionRow[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
};

function TableView({
  isLoading,
  errorMessage,
  rows,
  searchQuery,
  onSearchQueryChange,
}: TableViewProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-white text-zinc-900 rounded-lg p-4">
        <p className="text-sm text-zinc-600">Loading collection data...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-white text-zinc-900 rounded-lg p-4">
        <p className="text-sm text-red-600">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-zinc-900 rounded-lg p-4">
      <DataTable
        columns={specimenColumns}
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
