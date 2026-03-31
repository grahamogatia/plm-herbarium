import type { CollectionRow } from "@/api/collection";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ImageOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type GalleryViewProps = {
  isLoading: boolean;
  errorMessage: string | null;
  rows: CollectionRow[];
};

// A4 portrait ratio (width:height = 1:1.414)
const A4_RATIO = 1.414;
const CARD_GAP = 20;
const INFO_HEIGHT = 90;
const MAX_ROWS = 2;
const PAGINATION_HEIGHT = 36;

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner className="size-8 text-zinc-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

function GalleryView({ isLoading, errorMessage, rows }: GalleryViewProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemsPerPage, setItemsPerPage] = useState(0);
  const [cardWidth, setCardWidth] = useState(220);
  const [page, setPage] = useState(1);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const availableWidth = el.clientWidth;
    const availableHeight = el.clientHeight - PAGINATION_HEIGHT;

    // Start with a generous card width and shrink until 2 rows fit
    let w = 800;
    let cols = Math.max(1, Math.floor((availableWidth + CARD_GAP) / (w + CARD_GAP)));
    let cardH = Math.round(w * A4_RATIO) + INFO_HEIGHT;
    let rowsFit = Math.floor((availableHeight + CARD_GAP) / (cardH + CARD_GAP));

    while (rowsFit < MAX_ROWS && w > 140) {
      w -= 10;
      cols = Math.max(1, Math.floor((availableWidth + CARD_GAP) / (w + CARD_GAP)));
      cardH = Math.round(w * A4_RATIO) + INFO_HEIGHT;
      rowsFit = Math.floor((availableHeight + CARD_GAP) / (cardH + CARD_GAP));
    }

    rowsFit = Math.min(rowsFit, MAX_ROWS);
    setCardWidth(w);
    setItemsPerPage(cols * rowsFit);
  }, []);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [measure]);

  const totalPages = Math.max(1, Math.ceil(rows.length / Math.max(1, itemsPerPage)));
  const safePage = Math.min(page, totalPages);

  const pagedRows = useMemo(() => {
    if (itemsPerPage === 0) return [];
    const start = (safePage - 1) * itemsPerPage;
    return rows.slice(start, start + itemsPerPage);
  }, [rows, safePage, itemsPerPage]);

  // Reset page when rows change
  useEffect(() => { setPage(1); }, [rows]);

  if (isLoading) {
    return (
      <div className="bg-white text-zinc-900 rounded-lg p-4">
        <p className="text-sm text-zinc-600">Loading collection data...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-white text-zinc-900 rounded-lg p-4">
        <p className="text-sm text-red-600">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-white text-zinc-900 rounded-lg p-4 h-[calc(100dvh-56px-64px-48px)] overflow-hidden flex flex-col"
    >
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-600">No results.</p>
      ) : (
        <>
          <div
            className="flex-1 min-h-0 flex flex-wrap content-start"
            style={{ gap: CARD_GAP }}
          >
            {pagedRows.map((row) => (
              <Card
                key={row.specimenId}
                className="overflow-hidden p-0 gap-0 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1.5 shrink-0"
                style={{ width: cardWidth, height: Math.round(cardWidth * A4_RATIO) + INFO_HEIGHT }}
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate(`../collections/${encodeURIComponent(row.accessionNo)}`, {
                    state: { row },
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`../collections/${encodeURIComponent(row.accessionNo)}`, {
                      state: { row },
                    });
                  }
                }}
              >
                <div
                  className="relative w-full bg-zinc-100 flex items-center justify-center border-b border-zinc-200"
                  style={{ height: Math.round(cardWidth * A4_RATIO) }}
                >
                  <Badge className="absolute top-2 right-2 z-10 rounded-md bg-white/40 backdrop-blur-sm text-zinc-900 text-[10px] font-mono border-none shadow-sm">
                    {row.accessionNo}
                  </Badge>
                  {row.photoUrl ? (
                    <GalleryImage src={row.photoUrl} alt={row.taxon} />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-500">
                      <ImageOff className="h-6 w-6" aria-hidden="true" />
                      <span className="text-[10px]">No photo</span>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-0.5 overflow-hidden" style={{ height: INFO_HEIGHT }}>
                  <p className="text-sm font-semibold italic truncate">{row.taxon}</p>
                  <p className="text-sm font-medium text-lime-700 truncate">{row.family}</p>
                  <p className="text-xs text-zinc-600 truncate">{row.collector}</p>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="shrink-0 flex items-center justify-end gap-3 pt-2">
              <span className="text-xs text-zinc-500">
                Page {safePage} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  className="px-2 py-1 text-xs rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  Previous
                </button>
                <button
                  className="px-2 py-1 text-xs rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default GalleryView;