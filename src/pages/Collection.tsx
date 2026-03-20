import { DataTable } from "@/components/ui/datatable";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { specimenColumns } from "@/data/columns";
import { getCollectionRows, type CollectionRow } from "@/api/collection";
import * as React from "react";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";

function Collection() {
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const familyAnchor = useComboboxAnchor();

  const familyOptions = Array.from(new Set(rows.map((row) => row.family))).sort();
  const filteredRows =
    selectedFamilies.length === 0
      ? rows
      : rows.filter((row) => selectedFamilies.includes(row.family));

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
      <div className="bg-lime-800 text-zinc-50 p-4 w-full">
        <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-6">
          <div className="sm:justify-self-start">
            <TypographyH2>Collection</TypographyH2>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:items-center sm:justify-self-end">
            <div className="relative w-full">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search collection..."
                className="h-10 w-full border-lime-200/60 bg-white pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-lime-200"
                aria-label="Search collection"
              />
            </div>
            <Combobox
              multiple
              autoHighlight
              items={familyOptions}
              value={selectedFamilies}
              onValueChange={(values) => setSelectedFamilies(values as string[])}
            >
              <ComboboxChips
                ref={familyAnchor}
                className="w-full overflow-x-auto rounded-md border-lime-200/60 bg-white text-zinc-900 flex-nowrap!"
                aria-label="Filter by family"
              >
                <ComboboxValue>
                  {(values) => (
                    <React.Fragment>
                      {values.map((value: string) => (
                        <ComboboxChip key={value}>{value}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput placeholder="Filter families" />
                    </React.Fragment>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={familyAnchor}>
                <ComboboxEmpty>No families found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </div>
      <div className=" bg-white text-zinc-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-sm text-zinc-600">Loading collection data...</p>
        ) : errorMessage ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : (
          <DataTable
            columns={specimenColumns}
            data={filteredRows}
            globalFilter={searchQuery}
            onGlobalFilterChange={setSearchQuery}
          />
        )}
      </div>
    </>
  );
}

export default Collection;
