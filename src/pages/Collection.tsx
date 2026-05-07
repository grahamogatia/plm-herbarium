import CollectionHeader from "@/components/pages/collection/CollectionHeader";
import ChipFilters, { type ChipFiltersState, type SortOption } from "@/components/pages/collection/ChipFilters";
import CollectionGalleryView from "@/components/pages/collection/GalleryView";
import TableView from "@/components/pages/collection/TableView";
import { getCollectionRows, type CollectionRow, type DeleteSpecimenResult } from "@/api/collection";
import { getHerbariumConfig, type HerbariumConfig } from "@/api/config";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddSpecimen from "@/components/pages/collection/AddSpecimen";
import BatchUpload from "@/components/pages/collection/BatchUpload";
import { Check, AlertTriangle, Rows2, Rows3, Rows4, Search, SlidersHorizontal } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";

const ROW_OPTIONS = [1, 2, 4] as const;
type RowCount = (typeof ROW_OPTIONS)[number];

const COLLECTION_ROWS_STORAGE_KEY = "collectionRowsCache";

function readRowsFromSessionStorage(): CollectionRow[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(COLLECTION_ROWS_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return null;
    }

    return parsedValue as CollectionRow[];
  } catch {
    return null;
  }
}

function persistRowsToSessionStorage(rows: CollectionRow[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      COLLECTION_ROWS_STORAGE_KEY,
      JSON.stringify(rows),
    );
  } catch {
    // Ignore storage write failures and continue with in-memory state.
  }
}


