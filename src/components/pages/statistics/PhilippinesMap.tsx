import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

const GEO_URL = "/philippines-provinces.json";

interface ProvinceCount {
  [province: string]: number;
}

interface Props {
  data?: ProvinceCount;
}

function PhilippinesMap({ data = {} }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  const maxCount = Math.max(...Object.values(data), 1);

  function getColor(province: string): string {
    const count = data[province] ?? 0;
    if (count === 0) return "#ffffff";
    // Use a sqrt scale so even small counts get visible color
    const intensity = Math.sqrt(count / maxCount);
    // White → vivid lime (#84cc16) → dark green (#166534)
    // Two-stop: 0–0.5 = white→lime, 0.5–1 = lime→dark green
    let r: number, g: number, b: number;
    if (intensity <= 0.5) {
      const t = intensity / 0.5;
      r = Math.round(255 + (132 - 255) * t); // 255 → 132
      g = Math.round(255 + (204 - 255) * t); // 255 → 204
      b = Math.round(255 + (22  - 255) * t); // 255 → 22
    } else {
      const t = (intensity - 0.5) / 0.5;
      r = Math.round(132 + (22  - 132) * t); // 132 → 22
      g = Math.round(204 + (101 - 204) * t); // 204 → 101
      b = Math.round(22  + (52  - 22)  * t); // 22  → 52
    }
    return `rgb(${r},${g},${b})`;
  }

  return (
    <div className="w-full relative select-none">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [122, 12], scale: 2200 }}
        width={500}
        height={720}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const province: string = geo.properties.ADM2_EN ?? "";
              const count = data[province] ?? 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getColor(province)}
                  stroke="#4d7c0f"
                  strokeWidth={0.5}
                  onMouseMove={(e) =>
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      content: `${province}${count > 0 ? `: ${count} specimen${count !== 1 ? "s" : ""}` : ""}`,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#84cc16", outline: "none", cursor: "pointer" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 shadow-md"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

export default PhilippinesMap;
