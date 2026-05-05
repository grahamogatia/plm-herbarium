import { z } from "zod";

export const SpecimenSchema = z.object({
  specimen_id: z.number(),
  accesssion_no: z.string(),

  species_id: z.number(), //FK
  collector_ids: z.array(z.number()).min(1), //FK
  location_id: z.number(), //FK

  date_collected: z.date().optional(),
  habitat: z.string(),
  habit: z.string().min(1, "Habit is required."),

  altitude_masl: z.string().optional(),
  plant_height_m: z.string().optional(),
  dbh_cm: z.string().optional().nullable(),

  phenophase: z.string().optional(),

  flower_description: z.string().optional(),
  fruit_description: z.string().optional(),
  leaf_description: z.string().optional(),

  notes: z.string(),

  photo_url: z.string().optional(),
});

export const SpeciesSchema = z.object({
  species_id: z.number(),
  family: z.string(),
  scientific_name: z.string(),
  common_name: z.string().optional(),
  conservation_status: z.enum(["EX", "EW", "CE", "EN", "VU", "NT", "LC"]).optional(),
  nativity: z.enum(["Native", "Introduced", "Endemic"]).optional(),
});

export const CollectorSchema = z.object({
  collector_id: z.number(),
  name: z.string(),
});

export const LocationSchema = z.object({
  location_id: z.number(),
  country: z.literal("Philippines"),
  locality: z.string(),
  province: z.string(),
  region: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});
