import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/api/database";
import { SpecimenSchema } from "@/data/schemas";
import type { Specimen, Species, Collector, Location } from "@/data/types";

const COLLECTION_ROWS_CACHE_TTL_MS = 5 * 60 * 1000;
let collectionRowsCache: CollectionRow[] | null = null;
let collectionRowsCacheTimestamp = 0;
let inFlightCollectionRowsRequest: Promise<CollectionRow[]> | null = null;

export type CollectionRow = {
  specimenId: number;
  accessionNo: string;
  photoUrl?: string;
  taxon: string;
  family: string;
  collector: string;
  date: string;
  locality: string;
};

type SpeciesDoc = {
  species_id: number;
  family: string;
  scientific_name: string;
};

type CollectorDoc = {
  collector_id: number;
  name: string;
};

type LocationDoc = {
  location_id: number;
  locality: string;
};

type SpecimenDoc = {
  specimen_id: number;
  accesssion_no?: string;
  photo_url?: string;
  species_id: number;
  collector_id: number;
  location_id: number;
  date_collected?: unknown;
};

function mapSpecimenToRow(
  specimen: SpecimenDoc,
  species?: SpeciesDoc,
  collector?: CollectorDoc,
  location?: LocationDoc,
): CollectionRow {
  return {
    specimenId: specimen.specimen_id,
    accessionNo: specimen.accesssion_no ?? "-",
    photoUrl: specimen.photo_url,
    taxon: species?.scientific_name ?? "Unknown species",
    family: species?.family ?? "Unknown family",
    collector: collector?.name ?? "Unknown collector",
    date: formatDate(specimen.date_collected),
    locality: location?.locality ?? "Unknown locality",
  };
}

function formatDate(value: unknown): string {
  if (!value) {
    return "-";
  }

  if (value instanceof Date) {
    return value.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    const maybeDate = (value as { toDate: () => Date }).toDate();
    if (maybeDate instanceof Date) {
      return maybeDate.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }
  }

  return String(value);
}

export async function getCollectionRows(): Promise<CollectionRow[]> {
  const now = Date.now();
  const isCacheFresh =
    collectionRowsCache !== null &&
    now - collectionRowsCacheTimestamp < COLLECTION_ROWS_CACHE_TTL_MS;

  if (isCacheFresh && collectionRowsCache) {
    return collectionRowsCache;
  }

  if (inFlightCollectionRowsRequest) {
    return inFlightCollectionRowsRequest;
  }

  inFlightCollectionRowsRequest = (async () => {
    const [specimensSnapshot, speciesSnapshot, collectorsSnapshot, locationsSnapshot] =
      await Promise.all([
        getDocs(collection(db, "specimens")),
        getDocs(collection(db, "species")),
        getDocs(collection(db, "collectors")),
        getDocs(collection(db, "locations")),
      ]);

    const speciesById = new Map<number, SpeciesDoc>(
      speciesSnapshot.docs.map((doc) => {
        const data = doc.data() as SpeciesDoc;
        return [data.species_id, data];
      })
    );

    const collectorsById = new Map<number, CollectorDoc>(
      collectorsSnapshot.docs.map((doc) => {
        const data = doc.data() as CollectorDoc;
        return [data.collector_id, data];
      })
    );

    const locationsById = new Map<number, LocationDoc>(
      locationsSnapshot.docs.map((doc) => {
        const data = doc.data() as LocationDoc;
        return [data.location_id, data];
      })
    );

    const rows = specimensSnapshot.docs.map((doc) => {
      const specimen = doc.data() as SpecimenDoc;
      const species = speciesById.get(specimen.species_id);
      const collector = collectorsById.get(specimen.collector_id);
      const location = locationsById.get(specimen.location_id);

      return mapSpecimenToRow(specimen, species, collector, location);
    });

    rows.sort((a, b) => a.specimenId - b.specimenId);

    collectionRowsCache = rows;
    collectionRowsCacheTimestamp = Date.now();

    return rows;
  })();

  try {
    return await inFlightCollectionRowsRequest;
  } finally {
    inFlightCollectionRowsRequest = null;
  }
}

