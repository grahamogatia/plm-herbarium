import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/api/database";

export type AccessionPattern = string; // e.g. "PLMH-#-##-###"

// All specimen form fields that can be toggled as required
export const ALL_FORM_FIELDS = [
  "accesssion_no",
  "scientific_name",
  "common_name",
  "family",
  "conservation_status",
  "nativity",
  "country",
  "locality",
  "province",
  "region",
  "latitude",
  "longitude",
  "collector_names",
  "date_collected",
  "habitat",
  "habit",
  "altitude_masl",
  "plant_height_m",
  "dbh_cm",
  "flower_description",
  "fruit_description",
  "leaf_description",
  "notes",
] as const;

export type FormFieldKey = (typeof ALL_FORM_FIELDS)[number];

export const FORM_FIELD_LABELS: Record<FormFieldKey, string> = {
  accesssion_no: "Accession No.",
  scientific_name: "Scientific Name",
  common_name: "Common Name",
  family: "Family",
  conservation_status: "Conservation Status",
  nativity: "Nativity",
  country: "Country",
  locality: "Locality",
  province: "Province",
  region: "Region",
  latitude: "Latitude",
  longitude: "Longitude",
  collector_names: "Collector(s)",
  date_collected: "Date Collected",
  habitat: "Habitat",
  habit: "Habit",
  altitude_masl: "Altitude (masl)",
  plant_height_m: "Plant Height (m)",
  dbh_cm: "DBH (cm)",
  flower_description: "Flower Description",
  fruit_description: "Fruit Description",
  leaf_description: "Leaf Description",
  notes: "Notes",
};

// Table columns the admin can toggle
export const ALL_TABLE_ATTRIBUTES = [
  "image",
  "accessionNo",
  "taxon",
  "family",
  "collector",
  "date",
  "locality",
] as const;

export type TableAttribute = (typeof ALL_TABLE_ATTRIBUTES)[number];

export const TABLE_ATTRIBUTE_LABELS: Record<TableAttribute, string> = {
  image: "Image",
  accessionNo: "Accession No.",
  taxon: "Taxon",
  family: "Family",
  collector: "Collector",
  date: "Date",
  locality: "Locality",
};

// Summary fields the admin can toggle
export const ALL_SUMMARY_FIELDS = [
  // Summary tab
  "filed_as",
  "collectors",
  "date_collected",
  "locality",
  "accession_no",
  "common_name",
  "conservation_status",
  "nativity",
  "habitat",
  "habit",
  "notes",
  // Taxon tab
  "family",
  "genus",
  "species",
  // Locality tab
  "country",
  "region",
  "province",
  "city",
  "altitude",
  "coordinates",
  // Details tab
  "plant_height",
  "dbh",
  "flower_description",
  "fruit_description",
  "leaf_description",
] as const;

export type SummaryField = (typeof ALL_SUMMARY_FIELDS)[number];

export const SUMMARY_FIELD_LABELS: Record<SummaryField, string> = {
  filed_as: "Filed As",
  collectors: "Collector(s)",
  date_collected: "Date Collected",
  locality: "Locality",
  accession_no: "Accession No.",
  common_name: "Common Name",
  conservation_status: "Conservation Status",
  nativity: "Nativity",
  habitat: "Habitat",
  habit: "Habit",
  notes: "Notes",
  family: "Family",
  genus: "Genus",
  species: "Species",
  country: "Country",
  region: "Region",
  province: "Province",
  city: "City / Municipality",
  altitude: "Altitude (masl)",
  coordinates: "Coordinates",
  plant_height: "Plant Height (m)",
  dbh: "DBH (cm)",
  flower_description: "Flower Description",
  fruit_description: "Fruit Description",
  leaf_description: "Leaf Description",
};

export const SUMMARY_FIELD_TABS: Record<SummaryField, string> = {
  filed_as: "Summary",
  collectors: "Summary",
  date_collected: "Summary",
  locality: "Summary",
  accession_no: "Summary",
  common_name: "Summary",
  conservation_status: "Summary",
  nativity: "Summary",
  habitat: "Summary",
  habit: "Summary",
  notes: "Summary",
  family: "Taxon",
  genus: "Taxon",
  species: "Taxon",
  country: "Locality",
  region: "Locality",
  province: "Locality",
  city: "Locality",
  altitude: "Locality",
  coordinates: "Locality",
  plant_height: "Details",
  dbh: "Details",
  flower_description: "Details",
  fruit_description: "Details",
  leaf_description: "Details",
};

export type HerbariumConfig = {
  accessionPattern: AccessionPattern;
  requiredFields: FormFieldKey[];
  tableAttributes: TableAttribute[];
  summaryFields: SummaryField[];
  nativityOptions: string[];
};

const CONFIG_DOC_REF = doc(db, "config", "herbarium");

const DEFAULT_CONFIG: HerbariumConfig = {
  accessionPattern: "PLMH-#-##-###",
  requiredFields: [
    "accesssion_no",
    "scientific_name",
    "family",
    "collector_names",
    "date_collected",
    "habitat",
    "habit",
  ],
  tableAttributes: [
    "image",
    "accessionNo",
    "taxon",
    "family",
    "collector",
    "date",
    "locality",
  ],
  summaryFields: [
    "filed_as",
    "collectors",
    "date_collected",
    "locality",
    "accession_no",
    "family",
    "genus",
    "species",
    "country",
    "region",
    "province",
    "city",
    "altitude",
    "coordinates",
  ],
  nativityOptions: ["Native", "Introduced", "Endemic"],
};

export async function getHerbariumConfig(): Promise<HerbariumConfig> {
  const snapshot = await getDoc(CONFIG_DOC_REF);

  if (!snapshot.exists()) {
    return DEFAULT_CONFIG;
  }

  const data = snapshot.data();
  return {
    accessionPattern:
      typeof data.accessionPattern === "string"
        ? data.accessionPattern
        : DEFAULT_CONFIG.accessionPattern,
    requiredFields: Array.isArray(data.requiredFields)
      ? data.requiredFields
      : DEFAULT_CONFIG.requiredFields,
    tableAttributes: Array.isArray(data.tableAttributes)
      ? data.tableAttributes
      : DEFAULT_CONFIG.tableAttributes,
    summaryFields: Array.isArray(data.summaryFields)
      ? data.summaryFields
      : DEFAULT_CONFIG.summaryFields,
    nativityOptions: Array.isArray(data.nativityOptions)
      ? data.nativityOptions
      : DEFAULT_CONFIG.nativityOptions,
  };
}

export async function saveHerbariumConfig(
  config: HerbariumConfig,
): Promise<void> {
  await setDoc(CONFIG_DOC_REF, config);
}
