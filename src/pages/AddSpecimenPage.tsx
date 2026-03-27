import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MultiForm } from "@/data/multi-form.tsx";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";

function AddSpecimenPage() {
  return (
    <>
      <div className="bg-lime-800 p-4 w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="shrink-0 text-zinc-50">
            <TypographyH2>Add Specimen</TypographyH2>
          </div>
        </div>
      </div>
      <div className="min-h-[calc(100dvh-80px)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl space-y-5">
          <Button asChild variant="ghost" className="w-fit">
            <Link to="/collections">
              <ArrowLeft className="size-4" />
              Back to Collection
            </Link>
          </Button>

          <MultiForm />
        </div>
      </div>
    </>
  );
}

export default AddSpecimenPage;
