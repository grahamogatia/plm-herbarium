import { useEffect, useState } from "react";
import {
  getCollectionStats,
  type CollectionStats,
} from "@/api/statistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
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
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";
import { Leaf, Sprout } from "lucide-react";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";

// Lime / green palette that matches the site theme
const CHART_COLORS = [
  "#4d7c0f", // lime-700
  "#65a30d", // lime-600
  "#84cc16", // lime-500
  "#a3e635", // lime-400
  "#bef264", // lime-300
  "#d9f99d", // lime-200
  "#3f6212", // lime-800
  "#365314", // lime-900
  "#16a34a", // green-600
  "#22c55e", // green-500
  "#4ade80", // green-400
  "#86efac", // green-300
];

const CONSERVATION_ORDER = ["LC", "NT", "VU", "EN", "CE", "EW", "EX", "Unknown"];
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

function StatisticsPage() {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Conservation status in canonical order
  const conservationData = CONSERVATION_ORDER.filter(
    (s) => stats.conservationStatus.some((e) => e.name === s),
  ).map((s) => {
    const entry = stats.conservationStatus.find((e) => e.name === s);
    return { name: s, count: entry?.count ?? 0 };
  });

  const conservationConfig = buildChartConfig(conservationData, CONSERVATION_COLORS);

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

  const totalNativity = stats.nativity.reduce((s, e) => s + e.count, 0);

  return (
    <>
    <div className="bg-zinc-900 p-4 w-full">
      <div className="flex items-center gap-3">
        <div className="text-zinc-50">
          <TypographyH2>Statistics</TypographyH2>
        </div>
      </div>
    </div>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">

      {/* Total specimens */}
      <Card className="border-lime-200 bg-lime-50/50">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-100">
            <Leaf className="size-7 text-lime-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Total Specimens</p>
            <p className="text-3xl font-bold text-lime-800">{stats.totalSpecimens.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Row: Family + Conservation + Nativity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Family Distribution — Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-700">Family Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={familyConfig} className="mx-auto aspect-square max-h-70">
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
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                              {familyData.length}
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

        {/* Conservation Status — Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-700">Conservation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={conservationConfig} className="aspect-square max-h-70 w-full">
              <BarChart data={conservationData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tick={{ fontSize: 11 }}
                />
                <XAxis type="number" hide />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {conservationData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CONSERVATION_COLORS[entry.name] ?? "#a1a1aa"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Nativity — Radial */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-700">Nativity</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={nativityConfig} className="mx-auto aspect-square max-h-70">
              <RadialBarChart
                data={stats.nativity.map((e) => ({
                  ...e,
                  fill: NATIVITY_COLORS[e.name] ?? "#a1a1aa",
                }))}
                innerRadius={30}
                outerRadius={110}
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
                <RadialBar dataKey="count" background />
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                            {totalNativity}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                            Total
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </RadialBarChart>
            </ChartContainer>

          </CardContent>
        </Card>
      </div>

      {/* Specimens Collected Over Time — Line */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-700">Specimens Collected Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={timeConfig} className="h-65 w-full">
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

      {/* Row: Region + Collector Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Specimens by Region — Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-700">Specimens by Region</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={regionConfig} className="h-75 w-full">
              <BarChart data={regionData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <XAxis type="number" hide />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="#65a30d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Collector Activity — Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-700">Collector Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={collectorConfig} className="h-75 w-full">
              <BarChart data={collectorData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  tick={{ fontSize: 10 }}
                />
                <XAxis type="number" hide />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="#4d7c0f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}

export default StatisticsPage;
