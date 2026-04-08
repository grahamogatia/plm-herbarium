import CollectionFilters from "@/components/pages/collection/CollectionFilters";
import CollectionHeader from "@/components/pages/collection/CollectionHeader";
import CollectionGalleryView from "@/components/pages/collection/GalleryView";
import TableView from "@/components/pages/collection/TableView";
import { getCollectionRows, type CollectionRow, type DeleteSpecimenResult } from "@/api/collection";
import { getHerbariumConfig, type HerbariumConfig } from "@/api/config";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddSpecimen from "@/components/pages/collection/AddSpecimen";
import BatchUpload from "@/components/pages/collection/BatchUpload";
import { Check, AlertTriangle, Rows2, Rows3, Rows4 } from "lucide-react";
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
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "gallery">("table");
  const [rowCount, setRowCount] = useState<RowCount>(2);
  const [deleteToastAccessionNo, setDeleteToastAccessionNo] = useState<
    string | null
  >(null);
  const [deleteResult, setDeleteResult] = useState<DeleteSpecimenResult | null>(null);
  const [herbariumConfig, setHerbariumConfig] = useState<HerbariumConfig | null>(null);

  const familyOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.family))).sort(),
    [rows],
  );

  const filteredRows = useMemo(
    () =>
      selectedFamilies.length === 0
        ? rows
        : rows.filter((row) => selectedFamilies.includes(row.family)),
    [rows, selectedFamilies],
  );

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
          <div className="w-full sm:flex-1">
            <CollectionFilters
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              familyOptions={familyOptions}
              selectedFamilies={selectedFamilies}
              onSelectedFamiliesChange={setSelectedFamilies}
            />
          </div>
          <ButtonGroup>
            <AddSpecimen />
            <BatchUpload />
          </ButtonGroup>
        </div>
      </div>
      <div className="flex items-center justify-between pr-4">
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
      </div>
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
