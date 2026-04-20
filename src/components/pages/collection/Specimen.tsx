import {
  getSpecimenByAccession,
  getSpeciesBySpeciesId,
  getCollectorsByCollectorIds,
  getLocationByLocationId,
  getCollectionRows,
  type CollectionRow,
} from "@/api/collection";
import { getHerbariumConfig, type HerbariumConfig } from "@/api/config";
import { useQuery } from "@tanstack/react-query";
import Locality from "@/components/pages/collection/Locality";
import Summary from "@/components/pages/collection/Summary";
import SpecimenDetails from "@/components/pages/collection/SpecimenDetails";
import TaxonClassification from "@/components/pages/collection/TaxonClassification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import type { Specimen, Species, Collector, Location } from "@/data/types";
import { ImageOff, ZoomIn, ZoomOut, RotateCcw, Search } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

function SpecimenImageSpinner({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Spinner className="size-8 text-zinc-500" />
        </div>
      )}
      <img src={src} alt="" className="hidden" onLoad={() => setLoaded(true)} />
    </>
  );
}

function CollectionDetails() {
  const { accessionNo = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const decodedAccessionNo = useMemo(
    () => decodeURIComponent(accessionNo),
    [accessionNo],
  );

  const routeRow = (location.state as { row?: CollectionRow } | null)?.row;
  const taxonFromRoute =
    routeRow?.accessionNo === decodedAccessionNo ? routeRow.taxon : null;

  // Prevent page-level zoom (browser zoom), keep specimen image zoom
  useEffect(() => {
    const blockZoomWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    const blockZoomKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")) {
        e.preventDefault();
      }
    };
    document.addEventListener("wheel", blockZoomWheel, { passive: false });
    document.addEventListener("keydown", blockZoomKeyboard);
    return () => {
      document.removeEventListener("wheel", blockZoomWheel);
      document.removeEventListener("keydown", blockZoomKeyboard);
    };
  }, []);

  // Fetch all collection rows for taxon search
  const { data: allRows } = useQuery<CollectionRow[]>({
    queryKey: ["collection-rows"],
    queryFn: getCollectionRows,
    staleTime: 5 * 60 * 1000,
  });

  const [taxonSearch, setTaxonSearch] = useState("");

  const taxonOptions = useMemo(() => {
    if (!allRows) return [];
    const query = taxonSearch.trim().toLowerCase();
    // Deduplicate by accessionNo, group by taxon
    const filtered = query
      ? allRows.filter((r) => r.taxon.toLowerCase().includes(query))
      : allRows;
    return filtered.slice(0, 50);
  }, [allRows, taxonSearch]);

  const { data } = useQuery<{
    specimen: Specimen | null;
    species: Species | null;
    collectors: Collector[];
    specimenLocation: Location | null;
  }>({
    queryKey: ["specimen-details", decodedAccessionNo],
    enabled: Boolean(decodedAccessionNo),
    queryFn: async () => {
      const specimen = await getSpecimenByAccession(decodedAccessionNo);

      if (!specimen) {
        return {
          specimen: null,
          species: null,
          collectors: [],
          specimenLocation: null,
        };
      }

      const [species, collectors, specimenLocation] = await Promise.all([
        getSpeciesBySpeciesId(specimen.species_id),
        getCollectorsByCollectorIds(specimen.collector_ids),
        getLocationByLocationId(specimen.location_id),
      ]);

      return {
        specimen,
        species,
        collectors,
        specimenLocation,
      };
    },
  });

  const specimen = data?.specimen ?? null;
  const species = data?.species ?? null;
  const collectors = data?.collectors ?? [];
  const specimenLocation = data?.specimenLocation ?? null;

  const { data: herbariumConfig } = useQuery<HerbariumConfig>({
    queryKey: ["herbarium-config"],
    queryFn: getHerbariumConfig,
    staleTime: 5 * 60 * 1000,
  });

  const visibleFields = herbariumConfig?.summaryFields;

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.25;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => {
      const next = prev + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (scale <= 1) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scale, translate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    setTranslate({
      x: translateStart.current.x + (e.clientX - panStart.current.x),
      y: translateStart.current.y + (e.clientY - panStart.current.y),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  function resetView() {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  const formattedDateCollected = specimen?.date_collected
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
        .format(new Date(specimen.date_collected))
        .toUpperCase()
    : "Loading...";

  return (
    <div className="flex flex-col min-h-[calc(100dvh-56px)]">
      <div className="bg-zinc-900 px-4 py-3 w-full text-zinc-50 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="italic shrink-0">
            <TypographyH2>{taxonFromRoute ?? "Specimen"}</TypographyH2>
          </div>
          <div className="flex-1 sm:ml-auto">
            <Combobox
              value={null}
              inputValue={taxonSearch}
              onInputValueChange={setTaxonSearch}
              onValueChange={(value) => {
                if (!value) return;
                const match = allRows?.find((r) => r.accessionNo === value);
                if (match) {
                  setTaxonSearch("");
                  navigate(`/collections/${encodeURIComponent(match.accessionNo)}`, {
                    state: { row: match },
                  });
                }
              }}
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none z-10" />
                <ComboboxInput
                  placeholder="Search taxons…"
                  className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-800 pl-8 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-lime-600 focus:ring-1 focus:ring-lime-600"
                />
              </div>
              <ComboboxContent className="max-h-64 overflow-y-auto">
                <ComboboxList>
                  <ComboboxEmpty className="px-3 py-2 text-sm text-zinc-400">
                    No taxons found
                  </ComboboxEmpty>
                  {taxonOptions.map((row) => (
                    <ComboboxItem
                      key={row.accessionNo}
                      value={row.accessionNo}
                      className="text-sm italic"
                    >
                      <span>{row.taxon}</span>
                      <span className="ml-auto text-xs text-zinc-400 not-italic">
                        {row.accessionNo}
                      </span>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 min-h-0">
        <div className="flex flex-col lg:flex-row w-full h-full gap-4">
          {/* Image viewer */}
          <div className="w-full lg:basis-[70%] shrink-0 min-w-0 relative h-[50vh] lg:h-[calc(100dvh-56px-2rem-2rem)]">
            <div
              className="relative flex w-full h-full items-center justify-center overflow-hidden rounded-md border border-zinc-950 bg-zinc-950"
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={resetView}
              style={{ cursor: scale > 1 ? "grab" : "default", touchAction: "none" }}
            >
              {specimen?.photo_url ? (
                <>
                  <SpecimenImageSpinner src={specimen.photo_url} />
                  <img
                    src={specimen.photo_url}
                    alt={species?.scientific_name ?? "Specimen"}
                    className="max-h-full max-w-full object-contain select-none"
                    draggable={false}
                    style={{
                      transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                      transition: isPanning.current ? "none" : "transform 0.15s ease-out",
                    }}
                  />
                </>
              ) : (
                <ImageOff
                  className="h-14 w-14 text-gray-500"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Zoom controls */}
            {specimen?.photo_url && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900/90 p-1 backdrop-blur-sm">
                <button
                  className="flex h-7 w-7 items-center justify-center rounded text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                  onClick={() => setScale((s) => Math.max(MIN_ZOOM, s - ZOOM_STEP))}
                  title="Zoom out"
                >
                  <ZoomOut className="size-4" />
                </button>
                <span className="min-w-[3rem] text-center text-xs font-medium text-zinc-300">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                  onClick={() => setScale((s) => Math.min(MAX_ZOOM, s + ZOOM_STEP))}
                  title="Zoom in"
                >
                  <ZoomIn className="size-4" />
                </button>
                <div className="mx-0.5 h-4 w-px bg-zinc-700" />
                <button
                  className="flex h-7 w-7 items-center justify-center rounded text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                  onClick={resetView}
                  title="Reset view"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="w-full h-full flex justify-center rounded-md">
              <Tabs defaultValue="summary" className="w-full max-w-md">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="taxon">Taxon</TabsTrigger>
                  <TabsTrigger value="locality">Locality</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <div className="p-2">
                  <TabsContent value="summary">
                    <Summary
                      species={species}
                      collectors={collectors}
                      specimenLocation={specimenLocation}
                      specimen={specimen}
                      formattedDateCollected={formattedDateCollected}
                      visibleFields={visibleFields}
                    />
                  </TabsContent>
                  <TabsContent value="taxon">
                    <TaxonClassification species={species} visibleFields={visibleFields} />
                  </TabsContent>
                  <TabsContent value="locality">
                    <Locality
                      specimenLocation={specimenLocation}
                      specimen={specimen}
                      visibleFields={visibleFields}
                    />
                  </TabsContent>
                  <TabsContent value="details">
                    <SpecimenDetails specimen={specimen} visibleFields={visibleFields} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollectionDetails;
