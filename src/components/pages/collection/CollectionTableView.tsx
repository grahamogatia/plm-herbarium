import { DataTable } from "@/components/ui/datatable";
import type { CollectionRow } from "@/api/collection";
import { specimenColumns } from "@/data/columns";

type CollectionResultsProps = {
  isLoading: boolean;
  errorMessage: string | null;
  rows: CollectionRow[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
};

function CollectionResults({
  isLoading,
  errorMessage,
  rows,
  searchQuery,
  onSearchQueryChange,
}: CollectionResultsProps) {
  return (
    <div className="bg-white text-zinc-900 rounded-lg p-4">
      {isLoading ? (
        <p className="text-sm text-zinc-600">Loading collection data...</p>
      ) : errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : (
        <DataTable
          columns={specimenColumns}
          data={rows}
          globalFilter={searchQuery}
          onGlobalFilterChange={onSearchQueryChange}
        />
      )}
    </div>
  );
}

export default CollectionResults;