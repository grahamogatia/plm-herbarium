import {
  getCollectionRowByAccession,
  type CollectionRow,
} from "@/api/collection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

function CollectionDetails() {
  const { accessionNo = "" } = useParams();
  const location = useLocation();

  const decodedAccessionNo = useMemo(
    () => decodeURIComponent(accessionNo),
    [accessionNo],
  );

  const routeRow = (location.state as { row?: CollectionRow } | null)?.row;
  const initialSpecimen =
    routeRow?.accessionNo === decodedAccessionNo ? routeRow : null;

  const [specimen, setSpecimen] = useState<CollectionRow | null>(initialSpecimen);
  const [isLoading, setIsLoading] = useState(!initialSpecimen);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSpecimen = async () => {
      try {
        const data = await getCollectionRowByAccession(decodedAccessionNo);
        if (isMounted) {
          setSpecimen(data);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Failed to fetch collection details:", error);
        if (isMounted) {
          setErrorMessage("Failed to load collection details from Firestore.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSpecimen();

    return () => {
      isMounted = false;
    };
  }, [decodedAccessionNo]);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/collections">Back to Collection</Link>
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-6">
          <p className="text-sm text-zinc-600">Loading specimen details...</p>
        </Card>
      ) : errorMessage ? (
        <Card className="p-6">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </Card>
      ) : !specimen ? (
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-zinc-900">Specimen not found</h1>
          <p className="mt-2 text-sm text-zinc-600">
            No record found for accession number {decodedAccessionNo}.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          {specimen.photoUrl ? (
            <img
              src={specimen.photoUrl}
              alt={specimen.taxon}
              className="h-72 w-full object-cover"
            />
          ) : (
            <div className="h-72 w-full bg-zinc-100" />
          )}

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Taxon</p>
              <p className="text-lg italic text-zinc-900">{specimen.taxon}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Accession No.</p>
              <p className="font-mono text-sm text-zinc-800">{specimen.accessionNo}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Family</p>
              <p className="text-sm text-zinc-800">{specimen.family}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Collector</p>
              <p className="text-sm text-zinc-800">{specimen.collector}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Date</p>
              <p className="text-sm text-zinc-800">{specimen.date}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Locality</p>
              <p className="text-sm text-zinc-800">{specimen.locality}</p>
            </div>
          </div>
        </Card>
      )}
    </section>
  );
}

export default CollectionDetails;
