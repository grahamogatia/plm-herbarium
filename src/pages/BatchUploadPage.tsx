import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, CloudUpload, FileSpreadsheet, Pencil, Save, X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";
import { saveSpecimenEntry } from "@/api/collection";
import { SpeciesSchema, LocationSchema } from "@/data/schemas";
import { getHerbariumConfig } from "@/api/config";
import { useAuth } from "@/context/AuthContext";



const PAGE_SIZE = 10;

const ITALIC_COLUMNS = new Set(["Scientific Name", "Family"]);

// Groups used in the specimen detail sheet
const FIELD_GROUPS: { label: string; fields: string[] }[] = [
  {
    label: "Taxonomy",
    fields: ["Scientific Name", "Common Name", "Family", "Conservation Status", "Nativity"],
  },
  {
    label: "Location",
    fields: ["Country", "Region", "Province", "Locality", "Latitude", "Longitude"],
  },
  {
    label: "Collection",
    fields: ["Accession Number", "Collectors", "Date Collected (MM/DD/YYYY)"],
  },
  {
    label: "Specimen Details",
    fields: ["Habit", "Habitat", "Altitude (MASL)", "Plant Height (M)", "DBH (CM)", "Phenophase"],
  },
  {
    label: "Descriptions",
    fields: ["Flower Description", "Fruit Description", "Leaf Description", "Notes"],
  },
];

type ParsedCSV = {
  headers: string[];
  rows: string[][];
  totalRows: number;
};

function detectDelimiter(line: string): string {
  const tabCount = (line.match(/\t/g) ?? []).length;
  const commaCount = (line.match(/,/g) ?? []).length;
  return tabCount >= commaCount ? "\t" : ",";
}

function parseCSV(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        row.push(field.trim());
        field = "";
      } else if (char === "\r" && text[i + 1] === "\n") {
        row.push(field.trim());
        field = "";
        rows.push(row);
        row = [];
        i += 2;
        continue;
      } else if (char === "\n") {
        row.push(field.trim());
        field = "";
        rows.push(row);
        row = [];
      } else {
        field += char;
      }
    }
    i++;
  }

  if (field || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }

  return rows;
}

function parseFile(file: File): Promise<ParsedCSV | { message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== "string") {
        resolve({ message: "Could not read file." });
        return;
      }

      const firstLine = text.split(/\r?\n/)[0] ?? "";
      const delimiter = detectDelimiter(firstLine);
      const allRows = parseCSV(text, delimiter);

      if (allRows.length < 2) {
        resolve({ message: "The file is empty or has no data rows." });
        return;
      }

      const headers = allRows[0];
      const dataRows = allRows.slice(1).filter((r) => r.some((cell) => cell !== ""));
      resolve({ headers, rows: dataRows, totalRows: dataRows.length });
    };
    reader.onerror = () => resolve({ message: "Failed to read file." });
    reader.readAsText(file);
  });
}

// ── CSV → SaveSpecimenInput mapping & validation ─────────────────────────────

const CONSERVATION_OPTIONS = SpeciesSchema.shape.conservation_status.unwrap().options;

// ── Normalization helpers ─────────────────────────────────────────────────────

/** Title-case a plain text value (e.g. "NORTHERN LUZON" → "Northern Luzon") */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Normalise a single collector name to "A. B. Lastname" format.
 *   "Antonio B. Santos"  → "A. B. Santos"
 *   "a. santos"          → "A. Santos"
 *   "A. Santos"          → "A. Santos"  (already correct)
 */
function normalizeCollectorName(raw: string): string {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return raw;

  const surname = parts[parts.length - 1];
  const givenParts = parts.slice(0, -1);

  const initials = givenParts.map((p) =>
    /^[A-Za-z]\.$/.test(p) ? p.toUpperCase() : p.charAt(0).toUpperCase() + ".",
  );

  // Capitalise surname: first letter up, rest down (handles all-caps input)
  const normalizedSurname =
    surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();

  return [...initials, normalizedSurname].join(" ");
}

/**
 * Parse a date string in MM/DD/YYYY format (primary).
 * Also accepts YYYY-MM-DD (ISO / Excel export) and MM-DD-YYYY variants.
 * Returns null if unparseable or not a valid calendar date.
 */
