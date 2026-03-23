import LabelDesc from "@/components/layout/LabelDesc";
import type { Location, Specimen } from "@/data/types";

type LocalityProps = {
  specimenLocation: Location | null;
  specimen: Specimen | null;
};

function Locality({ specimenLocation, specimen }: LocalityProps) {
  const latitude = specimenLocation?.latitude;
  const longitude = specimenLocation?.longitude;
  const hasCoordinates =
    typeof latitude === "number" && typeof longitude === "number";

  // 🔍 Higher zoom (17) + Satellite view (better for habitat)
  const mapSrc = hasCoordinates
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&t=k&z=17&ie=UTF8&iwloc=&output=embed`
    : null;

  // 🌐 Open in Google Maps (new tab)
  const openInMaps = () => {
    if (!hasCoordinates) return;
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col gap-2">
      <LabelDesc label="Country">
        <span>{specimenLocation?.locality ?? "Loading..."}</span>
      </LabelDesc>

      <LabelDesc label="Region">
        <span>{specimenLocation?.province ?? "Loading..."}</span>
      </LabelDesc>

      <LabelDesc label="City">
        <span>{specimenLocation?.region ?? "Loading..."}</span>
      </LabelDesc>

      <LabelDesc label="Altitude above sea level">
        <span>
          {specimen?.altitude_masl != null
            ? `${specimen.altitude_masl} masl`
            : "Loading..."}
        </span>
      </LabelDesc>

      <LabelDesc label="Coordinates">
        <span>
          {hasCoordinates
            ? `${latitude}, ${longitude}`
            : "Coordinates unavailable"}
        </span>
      </LabelDesc>

      {/* 🌐 Open in Maps Button */}
      {hasCoordinates && (
        <div className="flex justify-end">
          <button
            onClick={openInMaps}
            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Open in Google Maps
          </button>
        </div>
      )}

      {/* 🗺️ Map */}
      <div className="mt-2 overflow-hidden rounded-md border border-zinc-200">
        {mapSrc ? (
          <iframe
            title="Specimen map"
            src={mapSrc}
            className="h-72 w-full" // slightly taller
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