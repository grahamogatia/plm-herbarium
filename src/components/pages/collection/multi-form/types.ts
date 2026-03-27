import type { Collector, Location, Species, Specimen } from "@/data/types";

export type FormValues = {
  accesssion_no: Specimen["accesssion_no"];
  scientific_name: Species["scientific_name"];
  common_name: NonNullable<Species["common_name"]> | "";
  family: Species["family"];
  conservation_status: Species["conservation_status"] | "";
  nativity: Species["nativity"] | "";
  locality: Location["locality"];
  province: Location["province"];
  region: Location["region"];
  latitude: string;
  longitude: string;
  collector_name: Collector["name"];
  date_collected: string;
  habitat: Specimen["habitat"];
  habit: Specimen["habit"] | "";
  altitude_masl: string;
  plant_height_m: string;
  dbh_cm: string;
  flower_description: NonNullable<Specimen["flower_description"]> | "";
  fruit_description: NonNullable<Specimen["fruit_description"]> | "";
  leaf_description: NonNullable<Specimen["leaf_description"]> | "";
  notes: Specimen["notes"];
};

export type FormErrors = Partial<Record<keyof FormValues, string>>;
