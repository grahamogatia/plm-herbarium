import { useEffect, useRef, useState } from "react";
import {
  getCollectionStats,
  type CollectionStats,
} from "@/api/statistics";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Leaf } from "lucide-react";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

// Lime / green palette
const CHART_COLORS = [
  "#4d7c0f", "#65a30d", "#84cc16", "#a3e635", "#bef264", "#d9f99d",
  "#3f6212", "#365314", "#16a34a", "#22c55e", "#4ade80", "#86efac",
];

const CONSERVATION_ORDER = ["LC", "NT", "VU", "EN", "CE", "EW", "EX", "Unknown"];

const CONSERVATION_FULL_LABELS: Record<string, string> = {
  LC: "Least Concern",
  NT: "Near Threatened",
  VU: "Vulnerable",
  EN: "Endangered",
  CE: "Critically Endangered",
  EW: "Extinct in the Wild",
  EX: "Extinct",
  Unknown: "Unknown",
};

const CONSERVATION_COLORS: Record<string, string> = {
  LC: "#65a30d",
  NT: "#84cc16",
  VU: "#eab308",
  EN: "#f97316",
  CE: "#ef4444",
  EW: "#991b1b",
  EX: "#451a03",
  Unknown: "#a1a1aa",
};

const NATIVITY_COLORS: Record<string, string> = {
  Native: "#4d7c0f",
  Endemic: "#16a34a",
  Introduced: "#eab308",
  Unknown: "#a1a1aa",
};

function buildChartConfig(
  entries: { name: string }[],
  colorMap?: Record<string, string>,
): ChartConfig {
  const config: ChartConfig = {};
  entries.forEach((entry, i) => {
    config[entry.name] = {
      label: entry.name,
      color: colorMap?.[entry.name] ?? CHART_COLORS[i % CHART_COLORS.length],
    };
  });
  return config;
}

function SectionSummary({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-zinc-500 leading-relaxed">{children}</p>
  );
}

