// src/api/seed.ts
import { doc, setDoc } from "firebase/firestore";
import { db } from "./database";

export async function seedFirestore() {
  await setDoc(doc(db, "species", "1"), {
    species_id: 1,
    family: "Fabaceae",
    scientific_name: "Acacia mangium",
  });

  await setDoc(doc(db, "collectors", "1"), {
    collector_id: 1,
    name: "John Doe",
  });

  await setDoc(doc(db, "locations", "1"), {
    location_id: 1,
    locality: "Sample Locality",
    province: "Sample Province",
    region: "Sample Region",
  });

  await setDoc(doc(db, "specimens", "1"), {
    specimen_id: 1,
    accesssion_no: "ACC-001",
    species_id: 1,
    collector_id: 1,
    location_id: 1,
    date_collected: new Date(),
    habitat: "forest edge",
    habit: "tree",
    altitude_masl: 120,
    plant_height_m: 5.2,
    dbh_cm: 10.4,
    conservation_status: "LC",
    nativity: "Native",
    notes: "Seeded record",
  });
}