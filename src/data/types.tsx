import type z from "zod";
import type { SpecimenSchema } from "./schemas";

export type Specimen = z.infer<typeof SpecimenSchema>;
