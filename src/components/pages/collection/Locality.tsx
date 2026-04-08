import LabelDesc from "@/components/layout/LabelDesc";
import type { SummaryField } from "@/api/config";
import type { Location, Specimen } from "@/data/types";

type LocalityProps = {
  specimenLocation: Location | null;
  specimen: Specimen | null;
  visibleFields?: SummaryField[];
};

function Locality({ specimenLocation, specimen, visibleFields }: LocalityProps) {
  const latitude = specimenLocation?.latitude;
  const longitude = specimenLocation?.longitude;
  const hasCoordinates =
    typeof latitude === "number" && typeof longitude === "number";

  const mapSrc = hasCoordinates
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&t=k&z=17&ie=UTF8&iwloc=&output=embed`
    : null;

  const openInMaps = () => {
    if (!hasCoordinates) return;
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, "_blank");
  };

  const show = (field: SummaryField) => !visibleFields || visibleFields.includes(field);

  return (
    <div className="flex flex-col gap-2">
      {show("country") && (
        <LabelDesc label="Country">
          <span>{specimenLocation?.country ?? "Philippines"}</span>
        </LabelDesc>
      )}

      {show("region") && (
        <LabelDesc label="Region">
          <span>{specimenLocation?.region ?? "Loading..."}</span>
        </LabelDesc>
      )}
      {show("province") && (
        <LabelDesc label="Province">
          <span>{specimenLocation?.province ?? "Loading..."}</span>
        </LabelDesc>
      )}

      {show("city") && (
        <LabelDesc label="City">
          <span>{specimenLocation?.locality ?? "Loading..."}</span>
        </LabelDesc>
      )}

      {show("altitude") && (
        <LabelDesc label="Altitude above sea level">
          <span>
            {specimen?.altitude_masl != null
              ? `${specimen.altitude_masl} masl`
              : "Loading..."}
          </span>
        </LabelDesc>
      )}

      {show("coordinates") && (
        <LabelDesc label="Coordinates">
          <span>
            {hasCoordinates
              ? `${latitude}, ${longitude}`
              : "Coordinates unavailable"}
          </span>
        </LabelDesc>
      )}

      {show("coordinates") && hasCoordinates && (
        <div className="flex justify-end">
          <button
            onClick={openInMaps}
            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Open in Google Maps
          </button>
        </div>
      )}

      <div className="mt-2 overflow-hidden rounded-md border border-zinc-200">
        {mapSrc ? (
          <iframe
            title="Specimen map"
            src={mapSrc}
            className="h-72 w-full"
            loading="lazy"
          />
        ) : (
          <div className="flex h-72 items-center justify-center bg-zinc-50 text-sm text-zinc-600">
            No map preview available for this specimen.
          </div>
        )}
      </div>
    </div>
  );
}

export default Locality;
