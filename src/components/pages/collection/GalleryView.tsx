import type { CollectionRow } from "@/api/collection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageOff } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type GalleryViewProps = {
  isLoading: boolean;
  errorMessage: string | null;
  rows: CollectionRow[];
};

const ITEMS_PER_PAGE = 4;

function GalleryView({
  isLoading,
  errorMessage,
  rows,
}: GalleryViewProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return rows.slice(start, start + ITEMS_PER_PAGE);
  }, [rows, safePage]);

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
    <div className="bg-white text-zinc-900 rounded-lg p-4">
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-600">No results.</p>
      ) : (
        <>
          <div className="grid justify-start gap-2 grid-cols-[repeat(auto-fit,15rem)]">
            {pagedRows.map((row) => (
              <Card
                key={row.specimenId}
                className="overflow-hidden p-0 gap-0 w-60 h-84 cursor-pointer transition hover:shadow-md"
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
                <div className="h-[70%] w-full bg-zinc-100 flex items-center justify-center border-b border-zinc-200">
                  {row.photoUrl ? (
                    <img
                      src={row.photoUrl}
                      alt={row.taxon}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-500">
                      <ImageOff className="h-6 w-6" aria-hidden="true" />
                      <span className="text-xs">No photo</span>
                    </div>
                  )}
                </div>
                <div className="h-[30%] p-3 space-y-1 overflow-hidden">
                  <p className="text-sm font-semibold italic truncate">{row.taxon}</p>
                  <p className="text-xs font-medium text-lime-700 truncate">{row.family}</p>
                  <p className="text-xs text-zinc-600 truncate">{row.collector}</p>
                  <p className="text-xs font-mono text-zinc-500 truncate">{row.accessionNo}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage <= 1}
            >
              Previous
            </Button>
            <span className="text-xs text-zinc-600">
              Page {safePage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage >= totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default GalleryView;