function SectionNumber({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2">
      <span className="text-lg font-bold text-lime-700">{value}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

function StatisticsPage() {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCollectionStats();
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load statistics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleDownloadPDF() {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      // Allow any in-flight React renders / chart animations to settle
      await new Promise<void>((r) => setTimeout(r, 150));

      // Capture via a clone so the visible layout is never mutated.
      // onclone receives the cloned document element so we can set a stable
      // fixed width without touching the live DOM at all.
      const RENDER_WIDTH = 900;
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        // windowWidth should match the fixed width we set on the clone so that
        // media-queries and percentage widths compute correctly.
        windowWidth: RENDER_WIDTH,
        onclone: (_doc, clonedEl) => {
          clonedEl.style.width = `${RENDER_WIDTH}px`;
          clonedEl.style.maxWidth = `${RENDER_WIDTH}px`;
          clonedEl.style.boxSizing = "border-box";
          clonedEl.style.overflow = "visible";
        },
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth  = pdf.internal.pageSize.getWidth();   // 210 mm
      const pageHeight = pdf.internal.pageSize.getHeight();  // 297 mm
      const margin      = 12; // mm
      const usableW     = pageWidth  - margin * 2;
      const usableH     = pageHeight - margin * 2 - 6; // 6 mm reserved for footer

      // How many canvas pixels correspond to 1 mm on the PDF page?
      const pxPerMm   = canvas.width / usableW;
      // How many canvas pixels fit in a single PDF page (height)?
      const pageHeightPx = usableH * pxPerMm;

      const totalPages = Math.ceil(canvas.height / pageHeightPx);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        const srcY = page * pageHeightPx;
        const srcH = Math.min(pageHeightPx, canvas.height - srcY);
        // The destination height in mm, proportional to the slice height
        const destH = srcH / pxPerMm;

        // Blit just this page's slice into a temporary canvas
        const slice = document.createElement("canvas");
        slice.width  = canvas.width;
        slice.height = Math.ceil(srcH);
        const ctx = slice.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(
            canvas,
            0, Math.floor(srcY), canvas.width, Math.ceil(srcH),
            0, 0,                canvas.width, Math.ceil(srcH),
          );
        }

        pdf.addImage(
          slice.toDataURL("image/png"),
          "PNG",
          margin, margin,
          usableW, destH,
        );

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `PLM Herbarium — Collection Statistics Report  |  Page ${page + 1} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 4,
          { align: "center" },
        );
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`PLM-Herbarium-Statistics-${dateStr}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60dvh]">
        <Spinner className="size-8 text-lime-700" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">{error ?? "No data."}</p>
      </div>
    );
  }

  // --- Prepare chart data ---

  // Conservation status in canonical order with full labels
  const conservationData = CONSERVATION_ORDER.filter(
    (s) => stats.conservationStatus.some((e) => e.name === s),
  ).map((s) => {
    const entry = stats.conservationStatus.find((e) => e.name === s);
    const fullLabel = CONSERVATION_FULL_LABELS[s] ?? s;
    return { name: fullLabel, abbr: s, count: entry?.count ?? 0 };
  });

  const conservationColorsByLabel: Record<string, string> = {};
  for (const d of conservationData) {
    conservationColorsByLabel[d.name] = CONSERVATION_COLORS[d.abbr] ?? "#a1a1aa";
  }
  const conservationConfig = buildChartConfig(conservationData, conservationColorsByLabel);

  // Nativity
  const nativityConfig = buildChartConfig(stats.nativity, NATIVITY_COLORS);

  // Family — show top 10, rest as "Other"
  const topFamilies = stats.familyDistribution.slice(0, 10);
  const otherFamiliesCount = stats.familyDistribution
    .slice(10)
    .reduce((sum, e) => sum + e.count, 0);
  const familyData =
    otherFamiliesCount > 0
      ? [...topFamilies, { name: "Other", count: otherFamiliesCount }]
      : topFamilies;
  const familyConfig = buildChartConfig(familyData);

  // Time series
  const timeConfig: ChartConfig = {
    count: { label: "Specimens", color: "#4d7c0f" },
  };

  // Region — top 10
  const regionData = stats.specimensByRegion.slice(0, 10);
  const regionConfig: ChartConfig = {
    count: { label: "Specimens", color: "#65a30d" },
  };

  // Collector — top 5
  const collectorData = stats.collectorActivity.slice(0, 5);
  const collectorConfig: ChartConfig = {
    count: { label: "Specimens", color: "#4d7c0f" },
  };

  // Nativity radar data
  const nativityRadarData = stats.nativity.map((e) => ({
    name: e.name,
    count: e.count,
  }));

  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // --- Narrative helpers ---
  const topFamily = familyData[0];
  const topFamilyPct = topFamily
    ? ((topFamily.count / stats.totalSpecimens) * 100).toFixed(1)
    : "0";
  const totalFamilies = stats.familyDistribution.length;

  const dominantConservation = conservationData.reduce((a, b) => (a.count >= b.count ? a : b), conservationData[0]);
  const threatenedCount = conservationData
    .filter((d) => ["Vulnerable", "Endangered", "Critically Endangered", "Extinct in the Wild", "Extinct"].includes(d.name))
    .reduce((sum, d) => sum + d.count, 0);

  const dominantNativity = stats.nativity.reduce((a, b) => (a.count >= b.count ? a : b), stats.nativity[0]);

  const topRegion = regionData[0];
  const topCollector = collectorData[0];

  const timeStart = stats.specimensOverTime[0]?.month ?? "";
  const timeEnd = stats.specimensOverTime[stats.specimensOverTime.length - 1]?.month ?? "";
  const peakMonth = stats.specimensOverTime.reduce((a, b) => (a.count >= b.count ? a : b), stats.specimensOverTime[0]);

  return (
    <>
    <div className="bg-zinc-900 p-4 w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="text-zinc-50">
          <TypographyH2>Statistics</TypographyH2>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-lime-900 bg-lime-800 text-zinc-200 hover:bg-zinc-50 hover:text-zinc-950"
          onClick={handleDownloadPDF}
          disabled={exporting}
        >
          {exporting ? (
            <Spinner className="size-4 mr-2" />
          ) : (
            <Download className="size-4 mr-2" />
          )}
          {exporting ? "Generating…" : "Download PDF"}
        </Button>
      </div>
    </div>
    <div ref={reportRef} className="mx-auto max-w-4xl px-6 py-10 space-y-8 bg-white">

      {/* ===== REPORT HEADER ===== */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">PLM Herbarium</h1>
          <h2 className="text-lg font-semibold text-lime-700 mt-0.5">Collection Statistics Report</h2>
          <p className="text-sm text-zinc-400 mt-1">Generated on {generatedDate}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-100 shrink-0">
          <Leaf className="size-6 text-lime-700" />
        </div>
      </div>

      <div className="h-px bg-zinc-200" />

      {/* ===== OVERVIEW ===== */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-700">1. Overview</h3>
        <Card className="border-lime-200 bg-lime-50/50">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-100">
              <Leaf className="size-7 text-lime-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Total Specimens in Collection</p>
              <p className="text-3xl font-bold text-lime-800">{stats.totalSpecimens.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <SectionSummary>
          The PLM Herbarium currently houses <strong>{stats.totalSpecimens.toLocaleString()}</strong> catalogued
          specimens across <strong>{totalFamilies}</strong> plant families, collected from <strong>{regionData.length}</strong> regions
          by <strong>{stats.collectorActivity.length}</strong> contributors.
        </SectionSummary>
      </section>

      <div className="h-px bg-zinc-100" />

      {/* ===== FAMILY DISTRIBUTION ===== */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-700">2. Family Distribution</h3>
        <SectionSummary>
          The most represented family is <strong>{topFamily?.name}</strong> with <strong>{topFamily?.count.toLocaleString()}</strong> specimens
          ({topFamilyPct}% of total). The chart below shows the top {Math.min(10, totalFamilies)} families
          {otherFamiliesCount > 0 && <>, with {stats.familyDistribution.length - 10} smaller families grouped as "Other" ({otherFamiliesCount.toLocaleString()} specimens)</>}.
        </SectionSummary>
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={familyConfig} className="mx-auto aspect-square max-h-72">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={familyData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={50}
                  strokeWidth={2}
                >
                  {familyData.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                              {totalFamilies}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                              Families
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          {familyData.map((f, i) => (
            <div key={f.name} className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              {f.name} ({f.count})
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-zinc-100" />

      {/* ===== CONSERVATION STATUS ===== */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-700">3. Conservation Status (IUCN)</h3>
        <SectionSummary>
          Following IUCN Red List categories, the majority of specimens fall under <strong>{dominantConservation?.name}</strong> ({dominantConservation?.count.toLocaleString()} specimens).
          A total of <strong>{threatenedCount.toLocaleString()}</strong> specimen{threatenedCount !== 1 ? "s" : ""} belong
          to threatened categories (Vulnerable or higher).
        </SectionSummary>
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={conservationConfig} className="h-72 w-full">
              <BarChart data={conservationData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  tick={{ fontSize: 12 }}
                />
                <XAxis type="number" hide />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {conservationData.map((entry) => (
                    <Cell key={entry.name} fill={CONSERVATION_COLORS[entry.abbr] ?? "#a1a1aa"} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          {conservationData.map((d) => (
            <SectionNumber key={d.name} label={d.name} value={d.count} />
          ))}
        </div>
      </section>

      <div className="h-px bg-zinc-100" />

      {/* ===== NATIVITY ===== */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-700">4. Nativity</h3>
        <SectionSummary>
          Specimen nativity classification shows that <strong>{dominantNativity?.name}</strong> species
          are the most represented with <strong>{dominantNativity?.count.toLocaleString()}</strong> specimens.
        </SectionSummary>
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={nativityConfig} className="mx-auto aspect-square max-h-72">
              <RadarChart data={nativityRadarData}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                <PolarGrid />
                <Radar
                  dataKey="count"
                  fill="#4d7c0f"
                  fillOpacity={0.6}
                  stroke="#4d7c0f"
                  dot={{ r: 4, fillOpacity: 1 }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          {stats.nativity.map((n) => (
            <div key={n.name} className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: NATIVITY_COLORS[n.name] ?? "#a1a1aa" }} />
              {n.name} ({n.count})
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-zinc-100" />

      {/* ===== COLLECTION TIMELINE ===== */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-700">5. Collection Timeline</h3>
        <SectionSummary>
          Specimens have been collected from <strong>{timeStart}</strong> to <strong>{timeEnd}</strong>.
          {peakMonth && <> The peak collection period was <strong>{peakMonth.month}</strong> with <strong>{peakMonth.count.toLocaleString()}</strong> specimens recorded.</>}
        </SectionSummary>
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={timeConfig} className="h-64 w-full">
              <LineChart data={stats.specimensOverTime} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tickLine={false} axisLine={false} width={30} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4d7c0f"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#4d7c0f" }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <div className="h-px bg-zinc-100" />

      {/* ===== GEOGRAPHIC DISTRIBUTION ===== */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-700">6. Geographic Distribution</h3>
        <SectionSummary>
          Specimens originate from <strong>{stats.specimensByRegion.length}</strong> regions.
          {topRegion && <> <strong>{topRegion.name}</strong> is the most represented region with <strong>{topRegion.count.toLocaleString()}</strong> specimens.</>}
        </SectionSummary>
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={regionConfig} className="h-72 w-full">
              <BarChart data={regionData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={130}
                  tick={{ fontSize: 11 }}
                />
                <XAxis type="number" hide />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="#65a30d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <div className="h-px bg-zinc-100" />

      {/* ===== COLLECTOR ACTIVITY ===== */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-700">7. Collector Activity</h3>
        <SectionSummary>
          A total of <strong>{stats.collectorActivity.length}</strong> collectors have contributed to the herbarium.
          {topCollector && <> The most active contributor is <strong>{topCollector.name}</strong> with <strong>{topCollector.count.toLocaleString()}</strong> specimens.</>}
        </SectionSummary>
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={collectorConfig} className="h-64 w-full">
              <BarChart data={collectorData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={130}
                  tick={{ fontSize: 11 }}
                />
                <XAxis type="number" hide />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="#4d7c0f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <div className="h-px bg-zinc-200 mt-4" />

      {/* ===== REMARKS & CREDITS ===== */}
      <section className="space-y-4 pb-4">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-zinc-700">Remarks</h3>
          <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-500 leading-relaxed">
            <li>Family distribution displays the top 10 families; remaining families are aggregated as "Other."</li>
            <li>Conservation status classifications follow the IUCN Red List of Threatened Species. Specimens lacking a designated conservation status are labeled "Unknown."</li>
            <li>Nativity indicates whether a species is Native, Endemic, or Introduced to the Philippines.</li>
            <li>Collector activity reflects the top 5 contributors ranked by number of specimens collected.</li>
            <li>Regional data is derived from the recorded collection locality of each specimen.</li>
            <li>Timeline data is grouped by month and year of collection date.</li>
          </ul>
        </div>
        <div className="rounded-md border border-zinc-100 bg-zinc-50 px-4 py-4 space-y-2">
          <h3 className="text-sm font-semibold text-zinc-600">Credits</h3>
          <p className="text-xs text-zinc-500">Pamantasan ng Lungsod ng Maynila — College of Science, Department of Biology</p>
          <p className="text-xs text-zinc-500">PLM Herbarium Digital Collection &amp; Biodiversity Informatics</p>
          <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
            This report was automatically generated from the PLM Herbarium database on {generatedDate}.
            All data is subject to updates as new specimens are catalogued and verified. For inquiries, 
            please contact the PLM Herbarium office.
          </p>
        </div>
      </section>
    </div>
    </>
  );
}

export default StatisticsPage;