function Collection() {
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chipFilters, setChipFilters] = useState<ChipFiltersState>({
    selectedFamilies: [],
    selectedCollectors: [],
    dateFrom: "",
    dateTo: "",
  });
  const [sort, setSort] = useState<SortOption | null>({ field: "accessionNo", direction: "asc" });
  const [viewMode, setViewMode] = useState<"table" | "gallery">("table");
  const [rowCount, setRowCount] = useState<RowCount>(2);
  const [deleteToastAccessionNo, setDeleteToastAccessionNo] = useState<string | null>(null);
  const [deleteResult, setDeleteResult] = useState<DeleteSpecimenResult | null>(null);
  const [herbariumConfig, setHerbariumConfig] = useState<HerbariumConfig | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const familyOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.family))).sort(),
    [rows],
  );

  const collectorOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.collector).filter(Boolean))).sort(),
    [rows],
  );

  const filteredRows = useMemo(() => {
    let result = rows;

    if (chipFilters.selectedFamilies.length > 0) {
      result = result.filter((row) => chipFilters.selectedFamilies.includes(row.family));
    }

    if (chipFilters.selectedCollectors.length > 0) {
      result = result.filter((row) => chipFilters.selectedCollectors.includes(row.collector));
    }

    if (chipFilters.dateFrom || chipFilters.dateTo) {
      result = result.filter((row) => {
        if (!row.date) return false;
        // Parse the row date for comparison
        const rowDate = row.date;
        if (chipFilters.dateFrom && rowDate < chipFilters.dateFrom) return false;
        if (chipFilters.dateTo && rowDate > chipFilters.dateTo) return false;
        return true;
      });
    }

    if (sort) {
      result = [...result].sort((a, b) => {
        let aVal = "";
        let bVal = "";
        if (sort.field === "taxon") { aVal = a.taxon; bVal = b.taxon; }
        else if (sort.field === "family") { aVal = a.family; bVal = b.family; }
        else if (sort.field === "collector") { aVal = a.collector; bVal = b.collector; }
        else if (sort.field === "date") { aVal = a.date; bVal = b.date; }
        else if (sort.field === "accessionNo") { aVal = a.accessionNo; bVal = b.accessionNo; }
        // Push empty values to the end regardless of sort direction
        if (!aVal && bVal) return 1;
        if (aVal && !bVal) return -1;
        const cmp = aVal.localeCompare(bVal);
        return sort.direction === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [rows, chipFilters, sort]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const galleryRows = useMemo(
    () =>
      normalizedSearch.length === 0
        ? filteredRows
        : filteredRows.filter((row) => {
            const haystack = [
              row.taxon,
              row.family,
              row.collector,
              row.accessionNo,
              row.locality,
              row.date,
            ]
              .join(" ")
              .toLowerCase();

            return haystack.includes(normalizedSearch);
          }),
    [filteredRows, normalizedSearch],
  );

  useEffect(() => {
    let isMounted = true;
    const cachedRows = readRowsFromSessionStorage();

    if (cachedRows) {
      setRows(cachedRows);
      setIsLoading(false);
    }

    const loadRows = async () => {
      try {
        const data = await getCollectionRows();
        if (isMounted) {
          setRows(data);
          persistRowsToSessionStorage(data);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Failed to fetch collection rows:", error);
        if (isMounted) {
          if (!cachedRows) {
            setErrorMessage("Failed to load collection data from Firestore.");
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRows();

    getHerbariumConfig()
      .then((cfg) => { if (isMounted) setHerbariumConfig(cfg); })
      .catch(() => { /* use defaults if config fails */ });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!deleteToastAccessionNo) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setDeleteToastAccessionNo(null);
      setDeleteResult(null);
    }, 4000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [deleteToastAccessionNo]);

  const handleDeleteRow = (deletedRow: CollectionRow, result: DeleteSpecimenResult) => {
    setRows((prev) => {
      const next = prev.filter(
        (row) => row.accessionNo !== deletedRow.accessionNo,
      );
      persistRowsToSessionStorage(next);
      return next;
    });
    setDeleteToastAccessionNo(deletedRow.accessionNo);
    setDeleteResult(result);
  };

  return (
    <>
      <div className="bg-zinc-900 p-4 w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <CollectionHeader />
          <div className="relative w-full sm:flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collection..."
              className="h-10 w-full border-zinc-200/60 bg-white pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-lime-300"
              aria-label="Search collection"
            />
          </div>
          <ButtonGroup>
            <AddSpecimen />
            <BatchUpload />
          </ButtonGroup>
        </div>
      </div>
      <div className="flex items-center justify-between border-b border-zinc-200 pr-4">
        <div className="flex items-center gap-1">
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "table" | "gallery")}
            className="pl-4 pt-4 pb-2"
          >
            <TabsList variant="line">
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === "gallery" && (
            <div className="flex items-center gap-1">
              {ROW_OPTIONS.map((opt) => {
                const Icon = opt === 1 ? Rows2 : opt === 2 ? Rows3 : Rows4;
                return (
                  <button
                    key={opt}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
                      rowCount === opt
                        ? "border-zinc-400 bg-zinc-100 text-zinc-900 font-medium"
                        : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                    }`}
                    onClick={() => setRowCount(opt)}
                  >
                    <Icon className="size-3.5" />
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showFilters
                ? "border border-lime-500 bg-lime-50 text-lime-800"
                : "border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            Filters
          </button>
        </div>
      </div>
      {showFilters && (
        <ChipFilters
          filters={chipFilters}
          onFiltersChange={setChipFilters}
          familyOptions={familyOptions}
          collectorOptions={collectorOptions}
          sort={sort}
          onSortChange={setSort}
        />
      )}
      {viewMode === "table" ? (
        <TableView
          isLoading={isLoading}
          errorMessage={errorMessage}
          rows={filteredRows}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onDeleteRow={handleDeleteRow}
          visibleAttributes={herbariumConfig?.tableAttributes}
        />
      ) : (
        <CollectionGalleryView
          isLoading={isLoading}
          errorMessage={errorMessage}
          rows={galleryRows}
          rowCount={rowCount}
        />
      )}

      {deleteToastAccessionNo ? (
        <div className="fixed bottom-4 right-4 z-50 w-[min(92vw,420px)] rounded-lg border border-lime-200 bg-white p-4 shadow-xl">
          <div className="mb-2 flex items-center gap-2 text-lime-700">
            <Check className="size-4" />
            <p className="text-sm font-semibold">
              Specimen deleted successfully
            </p>
          </div>
          <p className="text-sm text-slate-700">
            <span className="font-medium">Accession Code:</span>{" "}
            {deleteToastAccessionNo}
          </p>
          {deleteResult?.imageDeleted && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-lime-600">
              <Check className="size-3" />
              Image removed from storage
            </p>
          )}
          {deleteResult?.imageError && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="size-3" />
              Image could not be removed: {deleteResult.imageError}
            </p>
          )}
        </div>
      ) : null}
    </>
  );
}

export default Collection;
