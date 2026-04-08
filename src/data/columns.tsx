import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, Hash, ImageOff, Leaf, MapPin, Pencil, Trash2, Upload, UserRound } from "lucide-react";
import { useState } from "react";
import { softDeleteSpecimenByAccession, type CollectionRow, type DeleteSpecimenResult } from "@/api/collection";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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

type ImageCellProps = {
  row: CollectionRow;
};

function ImageCellImg({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner className="size-4 text-zinc-400" />
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

function ImageCell({ row }: ImageCellProps) {
  const { currentUser } = useAuth();

  if (row.photoUrl) {
    return (
      <div className="relative h-9 w-9 overflow-hidden rounded-md border border-zinc-200">
        <ImageCellImg src={row.photoUrl} alt={row.taxon} />
      </div>
    );
  }

  if (currentUser) {
    return (
      <Link
        to={`/collections/upload-image/${encodeURIComponent(row.accessionNo)}`}
        title="Upload image"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-lime-300 bg-lime-50 transition-colors hover:border-lime-400 hover:bg-lime-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Upload className="h-4 w-4 text-lime-700" />
      </Link>
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50">
      <ImageOff className="h-4 w-4 text-zinc-500" aria-label="No image available" />
    </div>
  );
}

type DeleteSpecimenButtonProps = {
  row: CollectionRow;
  onDeleted?: (row: CollectionRow, result: DeleteSpecimenResult) => void;
};

function DeleteSpecimenButton({ row, onDeleted }: DeleteSpecimenButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { currentUser } = useAuth();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await softDeleteSpecimenByAccession(row.accessionNo, currentUser?.email ?? "unknown", row.taxon);
      onDeleted?.(row, result);
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
          variant="outline"
          size="icon-xs"
          className="h-7 w-7 rounded-md border-zinc-300 bg-white text-zinc-600 shadow-sm hover:border-red-400 hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete specimen ${row.accessionNo}`}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
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

import type { TableAttribute } from "@/api/config";

type SpecimenColumnsOptions = {
  onDeleted?: (row: CollectionRow, result: DeleteSpecimenResult) => void;
  isAuthenticated?: boolean;
  visibleAttributes?: TableAttribute[];
};

export function specimenColumns(
  options: SpecimenColumnsOptions = {},
): ColumnDef<CollectionRow>[] {
  const { onDeleted, isAuthenticated = false, visibleAttributes } = options;

  const allColumns: (ColumnDef<CollectionRow> & { id?: string; accessorKey?: string })[] = [
  {
    id: "image",
    header: "Image",
    cell: ({ row }) => (
      <ImageCell row={row.original} />
    ),
  },
  {
    accessorKey: "accessionNo",
    header: () => (
      <span className="inline-flex items-center gap-1.5">
        <Hash className="h-3.5 w-3.5 text-lime-400" aria-hidden="true" />
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
        <Leaf className="h-3.5 w-3.5 text-lime-400" aria-hidden="true" />
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
        <Leaf className="h-3.5 w-3.5 text-lime-400" aria-hidden="true" />
        Family
      </span>
    ),
    cell: ({ getValue }) => (
      <span className="inline-flex rounded-full border border-lime-200 bg-lime-50 px-2 py-0.5 text-xs font-medium text-lime-800">
        {String(getValue() ?? "-")}
      </span>
    ),
  },
  {
    accessorKey: "collector",
    header: () => (
      <span className="inline-flex items-center gap-1.5">
        <UserRound className="h-3.5 w-3.5 text-lime-400" aria-hidden="true" />
        Collector
      </span>
    ),
    cell: ({ getValue }) => <span className="text-zinc-700">{String(getValue() ?? "-")}</span>,
  },
  {
    accessorKey: "date",
    header: () => (
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5 text-lime-400" aria-hidden="true" />
        Date
      </span>
    ),
    cell: ({ getValue }) => <span className="text-zinc-700">{String(getValue() ?? "-")}</span>,
  },
  {
    accessorKey: "locality",
    header: () => (
      <span className="inline-flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-lime-400" aria-hidden="true" />
        Locality
      </span>
    ),
    cell: ({ getValue }) => (
      <div className="flex w-full min-w-55 items-center text-zinc-700">
        <span className="truncate">{String(getValue() ?? "-")}</span>
      </div>
    ),
  },
  ];

  // Add actions column for authenticated users (always last, not filterable)
  if (isAuthenticated) {
    allColumns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            asChild
            variant="outline"
            size="icon-xs"
            className="h-7 w-7 rounded-md border-zinc-300 bg-white text-zinc-600 shadow-sm hover:border-lime-400 hover:bg-lime-50 hover:text-lime-700"
            aria-label={`Update specimen ${row.original.accessionNo}`}
            title="Update"
          >
            <Link to={`/collections/update/${encodeURIComponent(row.original.accessionNo)}`}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
          <DeleteSpecimenButton row={row.original} onDeleted={onDeleted} />
        </div>
      ),
    });
  }

  if (!visibleAttributes || visibleAttributes.length === 0) {
    return allColumns;
  }

  return allColumns.filter((col) => {
    const key = col.id ?? col.accessorKey ?? "";
    // Actions column is always visible
    if (key === "actions") return true;
    return visibleAttributes.includes(key as TableAttribute);
  });
}