import {
  getSpecimenByAccession,
  getSpeciesBySpeciesId,
  getCollectorsByCollectorIds,
  getLocationByLocationId,
  type CollectionRow,
} from "@/api/collection";
import { useQuery } from "@tanstack/react-query";
import Locality from "@/components/pages/collection/Locality";
import Summary from "@/components/pages/collection/Summary";
import TaxonClassification from "@/components/pages/collection/TaxonClassification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";
import type { Specimen, Species, Collector, Location } from "@/data/types";
import { ImageOff } from "lucide-react";
import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";

function CollectionDetails() {
  const { accessionNo = "" } = useParams();
  const location = useLocation();

  const decodedAccessionNo = useMemo(
    () => decodeURIComponent(accessionNo),
    [accessionNo],
  );

  const routeRow = (location.state as { row?: CollectionRow } | null)?.row;
  const taxonFromRoute =
    routeRow?.accessionNo === decodedAccessionNo ? routeRow.taxon : null;

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
    <>
      <div className="bg-lime-800 p-4 w-full text-zinc-50 italic">
        <TypographyH2>{taxonFromRoute ?? "Specimen"}</TypographyH2>
      </div>

      <div className="p-4 h-full">
        <div className="flex w-full min-h-[70vh] h-full gap-4 items-stretch">
          {/* Left side (image placeholder) */}
          <div className="flex-1 h-full">
            <div className="relative flex w-full h-full min-h-[70vh] items-center justify-center overflow-hidden rounded-md border border-zinc-950">
              <ImageOff
                className="h-14 w-14 text-gray-500"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex-1 h-full">
            <div className="w-full h-full min-h-[70vh] flex justify-center rounded-md">
              <Tabs defaultValue="summary" className="w-100">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="taxon">Taxon Classification</TabsTrigger>
                  <TabsTrigger value="locality">Locality</TabsTrigger>
                </TabsList>
                <div className="p-2">
                  <TabsContent value="summary">
                    <Summary
                      species={species}
                      collectors={collectors}
                      specimenLocation={specimenLocation}
                      specimen={specimen}
                      formattedDateCollected={formattedDateCollected}
                    />
                  </TabsContent>
                  <TabsContent value="taxon">
                    <TaxonClassification species={species} />
                  </TabsContent>
                  <TabsContent value="locality">
                    <Locality
                      specimenLocation={specimenLocation}
                      specimen={specimen}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CollectionDetails;
