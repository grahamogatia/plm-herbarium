import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, Hash, ImageOff, Leaf, MapPin, UserRound } from "lucide-react";
import type { CollectionRow } from "@/api/collection";

export const specimenColumns: ColumnDef<CollectionRow>[] = [
  {
    id: "image",
    header: "Image",
    cell: () => (
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50">
        <ImageOff className="h-4 w-4 text-zinc-500" aria-label="No image available" />
      </div>
    ),
  },
  {
    accessorKey: "accessionNo",
    header: () => (
      <span className="inline-flex items-center gap-1.5">
        <Hash className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
        Accession No.
      </span>
    ),
    cell: ({ getValue }) => (
      <span className="rounded bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700">
        {String(getValue() ?? "-")}
      </span>
    ),
  },
  {
    accessorKey: "taxon",
    header: () => (
      <span className="inline-flex items-center gap-1.5">
        <Leaf className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
        Taxon
      </span>
    ),
    cell: ({ getValue }) => (
      <span className="font-medium italic text-zinc-900">{String(getValue() ?? "-")}</span>
    ),
  },
  {
    accessorKey: "family",
    header: () => (
      <span className="inline-flex items-center gap-1.5">
        <Leaf className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
        Family
      </span>
    ),
    cell: ({ getValue }) => (
      <span className="inline-flex rounded-full border border-lime-200 bg-lime-50 px-2 py-0.5 text-xs font-medium text-lime-900">
        {String(getValue() ?? "-")}
      </span>
    ),
  },
  {
    accessorKey: "collector",
    header: () => (
      <span className="inline-flex items-center gap-1.5">
        <UserRound className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
        Collector
      </span>
    ),
    cell: ({ getValue }) => <span className="text-zinc-700">{String(getValue() ?? "-")}</span>,
  },
  {
    accessorKey: "date",
    header: () => (
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
        Date
      </span>
    ),
    cell: ({ getValue }) => <span className="text-zinc-700">{String(getValue() ?? "-")}</span>,
  },
  {
    accessorKey: "locality",
    header: () => (
      <span className="inline-flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
        Locality
      </span>
    ),
    cell: ({ getValue }) => (
      <span className="inline-flex items-center text-zinc-700">
        <span className="max-w-52 truncate">{String(getValue() ?? "-")}</span>
      </span>
    ),
  },
];