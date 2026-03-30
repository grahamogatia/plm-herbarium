import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, Hash, ImageOff, Leaf, MapPin, Pencil, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { softDeleteSpecimenByAccession, type CollectionRow } from "@/api/collection";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type DeleteSpecimenButtonProps = {
  row: CollectionRow;
  onDeleted?: (row: CollectionRow) => void;
};

function DeleteSpecimenButton({ row, onDeleted }: DeleteSpecimenButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { currentUser } = useAuth();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await softDeleteSpecimenByAccession(row.accessionNo, currentUser?.email ?? "unknown", row.taxon);
      onDeleted?.(row);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete specimen.";
      window.alert(message);
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon-xs"
          aria-label={`Delete specimen ${row.accessionNo}`}
          title="Delete"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete specimen?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the specimen as deleted and hide it from collection views.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
          <p><span className="font-medium">Accession No:</span> {row.accessionNo}</p>
          <p><span className="font-medium">Scientific Name:</span> {row.taxon}</p>
          <p><span className="font-medium">Collector(s):</span> {row.collector}</p>
          <p><span className="font-medium">Date Collected:</span> {row.date}</p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? "Deleting..." : "Yes, Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type SpecimenColumnsOptions = {
  onDeleted?: (row: CollectionRow) => void;
};

export function specimenColumns(
  options: SpecimenColumnsOptions = {},
): ColumnDef<CollectionRow>[] {
  const { onDeleted } = options;

  return [
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
    cell: ({ getValue, row }) => (
      <div className="relative flex w-full min-w-55 items-center pr-20 text-zinc-700">
        <span className="truncate">{String(getValue() ?? "-")}</span>

        <div
          data-row-actions
          className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center gap-1 bg-linear-to-l from-white via-white to-transparent pl-6 opacity-0 transition-opacity duration-150 group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            asChild
            variant="outline"
            size="icon-xs"
            aria-label={`Update specimen ${row.original.accessionNo}`}
            title="Update"
          >
            <Link to={`/collections/update/${encodeURIComponent(row.original.accessionNo)}`}>
              <Pencil aria-hidden="true" />
            </Link>
          </Button>
          <DeleteSpecimenButton row={row.original} onDeleted={onDeleted} />
        </div>
      </div>
    ),
  },
  ];
}