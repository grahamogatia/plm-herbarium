import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CloudUpload, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";
import { uploadSpecimenImage, type CollectionRow } from "@/api/collection";
import { getCollectionRowByAccession } from "@/api/collection";
import { useEffect } from "react";

function UploadImagePage() {
  const { accessionNo = "" } = useParams();
  const decodedAccessionNo = decodeURIComponent(accessionNo);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [specimen, setSpecimen] = useState<CollectionRow | null>(null);
  const [isLoadingSpecimen, setIsLoadingSpecimen] = useState(true);

  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoadingSpecimen(true);
      try {
        const row = await getCollectionRowByAccession(decodedAccessionNo);
        if (isMounted) {
          setSpecimen(row);
          if (row?.photoUrl) {
            setUploadedUrl(row.photoUrl);
          }
        }
      } finally {
        if (isMounted) setIsLoadingSpecimen(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [decodedAccessionNo]);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setError(null);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
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

  function handleClear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setError(null);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const url = await uploadSpecimenImage(decodedAccessionNo, selectedFile);
      setUploadedUrl(url);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <div className="bg-zinc-900 p-4 w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="shrink-0 text-zinc-50">
            <TypographyH2>Upload Image</TypographyH2>
          </div>
        </div>
      </div>

      <div className="min-h-[calc(100dvh-80px)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <Button asChild variant="ghost" className="w-fit">
            <Link to="/collections">
              <ArrowLeft className="size-4" />
              Back to Collection
            </Link>
          </Button>

          {/* Specimen info */}
          {isLoadingSpecimen ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
              Loading specimen...
            </div>
          ) : !specimen ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Specimen not found for accession number "{decodedAccessionNo}".
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div>
                  <span className="font-medium text-zinc-500">Accession No.</span>
                  <p className="font-mono text-zinc-800">{specimen.accessionNo}</p>
                </div>
                <div>
                  <span className="font-medium text-zinc-500">Taxon</span>
                  <p className="italic text-zinc-800">{specimen.taxon}</p>
                </div>
                <div>
                  <span className="font-medium text-zinc-500">Family</span>
                  <p className="text-zinc-800">{specimen.family}</p>
                </div>
                <div>
                  <span className="font-medium text-zinc-500">Collector</span>
                  <p className="text-zinc-800">{specimen.collector}</p>
                </div>
              </div>
            </div>
          )}

          {/* Current image */}
          {uploadedUrl && !preview && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-700">Current Image</p>
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <img
                  src={uploadedUrl}
                  alt={specimen?.taxon ?? "Specimen"}
                  className="mx-auto max-h-80 object-contain"
                />
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />

          {/* Drop zone / preview */}
          {!preview ? (
            <div
              className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-lime-500 bg-lime-50"
                  : "border-zinc-300 bg-zinc-50 hover:border-lime-400"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-50">
                <CloudUpload className="size-7 text-lime-700" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-700">
                  Drag & drop an image here
                </p>
                <p className="text-xs text-zinc-400">or click to browse files</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <img
                  src={preview}
                  alt="Preview"
                  className="mx-auto max-h-80 object-contain"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">{selectedFile?.name}</p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-500"
                    onClick={handleClear}
                    disabled={isUploading}
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                  <Button
                    size="sm"
                    className="bg-lime-700 hover:bg-lime-800 text-white"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading…" : "Upload Image"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </>
  );
}

export default UploadImagePage;
