import {
  getSpecimenByAccession,
  getSpeciesBySpeciesId,
  getCollectorByCollectorId,
  getLocationByLocationId,
  type CollectionRow,
} from "@/api/collection";
import Locality from "@/components/pages/collection/Locality";
import Summary from "@/components/pages/collection/Summary";
import TaxonClassification from "@/components/pages/collection/TaxonClassification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";
import type { Specimen, Species, Collector, Location } from "@/data/types";
import { ImageOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

  const [specimen, setSpecimen] = useState<Specimen | null>(null);
  const [species, setSpecies] = useState<Species | null>(null);
  const [collector, setCollector] = useState<Collector | null>(null);
  const [specimenLocation, setSpecimenLocation] = useState<Location | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    const loadSpecimen = async () => {
      try {
        const data = await getSpecimenByAccession(decodedAccessionNo);
        if (isMounted) {
          setSpecimen(data);
        }
      } catch (error) {
        console.error("Failed to fetch collection details:", error);
      }
    };

    loadSpecimen();

    return () => {
      isMounted = false;
    };
  }, [decodedAccessionNo]);

  useEffect(() => {
    if (!specimen) return;

    let isMounted = true;

    const loadRelatedData = async () => {
      try {
        const [speciesData, collectorData, locationData] = await Promise.all([
          getSpeciesBySpeciesId(specimen.species_id),
          getCollectorByCollectorId(specimen.collector_id),
          getLocationByLocationId(specimen.location_id),
        ]);

        if (isMounted) {
          setSpecies(speciesData);
          setCollector(collectorData);
          setSpecimenLocation(locationData);
        }
      } catch (error) {
        console.error("Failed to fetch related data:", error);
      }
    };

    loadRelatedData();

    return () => {
      isMounted = false;
    };
  }, [specimen]);

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
                      collector={collector}
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