export async function getCollectionRowByAccession(
  accessionNo: string,
): Promise<CollectionRow | null> {
  const normalizedAccessionNo = accessionNo.trim();
  if (!normalizedAccessionNo) {
    return null;
  }

  const specimenSnapshot = await getDocs(
    query(
      collection(db, "specimens"),
      where("accesssion_no", "==", normalizedAccessionNo),
      limit(1),
    ),
  );

  const specimenDoc = specimenSnapshot.docs.at(0);
  if (!specimenDoc) {
    return null;
  }

  const specimen = specimenDoc.data() as SpecimenDoc;

  const [speciesSnapshot, collectorSnapshot, locationSnapshot] = await Promise.all([
    getDocs(
      query(
        collection(db, "species"),
        where("species_id", "==", specimen.species_id),
        limit(1),
      ),
    ),
    getDocs(
      query(
        collection(db, "collectors"),
        where("collector_id", "==", specimen.collector_id),
        limit(1),
      ),
    ),
    getDocs(
      query(
        collection(db, "locations"),
        where("location_id", "==", specimen.location_id),
        limit(1),
      ),
    ),
  ]);

  const species = speciesSnapshot.docs.at(0)?.data() as SpeciesDoc | undefined;
  const collector = collectorSnapshot.docs.at(0)?.data() as CollectorDoc | undefined;
  const location = locationSnapshot.docs.at(0)?.data() as LocationDoc | undefined;

  return mapSpecimenToRow(specimen, species, collector, location);
}

function normalizeSpecimenDocForSchema(specimen: SpecimenDoc): unknown {
  const normalizedDate =
    specimen.date_collected &&
    typeof specimen.date_collected === "object" &&
    "toDate" in specimen.date_collected
      ? (specimen.date_collected as { toDate: () => Date }).toDate()
      : specimen.date_collected;

  return {
    ...specimen,
    date_collected: normalizedDate,
  };
}

export async function getSpecimenByAccession(
  accessionNo: string,
): Promise<Specimen | null> {
  const normalizedAccessionNo = accessionNo.trim();
  if (!normalizedAccessionNo) {
    return null;
  }

  const specimenSnapshot = await getDocs(
    query(
      collection(db, "specimens"),
      where("accesssion_no", "==", normalizedAccessionNo),
      limit(1),
    ),
  );

  const specimenDoc = specimenSnapshot.docs.at(0);
  if (!specimenDoc) {
    return null;
  }

  const rawSpecimen = specimenDoc.data() as SpecimenDoc;
  const parsedSpecimen = SpecimenSchema.safeParse(
    normalizeSpecimenDocForSchema(rawSpecimen),
  );

  if (!parsedSpecimen.success) {
    throw new Error("Specimen record does not match SpecimenSchema.");
  }

  return parsedSpecimen.data;
}

export async function getSpeciesBySpeciesId(
  speciesId: number,
): Promise<Species | null> {
  const speciesSnapshot = await getDocs(
    query(
      collection(db, "species"),
      where("species_id", "==", speciesId),
      limit(1),
    ),
  );

  const speciesDoc = speciesSnapshot.docs.at(0);
  if (!speciesDoc) {
    return null;
  }

  return speciesDoc.data() as Species;
}

export async function getCollectorByCollectorId(
  collectorId: number,
): Promise<Collector | null> {
  const collectorSnapshot = await getDocs(
    query(
      collection(db, "collectors"),
      where("collector_id", "==", collectorId),
      limit(1),
    ),
  );

  const collectorDoc = collectorSnapshot.docs.at(0);
  if (!collectorDoc) {
    return null;
  }

  return collectorDoc.data() as Collector;
}

export async function getLocationByLocationId(
  locationId: number,
): Promise<Location | null> {
  const locationSnapshot = await getDocs(
    query(
      collection(db, "locations"),
      where("location_id", "==", locationId),
      limit(1),
    ),
  );

  const locationDoc = locationSnapshot.docs.at(0);
  if (!locationDoc) {
    return null;
  }

  return locationDoc.data() as Location;
}