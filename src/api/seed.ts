// src/api/seed.ts
import { doc, setDoc } from "firebase/firestore";
import { db } from "./database";

export async function seedFirestore() {

  // SPECIES
  await Promise.all([
    setDoc(doc(db, "species", "1"), {
      species_id: 1,
      family: "Acanthaceae",
      scientific_name: "Andrographis paniculata",
      common_name: "Green chiretta / Serpentina"
    }),

    setDoc(doc(db, "species", "2"), {
      species_id: 2,
      family: "Lamiaceae",
      scientific_name: "Vitex arvensis",
      common_name: "Chaste Tree"
    }),

    setDoc(doc(db, "species", "3"), {
      species_id: 3,
      family: "Menispermaceae",
      scientific_name: "Tinospora rumphii",
      common_name: "Makabuhay"
    })
  ]);


  // COLLECTORS
  await Promise.all([
    setDoc(doc(db, "collectors", "1"), {
      collector_id: 1,
      name: "M. B. V. Castañeda"
    }),

    setDoc(doc(db, "collectors", "2"), {
      collector_id: 2,
      name: "J.A.M Inao"
    }),

    setDoc(doc(db, "collectors", "3"), {
      collector_id: 3,
      name: "S. S. A. Monte"
    })
  ]);


  // LOCATIONS
  await Promise.all([
    setDoc(doc(db, "locations", "1"), {
      location_id: 1,
      country: "Philippines",
      locality: "Diamond St., Pandayan, Meycauayan",
      province: "Bulacan",
      region: "Region III",
      latitude: null,
      longitude: null
    }),

    setDoc(doc(db, "locations", "2"), {
      location_id: 2,
      country: "Philippines",
      locality: "Orientville 1, Bacoor",
      province: "Cavite",
      region: "Region IV-A",
      latitude: 14.4193,
      longitude: 120.9767
    }),

    setDoc(doc(db, "locations", "3"), {
      location_id: 3,
      country: "Philippines",
      locality: "Karuhatan, Valenzuela",
      province: "Metro Manila",
      region: "NCR",
      latitude: null,
      longitude: null
    })
  ]);


  // SPECIMENS
  await Promise.all([
    setDoc(doc(db, "specimens", "1"), {
      specimen_id: 1,
      accesssion_no: "PLM-0001",

      species_id: 1,
      collector_ids: [1],
      location_id: 1,

      date_collected: new Date("2025-08-16"),

      habitat: "Household garden",
      habit: "herb",

      altitude_masl: 13,
      plant_height_m: 0.48,
      dbh_cm: null,

      flower_description:
        "White with purple streaks on petal, tubular with fuzzy tube ending",

      fruit_description:
        "Capsule type, elongated oval, green when young, brown when dry",

      leaf_description:
        "Simple opposite lanceolate leaves with pennate venation, entire margin, glabrous surface up to 6x2 cm",

      conservation_status: "LC",
      nativity: "Introduced",

      notes: ""
    }),

    setDoc(doc(db, "specimens", "2"), {
      specimen_id: 2,
      accesssion_no: "PLM-0002",

      species_id: 2,
      collector_ids: [2],
      location_id: 2,

      date_collected: new Date("2024-09-12"),

      habitat:
        "Farmlands, secondary forests, along rivers, trails, ridges, open areas, wastelands",

      habit: "shrub",

      altitude_masl: 500,
      plant_height_m: 4,
      dbh_cm: null,

      flower_description:
        "Violet flowers borne in lax paniculate inflorescences",

      fruit_description:
        "Brown, glabrous, ellipsoid to ovoid",

      leaf_description:
        "Elliptic to lanceolate",

      conservation_status: "LC",
      nativity: "Native",

      notes: ""
    }),

    setDoc(doc(db, "specimens", "3"), {
      specimen_id: 3,
      accesssion_no: "PLM-0003",

      species_id: 3,
      collector_ids: [3],
      location_id: 3,

      date_collected: new Date("2025-08-12"),

      habitat: "Forests, open areas",

      habit: "vine",

      altitude_masl: 10,
      plant_height_m: 0.36,
      dbh_cm: 2,

      flower_description: "",
      fruit_description: "",
      leaf_description:
        "Cordate leaf shape, reticulate vein, alternate",

      conservation_status: "LC",
      nativity: "Native",

      notes: ""
    })
  ]);
}