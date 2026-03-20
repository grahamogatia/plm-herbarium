import CollectionFilters from "@/components/pages/collection/CollectionFilters";
import CollectionHeader from "@/components/pages/collection/CollectionHeader";
import CollectionResults from "@/components/pages/collection/CollectionTableView";
import CollectionGalleryView from "@/components/pages/collection/CollectionGalleryView";
import { getCollectionRows, type CollectionRow } from "@/api/collection";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Collection() {
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "gallery">("table");

  const familyOptions = Array.from(
    new Set(rows.map((row) => row.family)),
  ).sort();
  const filteredRows =
    selectedFamilies.length === 0
      ? rows
      : rows.filter((row) => selectedFamilies.includes(row.family));
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const galleryRows =
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
        });

  useEffect(() => {
    let isMounted = true;

    const loadRows = async () => {
      try {
        const data = await getCollectionRows();
        if (isMounted) {
          setRows(data);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Failed to fetch collection rows:", error);
        if (isMounted) {
          setErrorMessage("Failed to load collection data from Firestore.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRows();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <div className="bg-lime-800 p-4 w-full">
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
        </div>
      </div>
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
      {viewMode === "table" ? (
        <CollectionResults
          isLoading={isLoading}
          errorMessage={errorMessage}
          rows={filteredRows}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      ) : (
        <CollectionGalleryView
          isLoading={isLoading}
          errorMessage={errorMessage}
          rows={galleryRows}
        />
      )}
    </>
  );
}

export default Collection;
