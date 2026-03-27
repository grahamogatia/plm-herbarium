import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Leaf,
  MapPin,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CollectorSection from "@/components/pages/collection/multi-form/CollectorSection";
import DetailsSection from "@/components/pages/collection/multi-form/DetailsSection";
import LocationSection from "@/components/pages/collection/multi-form/LocationSection";
import ReviewSection from "@/components/pages/collection/multi-form/ReviewSection";
import SpeciesSection from "@/components/pages/collection/multi-form/SpeciesSection";
import type { FormErrors, FormValues } from "@/components/pages/collection/multi-form/types";
import {
  CollectorSchema,
  LocationSchema,
  SpeciesSchema,
  SpecimenSchema,
} from "@/data/schemas";

const conservationOptions = SpeciesSchema.shape.conservation_status.options;
const nativityOptions = SpeciesSchema.shape.nativity.options;
const habitOptions = SpecimenSchema.shape.habit.options;

const initialValues: FormValues = {
  accesssion_no: "",
  scientific_name: "",
  common_name: "",
  family: "",
  conservation_status: "",
  nativity: "",
  locality: "",
  province: "",
  region: "",
  latitude: "",
  longitude: "",
  collector_name: "",
  date_collected: "",
  habitat: "",
  habit: "",
  altitude_masl: "",
  plant_height_m: "",
  dbh_cm: "",
  flower_description: "",
  fruit_description: "",
  leaf_description: "",
  notes: "",
};

const speciesStepSchema = z.object({
  accesssion_no: SpecimenSchema.shape.accesssion_no,
  scientific_name: SpeciesSchema.shape.scientific_name,
  common_name: SpeciesSchema.shape.common_name,
  family: SpeciesSchema.shape.family,
  conservation_status: SpeciesSchema.shape.conservation_status,
  nativity: SpeciesSchema.shape.nativity,
});

const locationStepSchema = LocationSchema.omit({
  location_id: true,
});

const collectorStepSchema = CollectorSchema.omit({
  collector_id: true,
});

const specimenDetailsStepSchema = SpecimenSchema.pick({
  date_collected: true,
  habitat: true,
  habit: true,
  altitude_masl: true,
  plant_height_m: true,
  dbh_cm: true,
  flower_description: true,
  fruit_description: true,
  leaf_description: true,
  notes: true,
});

const steps = [
  {
    title: "Species",
    description: "Taxonomy and naming",
    icon: Leaf,
  },
  {
    title: "Location",
    description: "Collection locality",
    icon: MapPin,
  },
  {
    title: "Collector",
    description: "Who collected",
    icon: UserRound,
  },
  {
    title: "Details",
    description: "Measurements and notes",
    icon: ClipboardList,
  },
  {
    title: "Review",
    description: "Check everything before submit",
    icon: Eye,
  },
];

const parseNumber = (value: string): number => Number(value);

const parseOptionalNumber = (value: string): number | undefined =>
  value.trim() === "" ? undefined : Number(value);

const parseNullableNumber = (value: string): number | null =>
  value.trim() === "" ? null : Number(value);

const issueMap = (error: z.ZodError): FormErrors => {
  const mappedErrors: FormErrors = {};

  for (const issue of error.issues) {
    const key = issue.path[0] as keyof FormValues | undefined;
    if (!key || mappedErrors[key]) {
      continue;
    }
    mappedErrors[key] = issue.message;
  }

  return mappedErrors;
};

