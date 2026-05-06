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
    if (count === 0) return "#e4f4d1";
    const intensity = count / maxCount;
    const r = Math.round(164 + (77 - 164) * intensity);
    const g = Math.round(228 + (124 - 228) * intensity);
    const b = Math.round(129 + (15 - 129) * intensity);
    return `rgb(${r},${g},${b})`;
  }

  return (
    <div className="w-full relative select-none">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [122, 12], scale: 1600 }}
        width={600}
        height={700}
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
