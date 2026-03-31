import { Link } from "react-router-dom";
import { ArrowLeft, CloudUpload, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";

function BatchUploadPage() {
  return (
    <>
      <div className="bg-lime-800 p-4 w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="shrink-0 text-zinc-50">
            <TypographyH2>Batch Upload</TypographyH2>
          </div>
        </div>
      </div>

      <div className="min-h-[calc(100dvh-80px)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <Button asChild variant="ghost" className="w-fit">
            <Link to="/collections">
              <ArrowLeft className="size-4" />
              Back to Collection
            </Link>
          </Button>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-zinc-800">Upload Specimens via CSV</h2>
            <p className="text-sm text-zinc-500">
              Import multiple specimens at once by uploading a properly formatted CSV file.
            </p>
          </div>

          {/* Upload area */}
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center hover:border-zinc-400 transition-colors cursor-pointer">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-100">
              <CloudUpload className="size-7 text-lime-800" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-700">
                Drag & drop your CSV file here
              </p>
              <p className="text-xs text-zinc-400">or click to browse files</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Browse File
            </Button>
          </div>

          {/* Template download */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="size-5 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-700">CSV Template</p>
                <p className="text-xs text-zinc-400">Download the template to ensure correct formatting.</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://docs.google.com/spreadsheets/d/1je8u-KbkMYna1B6zoBN7YPxZAXL9j_XoJPcwt5nss_c/edit?usp=sharing"
                target="_blank"
                rel="noreferrer"
              >
                Open Template
              </a>
            </Button>
          </div>

          <p className="text-xs text-zinc-400">
            Batch upload functionality is coming soon.
          </p>
        </div>
      </div>
    </>
  );
}

export default BatchUploadPage;
