import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
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
  country?: string;
  locality: string;
};

type SpecimenDoc = {
  specimen_id: number;
  accesssion_no?: string;
  photo_url?: string;
  species_id: number;
  collector_ids: number[];
  location_id: number;
  date_collected?: unknown;
};

type SaveSpecimenInput = {
  species: Omit<Species, "species_id">;
  location: Omit<Location, "location_id">;
  collectors: Array<Omit<Collector, "collector_id">>;
  specimen: Omit<Specimen, "specimen_id" | "species_id" | "collector_ids" | "location_id">;
};

function mapSpecimenToRow(
  specimen: SpecimenDoc,
  species?: SpeciesDoc,
  collectors: CollectorDoc[] = [],
  location?: LocationDoc,
): CollectionRow {
  return {
    specimenId: specimen.specimen_id,
    accessionNo: specimen.accesssion_no ?? "-",
    photoUrl: specimen.photo_url,
    taxon: species?.scientific_name ?? "Unknown species",
    family: species?.family ?? "Unknown family",
    collector:
      collectors.length > 0
        ? collectors.map((collector) => collector.name).join(", ")
        : "Unknown collector",
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

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function numberOrNull(value?: number): number | null {
  return typeof value === "number" ? value : null;
}

async function getNextNumericIds(
  collectionName: "species" | "locations" | "collectors" | "specimens",
  fieldName: "species_id" | "location_id" | "collector_id" | "specimen_id",
  count: number,
): Promise<number[]> {
  if (count <= 0) {
    return [];
  }

  const snapshot = await getDocs(collection(db, collectionName));

  const maxId = snapshot.docs.reduce((currentMax, snapshotDoc) => {
    const value = snapshotDoc.data()?.[fieldName];
    if (typeof value === "number" && value > currentMax) {
      return value;
    }
    return currentMax;
  }, 0);

  return Array.from({ length: count }, (_, index) => maxId + index + 1);
}

async function findExistingSpeciesId(
  species: Omit<Species, "species_id">,
): Promise<number | null> {
  const speciesSnapshot = await getDocs(
    query(
      collection(db, "species"),
      where("scientific_name", "==", normalizeText(species.scientific_name)),
    ),
  );

  const existingSpecies = speciesSnapshot.docs
    .map((snapshotDoc) => snapshotDoc.data() as Species)
    .find((entry) =>
      normalizeText(entry.family) === normalizeText(species.family) &&
      normalizeText(entry.scientific_name) === normalizeText(species.scientific_name) &&
      entry.conservation_status === species.conservation_status &&
      entry.nativity === species.nativity,
    );

  if (existingSpecies) {
    return existingSpecies.species_id;
  }

    return null;
}

  async function findExistingLocationId(
    location: Omit<Location, "location_id">,
  ): Promise<number | null> {
  const locationSnapshot = await getDocs(
    query(
      collection(db, "locations"),
      where("locality", "==", normalizeText(location.locality)),
    ),
  );

  const existingLocation = locationSnapshot.docs
    .map((snapshotDoc) => snapshotDoc.data() as Location)
    .find((entry) =>
      normalizeText(entry.country ?? "Philippines") === normalizeText(location.country) &&
      normalizeText(entry.province) === normalizeText(location.province) &&
      normalizeText(entry.region) === normalizeText(location.region) &&
      numberOrNull(entry.latitude) === numberOrNull(location.latitude) &&
      numberOrNull(entry.longitude) === numberOrNull(location.longitude),
    );

  if (existingLocation) {
    return existingLocation.location_id;
  }

    return null;
}

  async function findExistingCollectorId(name: string): Promise<number | null> {
  const normalizedName = normalizeText(name);

  const collectorSnapshot = await getDocs(
    query(collection(db, "collectors"), where("name", "==", normalizedName), limit(1)),
  );

  const existingCollector = collectorSnapshot.docs.at(0)?.data() as Collector | undefined;
  if (existingCollector) {
    return existingCollector.collector_id;
  }

  return null;
}

export async function saveSpecimenEntry(input: SaveSpecimenInput): Promise<number> {
  const normalizedAccessionNo = normalizeText(input.specimen.accesssion_no);

  const existingSpecimenSnapshot = await getDocs(
    query(
      collection(db, "specimens"),
      where("accesssion_no", "==", normalizedAccessionNo),
      limit(1),
    ),
  );

  if (!existingSpecimenSnapshot.empty) {
    throw new Error("A specimen with this accession number already exists.");
  }

  const speciesIdResult = await findExistingSpeciesId(input.species);
  const locationIdResult = await findExistingLocationId(input.location);

  let speciesId = speciesIdResult;
  if (speciesId === null) {
    const [nextSpeciesId] = await getNextNumericIds("species", "species_id", 1);
    speciesId = nextSpeciesId;
  }

  let locationId = locationIdResult;
  if (locationId === null) {
    const [nextLocationId] = await getNextNumericIds("locations", "location_id", 1);
    locationId = nextLocationId;
  }

  const normalizedCollectorNames = Array.from(
    new Set(input.collectors.map((collector) => normalizeText(collector.name)).filter(Boolean)),
  );

  if (normalizedCollectorNames.length === 0) {
    throw new Error("At least one collector is required.");
  }

  const collectorIdByName = new Map<string, number>();
  const collectorNamesToCreate: string[] = [];
  for (const collectorName of normalizedCollectorNames) {
    const existingCollectorId = await findExistingCollectorId(collectorName);
    if (existingCollectorId !== null) {
      collectorIdByName.set(collectorName, existingCollectorId);
      continue;
    }

    collectorNamesToCreate.push(collectorName);
  }

  if (collectorNamesToCreate.length > 0) {
    const nextCollectorIds = await getNextNumericIds(
      "collectors",
      "collector_id",
      collectorNamesToCreate.length,
    );

    collectorNamesToCreate.forEach((collectorName, index) => {
      collectorIdByName.set(collectorName, nextCollectorIds[index]);
    });
  }

  const collectorIds = normalizedCollectorNames.map((collectorName) => {
    const collectorId = collectorIdByName.get(collectorName);
    if (typeof collectorId !== "number") {
      throw new Error("Failed to resolve collector IDs.");
    }
    return collectorId;
  });

  const [specimenId] = await getNextNumericIds("specimens", "specimen_id", 1);
  const batch = writeBatch(db);

  if (speciesIdResult === null) {
    batch.set(doc(db, "species", String(speciesId)), {
      species_id: speciesId,
      family: normalizeText(input.species.family),
      scientific_name: normalizeText(input.species.scientific_name),
      common_name: input.species.common_name
        ? normalizeText(input.species.common_name)
        : undefined,
      conservation_status: input.species.conservation_status,
      nativity: input.species.nativity,
    });
  }

  if (locationIdResult === null) {
    batch.set(doc(db, "locations", String(locationId)), {
      location_id: locationId,
      country: input.location.country,
      locality: normalizeText(input.location.locality),
      province: normalizeText(input.location.province),
      region: normalizeText(input.location.region),
      latitude: input.location.latitude,
      longitude: input.location.longitude,
    });
  }

  collectorNamesToCreate.forEach((collectorName) => {
    const collectorId = collectorIdByName.get(collectorName);
    if (typeof collectorId !== "number") {
      return;
    }

    batch.set(doc(db, "collectors", String(collectorId)), {
      collector_id: collectorId,
      name: collectorName,
    });
  });

  batch.set(doc(db, "specimens", String(specimenId)), {
    specimen_id: specimenId,
    accesssion_no: normalizedAccessionNo,
    species_id: speciesId,
    collector_ids: collectorIds,
    location_id: locationId,
    date_collected: input.specimen.date_collected,
    habitat: normalizeText(input.specimen.habitat),
    habit: input.specimen.habit,
    altitude_masl: input.specimen.altitude_masl,
    plant_height_m: input.specimen.plant_height_m,
    dbh_cm: input.specimen.dbh_cm,
    flower_description: input.specimen.flower_description,
    fruit_description: input.specimen.fruit_description,
    leaf_description: input.specimen.leaf_description,
    notes: input.specimen.notes,
  });

  await batch.commit();

  collectionRowsCache = null;
  collectionRowsCacheTimestamp = 0;

  return specimenId;
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
      const collectors = (specimen.collector_ids ?? [])
        .map((collectorId) => collectorsById.get(collectorId))
        .filter((collector): collector is CollectorDoc => Boolean(collector));
      const location = locationsById.get(specimen.location_id);

      return mapSpecimenToRow(specimen, species, collectors, location);
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

  const [speciesSnapshot, locationSnapshot, collectors] = await Promise.all([
    getDocs(
      query(
        collection(db, "species"),
        where("species_id", "==", specimen.species_id),
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
    getCollectorsByCollectorIds(specimen.collector_ids ?? []),
  ]);

  const species = speciesSnapshot.docs.at(0)?.data() as SpeciesDoc | undefined;
  const location = locationSnapshot.docs.at(0)?.data() as LocationDoc | undefined;

  return mapSpecimenToRow(specimen, species, collectors, location);
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

export async function getSpeciesFamilies(): Promise<string[]> {
  const speciesSnapshot = await getDocs(collection(db, "species"));

  const familySet = new Set<string>();

  speciesSnapshot.docs.forEach((speciesDoc) => {
    const family = speciesDoc.data()?.family;
    if (typeof family !== "string") {
      return;
    }

    const normalizedFamily = normalizeText(family);
    if (normalizedFamily) {
      familySet.add(normalizedFamily);
    }
  });

  return Array.from(familySet).sort((a, b) => a.localeCompare(b));
}

export async function getCollectorNames(): Promise<string[]> {
  const collectorsSnapshot = await getDocs(collection(db, "collectors"));

  const collectorNameSet = new Set<string>();

  collectorsSnapshot.docs.forEach((collectorDoc) => {
    const collectorName = collectorDoc.data()?.name;
    if (typeof collectorName !== "string") {
      return;
    }

    const normalizedCollectorName = normalizeText(collectorName);
    if (normalizedCollectorName) {
      collectorNameSet.add(normalizedCollectorName);
    }
  });

  return Array.from(collectorNameSet).sort((a, b) => a.localeCompare(b));
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

export async function getCollectorsByCollectorIds(
  collectorIds: number[],
): Promise<Collector[]> {
  if (collectorIds.length === 0) {
    return [];
  }

  const uniqueCollectorIds = Array.from(new Set(collectorIds));

  const chunks: number[][] = [];
  for (let index = 0; index < uniqueCollectorIds.length; index += 10) {
    chunks.push(uniqueCollectorIds.slice(index, index + 10));
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) =>
      getDocs(
        query(
          collection(db, "collectors"),
          where("collector_id", "in", chunk),
        ),
      ),
    ),
  );

  const collectors = snapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => doc.data() as Collector),
  );

  const collectorsById = new Map(
    collectors.map((collector) => [collector.collector_id, collector]),
  );

  return uniqueCollectorIds
    .map((collectorId) => collectorsById.get(collectorId))
    .filter((collector): collector is Collector => Boolean(collector));
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