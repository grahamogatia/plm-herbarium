import { collection, getDocs } from "firebase/firestore";
import { db } from "@/api/database";

type SpecimenDoc = {
  specimen_id: number;
  species_id: number;
  collector_ids: number[];
  location_id: number;
  date_collected?: unknown;
  habit?: string;
  isDeleted?: boolean;
};

type SpeciesDoc = {
  species_id: number;
  family: string;
  scientific_name: string;
  conservation_status?: string;
  nativity?: string;
};

type CollectorDoc = {
  collector_id: number;
  name: string;
};

type LocationDoc = {
  location_id: number;
  region?: string;
  province?: string;
};

export type CountEntry = { name: string; count: number };

export type CollectionStats = {
  totalSpecimens: number;
  familyDistribution: CountEntry[];
  conservationStatus: CountEntry[];
  nativity: CountEntry[];
  habitDistribution: CountEntry[];
  specimensOverTime: { month: string; count: number }[];
  specimensByRegion: CountEntry[];
  specimensByProvince: CountEntry[];
  collectorActivity: CountEntry[];
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const d = (value as { toDate: () => Date }).toDate();
    return d instanceof Date ? d : null;
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export async function getCollectionStats(): Promise<CollectionStats> {
  const [specimensSnap, speciesSnap, collectorsSnap, locationsSnap] =
    await Promise.all([
      getDocs(collection(db, "specimens")),
      getDocs(collection(db, "species")),
      getDocs(collection(db, "collectors")),
      getDocs(collection(db, "locations")),
    ]);

  const speciesById = new Map<number, SpeciesDoc>(
    speciesSnap.docs.map((d) => {
      const data = d.data() as SpeciesDoc;
      return [data.species_id, data];
    }),
  );

  const collectorsById = new Map<number, CollectorDoc>(
    collectorsSnap.docs.map((d) => {
      const data = d.data() as CollectorDoc;
      return [data.collector_id, data];
    }),
  );

  const locationsById = new Map<number, LocationDoc>(
    locationsSnap.docs.map((d) => {
      const data = d.data() as LocationDoc;
      return [data.location_id, data];
    }),
  );

  const activeSpecimens = specimensSnap.docs
    .map((d) => d.data() as SpecimenDoc)
    .filter((s) => !s.isDeleted);

  const familyMap = new Map<string, number>();
  const conservationMap = new Map<string, number>();
  const nativityMap = new Map<string, number>();
  const habitMap = new Map<string, number>();
  const monthMap = new Map<string, number>();
  const regionMap = new Map<string, number>();
  const provinceMap = new Map<string, number>();
  const collectorMap = new Map<string, number>();

  for (const specimen of activeSpecimens) {
    const species = speciesById.get(specimen.species_id);

    // Family
    const family = species?.family ?? "Unknown";
    familyMap.set(family, (familyMap.get(family) ?? 0) + 1);

    // Conservation status
    const status = species?.conservation_status || "Unknown";
    conservationMap.set(status, (conservationMap.get(status) ?? 0) + 1);

    // Nativity
    const nat = species?.nativity || "Unknown";
    nativityMap.set(nat, (nativityMap.get(nat) ?? 0) + 1);

    // Habit
    const habit = (specimen as { habit?: string }).habit || "Unknown";
    habitMap.set(habit, (habitMap.get(habit) ?? 0) + 1);

    // Date (yearly)
    const date = toDate(specimen.date_collected);
    if (date) {
      const key = String(date.getFullYear());
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }

    // Region
    const location = locationsById.get(specimen.location_id);
    const region = location?.region || "Unknown";
    regionMap.set(region, (regionMap.get(region) ?? 0) + 1);

    // Province
    const province = location?.province;
    if (province) {
      provinceMap.set(province, (provinceMap.get(province) ?? 0) + 1);
    }

    // Collectors
    for (const cid of specimen.collector_ids ?? []) {
      const collector = collectorsById.get(cid);
      const name = collector?.name ?? "Unknown";
      collectorMap.set(name, (collectorMap.get(name) ?? 0) + 1);
    }
  }

  const toSorted = (m: Map<string, number>): CountEntry[] =>
    Array.from(m, ([name, count]) => ({ name, count })).sort(
      (a, b) => b.count - a.count,
    );

  const specimensOverTime = Array.from(monthMap, ([month, count]) => ({
    month,
    count,
  })).sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalSpecimens: activeSpecimens.length,
    familyDistribution: toSorted(familyMap),
    conservationStatus: toSorted(conservationMap),
    nativity: toSorted(nativityMap),
    habitDistribution: toSorted(habitMap),
    specimensOverTime,
    specimensByRegion: toSorted(regionMap),
    specimensByProvince: toSorted(provinceMap),
    collectorActivity: toSorted(collectorMap),
  };
}
