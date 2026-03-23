import type { z } from "zod";
import {
  SpecimenSchema,
  SpeciesSchema,
  CollectorSchema,
  LocationSchema,
} from "./schemas";

export type Specimen = z.infer<typeof SpecimenSchema>;
export type Species = z.infer<typeof SpeciesSchema>;
export type Collector = z.infer<typeof CollectorSchema>;
export type Location = z.infer<typeof LocationSchema>;