export function MultiForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const isLastStep = currentStep === steps.length - 1;
  const progress = useMemo(
    () => Math.round(((currentStep + 1) / steps.length) * 100),
    [currentStep],
  );

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitMessage("");
  };

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      const parsed = speciesStepSchema.safeParse({
        accesssion_no: values.accesssion_no,
        scientific_name: values.scientific_name,
        common_name: values.common_name || undefined,
        family: values.family,
        conservation_status: values.conservation_status,
        nativity: values.nativity,
      });

      if (!parsed.success) {
        setErrors((prev) => ({ ...prev, ...issueMap(parsed.error) }));
        return false;
      }

      return true;
    }

    if (step === 1) {
      const parsed = locationStepSchema.safeParse({
        locality: values.locality,
        province: values.province,
        region: values.region,
        latitude: parseOptionalNumber(values.latitude),
        longitude: parseOptionalNumber(values.longitude),
      });

      if (!parsed.success) {
        setErrors((prev) => ({ ...prev, ...issueMap(parsed.error) }));
        return false;
      }

      return true;
    }

    if (step === 2) {
      const parsed = collectorStepSchema.safeParse({
        name: values.collector_name,
      });

      if (!parsed.success) {
        setErrors((prev) => ({
          ...prev,
          collector_name: parsed.error.issues[0]?.message,
        }));
        return false;
      }

      return true;
    }

    if (step === 3) {
      const parsed = specimenDetailsStepSchema.safeParse({
        date_collected: new Date(values.date_collected),
        habitat: values.habitat,
        habit: values.habit,
        altitude_masl: parseNumber(values.altitude_masl),
        plant_height_m: parseNumber(values.plant_height_m),
        dbh_cm: parseNullableNumber(values.dbh_cm),
        flower_description: values.flower_description || undefined,
        fruit_description: values.fruit_description || undefined,
        leaf_description: values.leaf_description || undefined,
        notes: values.notes,
      });

      if (!parsed.success) {
        setErrors((prev) => ({ ...prev, ...issueMap(parsed.error) }));
        return false;
      }

      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    const species = {
      species_id: 0,
      family: values.family,
      scientific_name: values.scientific_name,
      common_name: values.common_name || undefined,
      conservation_status: values.conservation_status,
      nativity: values.nativity,
    };

    const location = {
      location_id: 0,
      locality: values.locality,
      province: values.province,
      region: values.region,
      latitude: parseOptionalNumber(values.latitude),
      longitude: parseOptionalNumber(values.longitude),
    };

    const collector = {
      collector_id: 0,
      name: values.collector_name,
    };

    const specimen = {
      specimen_id: 0,
      accesssion_no: values.accesssion_no,
      species_id: 0,
      collector_id: 0,
      location_id: 0,
      date_collected: new Date(values.date_collected),
      habitat: values.habitat,
      habit: values.habit,
      altitude_masl: parseNumber(values.altitude_masl),
      plant_height_m: parseNumber(values.plant_height_m),
      dbh_cm: parseNullableNumber(values.dbh_cm),
      flower_description: values.flower_description || undefined,
      fruit_description: values.fruit_description || undefined,
      leaf_description: values.leaf_description || undefined,
      notes: values.notes,
    };

    const speciesCheck = SpeciesSchema.safeParse(species);
    const locationCheck = LocationSchema.safeParse(location);
    const collectorCheck = CollectorSchema.safeParse(collector);
    const specimenCheck = SpecimenSchema.safeParse(specimen);

    if (
      !speciesCheck.success ||
      !locationCheck.success ||
      !collectorCheck.success ||
      !specimenCheck.success
    ) {
      setSubmitMessage("Validation failed. Please review your inputs.");
      setIsSubmitting(false);
      return;
    }

    console.log({
      species: speciesCheck.data,
      location: locationCheck.data,
      collector: collectorCheck.data,
      specimen: specimenCheck.data,
    });

    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmitMessage("Specimen form is valid and ready to save.");
    setIsSubmitting(false);
  };

  return (
    <Card className="border-border/70 ">
      <CardHeader className="space-y-4">
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Add New Specimen</CardTitle>
              <CardDescription className="mt-1">
                Capture accurate taxonomy, locality, and field details.
              </CardDescription>
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
              {progress}% complete
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex w-full gap-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === index;
            const isCompleted = index < currentStep;

            return (
              <div
                key={step.title}
                className={`rounded-lg border p-3 transition-colors ${
                  isActive
                    ? "border-emerald-300 bg-emerald-50"
                    : isCompleted
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-border/70 bg-card"
                } min-w-0 flex-1`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-7 items-center justify-center rounded-full ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isActive
                          ? "bg-emerald-200 text-emerald-900"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="size-4" /> : <StepIcon className="size-4" />}
                  </div>
                  <p className="text-xs font-semibold">{step.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        <form id="multi-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-border/70 bg-card/80 p-4 sm:p-6">
            {currentStep === 0 && (
              <SpeciesSection
                values={values}
                errors={errors}
                conservationOptions={conservationOptions}
                nativityOptions={nativityOptions}
                onFieldChange={setField}
              />
            )}

            {currentStep === 1 && (
              <LocationSection
                values={values}
                errors={errors}
                onFieldChange={setField}
              />
            )}

            {currentStep === 2 && (
              <CollectorSection
                values={values}
                errors={errors}
                onFieldChange={setField}
              />
            )}

            {currentStep === 3 && (
              <DetailsSection
                values={values}
                errors={errors}
                habitOptions={habitOptions}
                onFieldChange={setField}
              />
            )}

            {currentStep === 4 && <ReviewSection values={values} />}
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/70 bg-muted/20 py-4">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {!isLastStep ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button type="submit" form="multi-form" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Specimen"}
          </Button>
        )}
      </CardFooter>

      {submitMessage ? (
        <p className="px-6 pb-5 text-sm font-medium text-emerald-700">
          {submitMessage}
        </p>
      ) : null}
    </Card>
  );
}