function parseCollectionDate(raw: string): Date | null {
  const s = raw.trim();

  // MM/DD/YYYY  |  MM-DD-YYYY  |  MM.DD.YYYY
  const mdyMatch = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch.map(Number);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d)
      return date;
  }

  // YYYY-MM-DD  (ISO / Excel default export)
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch.map(Number);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d)
      return date;
  }

  return null;
}

type RowValidationResult =
  | { ok: true; input: Parameters<typeof saveSpecimenEntry>[0] }
  | { ok: false; errors: string[] };

/**
 * Normalise a raw CSV row in-place by column header so the preview table
 * and later validation both see clean values.
 */
function normalizeRow(headers: string[], row: string[]): string[] {
  return headers.map((header, i) => {
    let val = (row[i] ?? "").trim();
    // Treat a lone dash as empty
    if (val === "-") val = "";

    switch (header) {
      case "Scientific Name":
        // Keep as-is (botanical naming conventions)
        return val;

      case "Flower Description":
      case "Fruit Description":
      case "Leaf Description":
      case "Notes":
        return toTitleCase(val);

      case "Conservation Status":
        return val ? val.toUpperCase() : "N/A";

      case "Nativity":
        return val || "Not Indicated";

      case "Collectors": {
        if (!val) return val;
        return val
          .split(",")
          .map((s) => normalizeCollectorName(s.trim()))
          .filter(Boolean)
          .join(", ");
      }

      default:
        return val;
    }
  });
}

function csvRowToInput(
  headers: string[],
  row: string[],
  nativityOptions: string[],
  requiredFields: string[] = [],
): RowValidationResult {
  const isRequired = (field: string) => requiredFields.includes(field);
  const get = (col: string) => {
    const i = headers.indexOf(col);
    const raw = i >= 0 ? (row[i] ?? "").trim() : "";
    return raw === "-" ? "" : raw;
  };

  const errors: string[] = [];

  // ── Species fields ───────────────────────────────────────────────────────
  // Values are already normalized by normalizeRow() at parse time
  const scientific_name = get("Scientific Name");
  const family = get("Family");
  const common_name = get("Common Name") || undefined;
  const raw_conservation = get("Conservation Status");
  // "N/A" is the display default for empty — treat it as absent for DB storage
  const conservation_for_validation = (raw_conservation && raw_conservation !== "N/A") ? raw_conservation : undefined;
  const raw_nativity = get("Nativity") || "Not Indicated";

  if (isRequired("scientific_name") && !scientific_name) errors.push("Scientific Name is required.");
  if (isRequired("family") && !family) errors.push("Family is required.");

  const conservation_status_result = conservation_for_validation
    ? z.enum(CONSERVATION_OPTIONS).safeParse(conservation_for_validation)
    : { success: true as const, data: undefined };
  if (!conservation_status_result.success)
    errors.push(
      `Conservation Status "${conservation_for_validation}" is not valid. Must be one of: ${CONSERVATION_OPTIONS.join(", ")}, or leave blank for N/A.`,
    );

  const effectiveNativityOptions = nativityOptions.includes("Not Indicated")
    ? nativityOptions
    : [...nativityOptions, "Not Indicated"];
  const nativity_result = z.enum(effectiveNativityOptions as [string, ...string[]]).safeParse(raw_nativity);
  if (!nativity_result.success)
    errors.push(
      `Nativity "${raw_nativity}" is not valid. Must be one of: ${effectiveNativityOptions.join(", ")}.`,
    );

  // ── Location fields ──────────────────────────────────────────────────────
  const locality = get("Locality");
  const province = get("Province");
  const region = get("Region");
  const raw_lat = get("Latitude");
  const raw_lng = get("Longitude");

  if (isRequired("locality") && !locality) errors.push("Locality is required.");
  if (isRequired("province") && !province) errors.push("Province is required.");
  if (isRequired("region") && !region) errors.push("Region is required.");

  const latitude = raw_lat ? Number(raw_lat) : undefined;
  const longitude = raw_lng ? Number(raw_lng) : undefined;
  if (raw_lat && isNaN(latitude as number)) errors.push("Latitude must be a number.");
  if (raw_lng && isNaN(longitude as number)) errors.push("Longitude must be a number.");

  const locationResult = LocationSchema.omit({ location_id: true }).safeParse({
    country: "Philippines",
    locality,
    province,
    region,
    latitude,
    longitude,
  });
  if (!locationResult.success) {
    locationResult.error.issues.forEach((e) => errors.push(e.message));
  }

  // ── Collector fields ─────────────────────────────────────────────────────
  // Already normalized to "A. Lastname" format by normalizeRow()
  const raw_collectors = get("Collectors");
  const collector_names = raw_collectors
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (isRequired("collector_names") && collector_names.length === 0) errors.push("At least one Collector is required.");

  // ── Specimen fields ──────────────────────────────────────────────────────
  const accesssion_no = get("Accession Number");
  if (isRequired("accesssion_no") && !accesssion_no) errors.push("Accession Number is required.");

  const raw_date = get("Date Collected (MM/DD/YYYY)");
  let date_collected: Date | undefined;
  if (raw_date) {
    const parsed_date = parseCollectionDate(raw_date);
    if (!parsed_date) {
      errors.push(`Date Collected "${raw_date}" is not a valid date. Use MM/DD/YYYY (e.g. 01/15/2024).`);
    } else {
      date_collected = parsed_date;
    }
  }

  const habit = get("Habit");
  const habitat = get("Habitat");
  if (isRequired("habit") && !habit) errors.push("Habit is required.");
  if (isRequired("habitat") && !habitat) errors.push("Habitat is required.");

  const altitude_masl = get("Altitude (MASL)") || undefined;
  const plant_height_m = get("Plant Height (M)") || undefined;
  const raw_dbh = get("DBH (CM)");
  const dbh_cm = raw_dbh || undefined;
  const phenophase = get("Phenophase") || undefined;

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    input: {
      species: {
        family,
        scientific_name,
        common_name,
        conservation_status: conservation_status_result.success ? conservation_status_result.data : undefined,
        nativity: nativity_result.data! as any,  // Dynamic nativity from config
      },
      location: {
        country: "Philippines",
        locality,
        province,
        region,
        latitude,
        longitude,
      },
      collectors: collector_names.map((name) => ({ name })),
      specimen: {
        accesssion_no,
        date_collected,
        habit,
        habitat,
        altitude_masl,
        plant_height_m,
        dbh_cm,
        phenophase,
        flower_description: get("Flower Description") || undefined,
        fruit_description: get("Fruit Description") || undefined,
        leaf_description: get("Leaf Description") || undefined,
        notes: get("Notes"),
      },
    },
  };
}

