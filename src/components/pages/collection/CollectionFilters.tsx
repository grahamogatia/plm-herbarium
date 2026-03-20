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
import { Search } from "lucide-react";
import * as React from "react";

type CollectionFiltersProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  familyOptions: string[];
  selectedFamilies: string[];
  onSelectedFamiliesChange: (values: string[]) => void;
};

function CollectionFilters({
  searchQuery,
  onSearchQueryChange,
  familyOptions,
  selectedFamilies,
  onSelectedFamiliesChange,
}: CollectionFiltersProps) {
  const familyAnchor = useComboboxAnchor();

  return (
    <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:items-center">
      <div className="relative w-full">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          aria-hidden="true"
        />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
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
        onValueChange={(values) => onSelectedFamiliesChange(values as string[])}
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
  );
}

export default CollectionFilters;