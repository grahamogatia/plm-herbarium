import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, CloudUpload, FileSpreadsheet, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";



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
    fields: ["Habit", "Habitat", "Altitude (MASL)", "Plant Height (M)", "DBH (CM)"],
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

// ── Specimen detail sheet ─────────────────────────────────────────────────────

type SpecimenSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsed: ParsedCSV;
  activeIndex: number;
  onNavigate: (index: number) => void;
};

function SpecimenSheet({ open, onOpenChange, parsed, activeIndex, onNavigate }: SpecimenSheetProps) {
  const row = parsed.rows[activeIndex];
  if (!row) return null;

  const getValue = (field: string) => {
    const colIndex = parsed.headers.indexOf(field);
    return colIndex >= 0 ? (row[colIndex] ?? "") : "";
  };

  const accessionNo = getValue("Accession Number");
  const scientificName = getValue("Scientific Name");

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
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 py-4">
          {FIELD_GROUPS.map((group) => {
            const entries = group.fields.map((field) => ({
              field,
              value: getValue(field),
            }));
            const hasAnyValue = entries.some((e) => e.value !== "");
            if (!hasAnyValue) return null;

            return (
              <div key={group.label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lime-800">
                  {group.label}
                </p>
                <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-100 bg-zinc-50">
                  {entries.map(({ field, value }) => (
                    <div key={field} className="flex flex-col px-3 py-2">
                      <span className="text-xs font-medium text-zinc-500">{field}</span>
                      <span
                        className={`text-sm text-zinc-800 break-words${
                          ITALIC_COLUMNS.has(field) ? " italic" : ""
                        }`}
                      >
                        {value || <span className="text-zinc-300">—</span>}
                      </span>
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
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
      setParsed(result);
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
      <div className="bg-lime-800 p-4 w-full">
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
                  ? "border-lime-600 bg-lime-50"
                  : "border-zinc-300 bg-zinc-50 hover:border-zinc-400"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragging(false)}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-100">
                <CloudUpload className="size-7 text-lime-800" />
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
                  <FileSpreadsheet className="size-5 text-lime-700 shrink-0" />
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
                      <tr className="bg-lime-800 text-lime-50">
                        {/* # — frozen col 0 */}
                        <th className="sticky left-0 z-20 bg-lime-800 w-10 whitespace-nowrap px-3 py-2.5 text-left font-semibold">
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
                                  ? "sticky left-10 z-20 bg-lime-800 w-28 min-w-28 max-w-28"
                                  : isScientific
                                    ? "sticky left-38 z-20 bg-lime-800 w-36 min-w-36 max-w-36 italic shadow-[2px_0_5px_-2px_rgba(0,0,0,0.35)]"
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
                            className={`group cursor-pointer transition-colors hover:bg-lime-50 ${rowBg}`}
                            onClick={() => openSheet(globalIndex)}
                          >
                            {/* # — frozen col 0 */}
                            <td
                              className={`sticky left-0 z-10 w-10 whitespace-nowrap px-3 py-2 font-medium select-none text-zinc-400 ${rowBg} group-hover:bg-lime-50`}
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
                                      ? `sticky left-10 z-10 min-w-28 max-w-28 ${rowBg} group-hover:bg-lime-50`
                                      : isScientific
                                        ? `sticky left-38 z-10 min-w-36 max-w-36 ${rowBg} group-hover:bg-lime-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]`
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

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={handleReset}>
                  Upload Different File
                </Button>
                <Button className="bg-lime-800 hover:bg-lime-700 text-white" disabled>
                  Save to Database ({parsed.totalRows} specimen
                  {parsed.totalRows !== 1 ? "s" : ""})
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
        />
      )}
    </>
  );
}

export default BatchUploadPage;