type RowError = { rowIndex: number; accession: string; errors: string[] };

// ── Specimen detail sheet ─────────────────────────────────────────────────────

type SpecimenSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsed: ParsedCSV;
  activeIndex: number;
  onNavigate: (index: number) => void;
  onRowUpdate: (rowIndex: number, updatedRow: string[]) => void;
};

function SpecimenSheet({ open, onOpenChange, parsed, activeIndex, onNavigate, onRowUpdate }: SpecimenSheetProps) {
  const row = parsed.rows[activeIndex];
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // Reset edit state when row changes
  useEffect(() => {
    setIsEditing(false);
    setEditValues({});
  }, [activeIndex]);

  if (!row) return null;

  const getValue = (field: string) => {
    const colIndex = parsed.headers.indexOf(field);
    return colIndex >= 0 ? (row[colIndex] ?? "") : "";
  };

  const getEditValue = (field: string) =>
    field in editValues ? editValues[field] : getValue(field);

  const accessionNo = getValue("Accession Number");
  const scientificName = getValue("Scientific Name");

  function startEditing() {
    const initial: Record<string, string> = {};
    for (const header of parsed.headers) {
      initial[header] = getValue(header);
    }
    setEditValues(initial);
    setIsEditing(true);
  }

  function saveEdits() {
    const updatedRow = parsed.headers.map((header) =>
      header in editValues ? editValues[header] : getValue(header),
    );
    onRowUpdate(activeIndex, updatedRow);
    setIsEditing(false);
    setEditValues({});
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="border-b border-zinc-100 pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Specimen {activeIndex + 1} of {parsed.totalRows}
          </p>
          <p className="text-base font-semibold text-zinc-800">
            {accessionNo || "—"}
          </p>
          {scientificName && (
            <p className="text-sm italic text-zinc-500">{scientificName}</p>
          )}
          {/* Prev / Next */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={activeIndex === 0}
              onClick={() => onNavigate(activeIndex - 1)}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={activeIndex === parsed.totalRows - 1}
              onClick={() => onNavigate(activeIndex + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
            <div className="ml-auto">
              {isEditing ? (
                <Button size="sm" onClick={saveEdits} className="gap-1">
                  <Save className="size-3.5" />
                  Save
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={startEditing} className="gap-1">
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 py-4">
          {FIELD_GROUPS.map((group) => {
            const entries = group.fields.map((field) => ({
              field,
              value: getValue(field),
              editValue: getEditValue(field),
            }));
            const hasAnyValue = isEditing || entries.some((e) => e.value !== "");
            if (!hasAnyValue) return null;

            return (
              <div key={group.label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lime-800">
                  {group.label}
                </p>
                <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-100 bg-zinc-50">
                  {entries.map(({ field, value, editValue }) => (
                    <div key={field} className="flex flex-col px-3 py-2">
                      <span className="text-xs font-medium text-zinc-500">{field}</span>
                      {isEditing ? (
                        <input
                          className="mt-1 w-full rounded border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-lime-500"
                          value={editValue}
                          onChange={(e) =>
                            setEditValues((prev) => ({ ...prev, [field]: e.target.value }))
                          }
                        />
                      ) : (
                        <span
                          className={`text-sm text-zinc-800 break-words${
                            ITALIC_COLUMNS.has(field) ? " italic" : ""
                          }`}
                        >
                          {value || <span className="text-zinc-300">—</span>}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function BatchUploadPage() {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ done: number; total: number } | null>(null);
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [nativityOptions, setNativityOptions] = useState<string[]>(["Native", "Introduced", "Endemic"]);
  const [requiredFields, setRequiredFields] = useState<string[]>(["scientific_name", "family", "accesssion_no", "locality", "province", "region", "habitat", "habit"]);

  // Load options from config
  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      try {
        const config = await getHerbariumConfig();
        if (isMounted) {
          setNativityOptions(config.nativityOptions ?? ["Native", "Introduced", "Endemic"]);
          if (config.requiredFields && config.requiredFields.length > 0) {
            setRequiredFields(config.requiredFields);
          }
        }
      } catch {
        // Use defaults if config loading fails
      }
    };

    void loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleRowUpdate(rowIndex: number, updatedRow: string[]) {
    if (!parsed) return;
    const newRows = parsed.rows.map((r, i) => (i === rowIndex ? updatedRow : r));
    setParsed({ ...parsed, rows: newRows });
    // Clear any row errors for this row since the user edited it
    setRowErrors((prev) => prev.filter((e) => e.rowIndex !== rowIndex));
  }

  async function handleFile(file: File) {    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setParsed(null);
    setFileName(file.name);
    setPage(0);

    const result = await parseFile(file);
    setIsLoading(false);

    if ("message" in result) {
      setError(result.message);
      setFileName(null);
    } else {
      const normalizedRows = result.rows.map((row) => normalizeRow(result.headers, row));
      setParsed({ ...result, rows: normalizedRows });
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleReset() {
    setParsed(null);
    setFileName(null);
    setError(null);
    setPage(0);
    setSheetOpen(false);
    setRowErrors([]);
    setSavedCount(null);
    setSaveProgress(null);
  }

  async function handleSave() {
    if (!parsed) return;

    // Validate all rows first
    const validationErrors: RowError[] = [];
    for (let i = 0; i < parsed.rows.length; i++) {
      const result = csvRowToInput(parsed.headers, parsed.rows[i], nativityOptions, requiredFields);
      if (!result.ok) {
        const accession =
          (() => {
            const idx = parsed.headers.indexOf("Accession Number");
            return idx >= 0 ? (parsed.rows[i][idx] ?? "") : "";
          })() || `Row ${i + 1}`;
        validationErrors.push({ rowIndex: i, accession, errors: result.errors });
      }
    }

    if (validationErrors.length > 0) {
      setRowErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setSaveProgress({ done: 0, total: parsed.rows.length });
    setRowErrors([]);
    setSavedCount(null);

    const saveErrors: RowError[] = [];
    let saved = 0;
    let done = 0;

    // Build the list of valid inputs to save (already validated above)
    const tasks: { i: number; input: Parameters<typeof saveSpecimenEntry>[0] }[] = [];
    for (let i = 0; i < parsed.rows.length; i++) {
      const result = csvRowToInput(parsed.headers, parsed.rows[i], nativityOptions, requiredFields);
      if (result.ok) tasks.push({ i, input: result.input });
    }

    // Save sequentially to avoid ID collisions and data mismatches
    for (const { i, input } of tasks) {
      try {
        await saveSpecimenEntry(input, {
          mode: "create",
          performedBy: currentUser?.email ?? "unknown",
        });
        saved++;
      } catch (err) {
        const accession = input.specimen.accesssion_no || `Row ${i + 1}`;
        saveErrors.push({
          rowIndex: i,
          accession,
          errors: [err instanceof Error ? err.message : "Unknown error."],
        });
      }
      done++;
      setSaveProgress({ done, total: tasks.length });
    }

    setIsSaving(false);
    setSavedCount(saved);
    if (saveErrors.length > 0) setRowErrors(saveErrors);
  }

  function openSheet(globalIndex: number) {
    setActiveRowIndex(globalIndex);
    setSheetOpen(true);
  }

  const totalPages = parsed ? Math.ceil(parsed.totalRows / PAGE_SIZE) : 0;
  const pageRows = parsed
    ? parsed.rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
    : [];

  return (
    <>
      <div className="bg-zinc-900 p-4 w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="shrink-0 text-zinc-50">
            <TypographyH2>Batch Upload</TypographyH2>
          </div>
        </div>
      </div>

      <div className="min-h-[calc(100dvh-80px)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <Button asChild variant="ghost" className="w-fit">
            <Link to="/collections">
              <ArrowLeft className="size-4" />
              Back to Collection
            </Link>
          </Button>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-zinc-800">Upload Specimens via CSV</h2>
            <p className="text-sm text-zinc-500">
              Import multiple specimens at once by uploading a properly formatted CSV file.
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleInputChange}
          />

          {/* Upload area — shown only when no file is loaded */}
          {!parsed && (
            <div
              className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-zinc-700 bg-zinc-50"
                  : "border-zinc-300 bg-zinc-50 hover:border-zinc-400"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragging(false)}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-50">
                <CloudUpload className="size-7 text-lime-700" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-700">
                  {isLoading ? "Reading file…" : "Drag & drop your CSV file here"}
                </p>
                <p className="text-xs text-zinc-400">or click to browse files</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse File
              </Button>
            </div>
          )}

          {/* Error message */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Preview section */}
          {parsed && (
            <div className="space-y-4">
              {/* File info bar */}
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="size-5 text-zinc-700 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-zinc-700">{fileName}</p>
                    <p className="text-xs text-zinc-400">
                      {parsed.totalRows} row{parsed.totalRows !== 1 ? "s" : ""} detected &middot;{" "}
                      {parsed.headers.length} columns
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-zinc-500"
                >
                  <X className="size-4" />
                  Remove
                </Button>
              </div>

              {/* Table */}
              <div>
                <p className="mb-2 text-xs text-zinc-400">
                  Click a row to review its details. Showing rows{" "}
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, parsed.totalRows)} of{" "}
                  {parsed.totalRows}.
                </p>
                <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-zinc-900 text-zinc-50">
                        {/* # — frozen col 0 */}
                        <th className="sticky left-0 z-20 bg-zinc-900 w-10 whitespace-nowrap px-3 py-2.5 text-left font-semibold">
                          #
                        </th>
                        {parsed.headers.map((header) => {
                          const isAccession = header === "Accession Number";
                          const isScientific = header === "Scientific Name";
                          return (
                            <th
                              key={header}
                              className={[
                                "whitespace-nowrap px-3 py-2.5 text-left font-semibold",
                                isAccession
                                  ? "sticky left-10 z-20 bg-zinc-900 w-28 min-w-28 max-w-28"
                                  : isScientific
                                    ? "sticky left-38 z-20 bg-zinc-900 w-36 min-w-36 max-w-36 italic shadow-[2px_0_5px_-2px_rgba(0,0,0,0.35)]"
                                    : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              {header}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row, pageRowIndex) => {
                        const globalIndex = page * PAGE_SIZE + pageRowIndex;
                        const isEven = pageRowIndex % 2 === 0;
                        const rowBg = isEven ? "bg-white" : "bg-zinc-50";
                        return (
                          <tr
                            key={globalIndex}
                            className={`group cursor-pointer transition-colors hover:bg-zinc-50 ${rowBg}`}
                            onClick={() => openSheet(globalIndex)}
                          >
                            {/* # — frozen col 0 */}
                            <td
                              className={`sticky left-0 z-10 w-10 whitespace-nowrap px-3 py-2 font-medium select-none text-zinc-400 ${rowBg} group-hover:bg-zinc-50`}
                            >
                              {globalIndex + 1}
                            </td>
                            {parsed.headers.map((header, colIndex) => {
                              const isAccession = header === "Accession Number";
                              const isScientific = header === "Scientific Name";
                              return (
                                <td
                                  key={colIndex}
                                  className={[
                                    "truncate whitespace-nowrap px-3 py-2 text-zinc-700",
                                    ITALIC_COLUMNS.has(header) ? "italic" : "",
                                    isAccession
                                      ? `sticky left-10 z-10 min-w-28 max-w-28 ${rowBg} group-hover:bg-zinc-50`
                                      : isScientific
                                        ? `sticky left-38 z-10 min-w-36 max-w-36 ${rowBg} group-hover:bg-zinc-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]`
                                        : "max-w-45",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                  title={row[colIndex] ?? ""}
                                >
                                  {row[colIndex] ?? ""}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-zinc-400">
                      Page {page + 1} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <ChevronLeft className="size-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Row validation / save errors */}
              {rowErrors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 space-y-2">
                  <p className="text-sm font-semibold text-red-700">
                    {savedCount !== null
                      ? `${savedCount} specimen${savedCount !== 1 ? "s" : ""} saved, but ${rowErrors.length} row${rowErrors.length !== 1 ? "s" : ""} failed:`
                      : `${rowErrors.length} row${rowErrors.length !== 1 ? "s" : ""} have validation errors — fix them before saving:`}
                  </p>
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                    {rowErrors.map(({ rowIndex, accession, errors }) => (
                      <li key={rowIndex} className="text-xs text-red-600">
                        <span className="font-medium">
                          Row {rowIndex + 1}{accession ? ` (${accession})` : ""}:
                        </span>{" "}
                        {errors.join(" ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Save success banner */}
              {savedCount !== null && rowErrors.length === 0 && (
                <div className="rounded-lg border border-lime-200 bg-lime-50 px-4 py-3">
                  <p className="text-sm font-semibold text-lime-800">
                    {savedCount} specimen{savedCount !== 1 ? "s" : ""} saved successfully.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                  Upload Different File
                </Button>
                <Button
                  className="bg-zinc-900 hover:bg-zinc-800 text-white"
                  onClick={handleSave}
                  disabled={isSaving || savedCount !== null}
                >
                  {isSaving && saveProgress
                    ? `Saving… ${saveProgress.done} / ${saveProgress.total}`
                    : savedCount !== null
                      ? `Saved ${savedCount} specimen${savedCount !== 1 ? "s" : ""}`
                      : `Save to Database (${parsed.totalRows} specimen${parsed.totalRows !== 1 ? "s" : ""})`}
                </Button>
              </div>
            </div>
          )}

          {/* Template download */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="size-5 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-700">CSV Template</p>
                <p className="text-xs text-zinc-400">
                  Download the template to ensure correct formatting.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://docs.google.com/spreadsheets/d/1je8u-KbkMYna1B6zoBN7YPxZAXL9j_XoJPcwt5nss_c/edit?usp=sharing"
                target="_blank"
                rel="noreferrer"
              >
                Open Template
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Specimen detail sheet */}
      {parsed && (
        <SpecimenSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          parsed={parsed}
          activeIndex={activeRowIndex}
          onNavigate={(index) => {
            setActiveRowIndex(index);
            // keep the table page in sync
            setPage(Math.floor(index / PAGE_SIZE));
          }}
          onRowUpdate={handleRowUpdate}
        />
      )}
    </>
  );
}

export default BatchUploadPage;
