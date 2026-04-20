import { Input } from "@/components/ui/input";
import { ArrowDownAZ, ArrowUpAZ, CalendarDays, ListFilter, Plus, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type ChipFiltersState = {
  selectedFamilies: string[];
  selectedCollectors: string[];
  dateFrom: string;
  dateTo: string;
};

export type SortField = "taxon" | "family" | "collector" | "date" | "accessionNo";
export type SortDirection = "asc" | "desc";
export type SortOption = { field: SortField; direction: SortDirection };

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: "taxon", label: "Taxon" },
  { value: "family", label: "Family" },
  { value: "collector", label: "Collector" },
  { value: "date", label: "Date Collected" },
  { value: "accessionNo", label: "Accession No." },
];

type ChipFiltersProps = {
  filters: ChipFiltersState;
  onFiltersChange: (filters: ChipFiltersState) => void;
  familyOptions: string[];
  collectorOptions: string[];
  sort: SortOption | null;
  onSortChange: (sort: SortOption | null) => void;
};

type FilterType = "family" | "collector" | "date";

const FILTER_DEFS: { type: FilterType; label: string; icon: typeof ListFilter }[] = [
  { type: "family", label: "Family", icon: ListFilter },
  { type: "collector", label: "Collector", icon: User },
  { type: "date", label: "Date Collected", icon: CalendarDays },
];

function ChipFilters({
  filters,
  onFiltersChange,
  familyOptions,
  collectorOptions,
  sort,
  onSortChange,
}: ChipFiltersProps) {
  const [activeFilterTypes, setActiveFilterTypes] = useState<Set<FilterType>>(new Set());
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [openPopover, setOpenPopover] = useState<FilterType | null>(null);
  const [showSortPopover, setShowSortPopover] = useState(false);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const filterMenuRef = useRef<HTMLDivElement>(null);
  const familyChipRef = useRef<HTMLDivElement>(null);
  const collectorChipRef = useRef<HTMLDivElement>(null);
  const dateChipRef = useRef<HTMLDivElement>(null);
  const sortChipRef = useRef<HTMLDivElement>(null);

  // Sync active filter types from filters prop
  useEffect(() => {
    const types = new Set<FilterType>();
    if (filters.selectedFamilies.length > 0) types.add("family");
    if (filters.selectedCollectors.length > 0) types.add("collector");
    if (filters.dateFrom || filters.dateTo) types.add("date");
    setActiveFilterTypes(types);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setShowFilterMenu(false);
      }
      if (familyChipRef.current && !familyChipRef.current.contains(target) && openPopover === "family") {
        setOpenPopover(null);
      }
      if (collectorChipRef.current && !collectorChipRef.current.contains(target) && openPopover === "collector") {
        setOpenPopover(null);
      }
      if (dateChipRef.current && !dateChipRef.current.contains(target) && openPopover === "date") {
        setOpenPopover(null);
      }
      if (sortChipRef.current && !sortChipRef.current.contains(target)) {
        setShowSortPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openPopover]);

  const addFilterType = (type: FilterType) => {
    setActiveFilterTypes((prev) => new Set(prev).add(type));
    setShowFilterMenu(false);
    setOpenPopover(type);
  };

  const removeFilterType = (type: FilterType) => {
    setActiveFilterTypes((prev) => {
      const next = new Set(prev);
      next.delete(type);
      return next;
    });
    setOpenPopover(null);
    const updated = { ...filters };
    if (type === "family") updated.selectedFamilies = [];
    if (type === "collector") updated.selectedCollectors = [];
    if (type === "date") { updated.dateFrom = ""; updated.dateTo = ""; }
    onFiltersChange(updated);
  };

  const clearAll = () => {
    setActiveFilterTypes(new Set());
    setOpenPopover(null);
    setShowSortPopover(false);
    onSortChange(null);
    onFiltersChange({ selectedFamilies: [], selectedCollectors: [], dateFrom: "", dateTo: "" });
  };

  const toggleListItem = (type: "family" | "collector", value: string) => {
    const key = type === "family" ? "selectedFamilies" : "selectedCollectors";
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const hasAnyFilter = activeFilterTypes.size > 0 || sort !== null;
  const availableFilters = FILTER_DEFS.filter((f) => !activeFilterTypes.has(f.type));

  const getChipLabel = (type: FilterType): string => {
    if (type === "family") {
      const count = filters.selectedFamilies.length;
      if (count === 0) return "any";
      if (count === 1) return filters.selectedFamilies[0];
      return `${count} selected`;
    }
    if (type === "collector") {
      const count = filters.selectedCollectors.length;
      if (count === 0) return "any";
      if (count === 1) return filters.selectedCollectors[0];
      return `${count} selected`;
    }
    if (type === "date") {
      if (!filters.dateFrom && !filters.dateTo) return "any";
      const fmt = (d: string) =>
        new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `${filters.dateFrom ? fmt(filters.dateFrom) : "…"} → ${filters.dateTo ? fmt(filters.dateTo) : "…"}`;
    }
    return "any";
  };

  const renderListPopover = (
    type: "family" | "collector",
    options: string[],
    selected: string[],
  ) => {
    const search = (searchTerms[type] ?? "").toLowerCase();
    const filtered = search
      ? options.filter((o) => o.toLowerCase().includes(search))
      : options;

    return (
      <div className="absolute top-full left-0 mt-1.5 z-30 rounded-lg border border-lime-200 bg-white shadow-lg w-56 max-h-64 flex flex-col">
        <div className="p-2 border-b border-lime-100">
          <Input
            type="text"
            placeholder={`Search ${type}…`}
            value={searchTerms[type] ?? ""}
            onChange={(e) => setSearchTerms((prev) => ({ ...prev, [type]: e.target.value }))}
            className="h-7 text-xs focus-visible:ring-lime-300"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto flex-1 py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-400">No options found.</p>
          ) : (
            filtered.map((option) => (
              <button
                key={option}
                onClick={() => toggleListItem(type, option)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-lime-50"
              >
                <span
                  className={`flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
                    selected.includes(option)
                      ? "border-lime-600 bg-lime-600 text-white"
                      : "border-zinc-300"
                  }`}
                >
                  {selected.includes(option) && (
                    <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
                {option}
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderDatePopover = () => (
    <div className="absolute top-full left-0 mt-1.5 z-30 rounded-lg border border-lime-200 bg-white shadow-lg p-3 space-y-2 w-52">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-widest text-lime-600">From</label>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
          className="h-8 text-xs focus-visible:ring-lime-300"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-widest text-lime-600">To</label>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
          className="h-8 text-xs focus-visible:ring-lime-300"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-zinc-50 border-b border-zinc-200">
      {/* Sort chip */}
      <div className="relative" ref={sortChipRef}>
        {sort ? (
          <button
            onClick={() => setShowSortPopover((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors
              ${showSortPopover ? "border-lime-500 bg-lime-50 text-lime-900" : "border-lime-300 bg-white text-zinc-700 hover:bg-lime-50 hover:border-lime-400"}
            `}
          >
            {sort.direction === "asc" ? (
              <ArrowDownAZ className="size-3 text-lime-600" />
            ) : (
              <ArrowUpAZ className="size-3 text-lime-600" />
            )}
            <span className="text-lime-700">Sort</span>
            <span className="text-lime-900">
              {SORT_FIELDS.find((f) => f.value === sort.field)?.label} · {sort.direction === "asc" ? "A→Z" : "Z→A"}
            </span>
            <X
              className="size-3 text-lime-400 hover:text-lime-700"
              onClick={(e) => {
                e.stopPropagation();
                onSortChange(null);
                setShowSortPopover(false);
              }}
            />
          </button>
        ) : (
          <button
            onClick={() => setShowSortPopover((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-dashed border-lime-300 px-2.5 py-1.5 text-xs font-medium text-lime-600 hover:border-lime-400 hover:bg-lime-50 hover:text-lime-700"
          >
            <ArrowDownAZ className="size-3" />
            Sort
          </button>
        )}
        {showSortPopover && (
          <div className="absolute top-full left-0 mt-1.5 z-30 rounded-lg border border-lime-200 bg-white shadow-lg py-1 min-w-48">
            {SORT_FIELDS.map((sf) => {
              const isActive = sort?.field === sf.value;
              return (
                <button
                  key={sf.value}
                  onClick={() => {
                    if (isActive) {
                      onSortChange({ field: sf.value, direction: sort.direction === "asc" ? "desc" : "asc" });
                    } else {
                      onSortChange({ field: sf.value, direction: "asc" });
                    }
                    setShowSortPopover(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-lime-50 ${
                    isActive ? "text-lime-900 font-semibold" : "text-lime-700"
                  }`}
                >
                  <span>{sf.label}</span>
                  {isActive && (
                    <span className="text-lime-400 text-[10px]">
                      {sort.direction === "asc" ? "A→Z · click to flip" : "Z→A · click to flip"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {FILTER_DEFS.filter((f) => activeFilterTypes.has(f.type)).map((def) => {
        const chipRef = def.type === "family" ? familyChipRef : def.type === "collector" ? collectorChipRef : dateChipRef;
        const Icon = def.icon;
        const label = getChipLabel(def.type);
        const isAny = label === "any";

        return (
          <div key={def.type} className="relative" ref={chipRef}>
            <button
              onClick={() => setOpenPopover(openPopover === def.type ? null : def.type)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors
                ${openPopover === def.type ? "border-lime-500 bg-lime-50 text-lime-900" : "border-lime-300 bg-white text-zinc-700 hover:bg-lime-50 hover:border-lime-400"}
              `}
            >
              <Icon className={`size-3 ${openPopover === def.type ? "text-lime-600" : "text-lime-400"}`} />
              <span className="text-lime-700">{def.label}</span>
              <span className={isAny ? "text-lime-400" : "text-lime-900"}>{label}</span>
              <X
                className="size-3 text-lime-400 hover:text-lime-700"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFilterType(def.type);
                }}
              />
            </button>
            {openPopover === def.type && (
              def.type === "family"
                ? renderListPopover("family", familyOptions, filters.selectedFamilies)
                : def.type === "collector"
                  ? renderListPopover("collector", collectorOptions, filters.selectedCollectors)
                  : renderDatePopover()
            )}
          </div>
        );
      })}

      {/* Add filter button */}
      {availableFilters.length > 0 && (
        <div className="relative" ref={filterMenuRef}>
          <button
            onClick={() => setShowFilterMenu((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-dashed border-lime-300 px-2.5 py-1.5 text-xs font-medium text-lime-600 hover:border-lime-400 hover:bg-lime-50 hover:text-lime-700"
          >
            <Plus className="size-3" />
            Add filter
          </button>
          {showFilterMenu && (
            <div className="absolute top-full left-0 mt-1.5 z-30 rounded-lg border border-lime-200 bg-white shadow-lg py-1 min-w-40">
              {availableFilters.map((def) => {
                const Icon = def.icon;
                return (
                  <button
                    key={def.type}
                    onClick={() => addFilterType(def.type)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-lime-50"
                  >
                    <Icon className="size-3.5 text-lime-500" />
                    {def.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Clear all */}
      {hasAnyFilter && (
        <button
          onClick={clearAll}
          className="text-xs text-lime-600 hover:text-lime-800 font-medium"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export default ChipFilters;
