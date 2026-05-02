import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CloudUpload,
  Eye,
  Leaf,
  MapPin,
  Trash2,
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
import {
  getCollectorNames,
  getSpeciesFamilies,
  saveSpecimenEntry,
  uploadSpecimenImage,
  getCollectionRows,
} from "@/api/collection";
import type { FormErrors, FormValues } from "@/components/pages/collection/multi-form/types";
import {
  SpeciesSchema,
} from "@/data/schemas";
import {
  getHerbariumConfig,
  FORM_FIELD_LABELS,
  type FormFieldKey,
  type HerbariumConfig,
} from "@/api/config";

const conservationOptions = SpeciesSchema.shape.conservation_status.unwrap().options;

const initialValues: FormValues = {
  accesssion_no: "",
  scientific_name: "",
  common_name: "",
  family: "",
  conservation_status: "",
  nativity: "",
  country: "Philippines",
  locality: "",
  province: "",
  region: "",
  latitude: "",
  longitude: "",
  collector_names: [""],
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

// Map form fields to their step index
const STEP_FIELDS: Record<number, FormFieldKey[]> = {
  0: ["accesssion_no", "scientific_name", "common_name", "family", "conservation_status", "nativity"],
  1: ["country", "locality", "province", "region", "latitude", "longitude"],
  2: ["collector_names"],
  3: ["date_collected", "habitat", "habit", "altitude_masl", "plant_height_m", "dbh_cm", "flower_description", "fruit_description", "leaf_description", "notes"],
};

/** Convert an accession pattern like "PLMH-#-##-###" into a RegExp (# = digit). */
function accessionPatternToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regexStr = escaped.replace(/#/g, "\\d");
  return new RegExp(`^${regexStr}$`);
}

/** Check if an accession code already exists in the collection (for overlap validation during edit). */
async function checkAccessionCodeOverlap(
  newAccessionCode: string,
  originalAccessionCode?: string
): Promise<boolean> {
  // If the code hasn't changed, no overlap
  if (originalAccessionCode && newAccessionCode === originalAccessionCode) {
    return false;
  }

  try {
    const rows = await getCollectionRows();
    // Check if any existing code matches the new code (excluding the original)
    return rows.some(
      (row) =>
        row.accessionNo === newAccessionCode &&
        row.accessionNo !== originalAccessionCode
    );
  } catch (error) {
    console.error("Error checking accession code overlap:", error);
    // If we can't check, don't block the form (fail open)
    return false;
  }
}

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
    title: "Image",
    description: "Upload specimen photo",
    icon: Camera,
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

const collectorNameFormatPattern =
  /^(?:\p{Lu}\.\s)+(?:\p{L}[\p{L}'-]*)(?:\s+\p{L}[\p{L}'-]*)*$/u;

type SuccessSubmissionSummary = {
  accessionNo: string;
  scientificName: string;
  collectors: string;
};

type MultiFormProps = {
  mode?: "create" | "update";
  initialValues?: FormValues;
  isAccessionReadOnly?: boolean;
};

export function MultiForm({
  mode = "create",
  initialValues: providedInitialValues,
  isAccessionReadOnly = false,
}: MultiFormProps = {}) {
  const { currentUser } = useAuth();
  const resolvedInitialValues = useMemo(
    () => providedInitialValues ?? initialValues,
    [providedInitialValues],
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<FormValues>(resolvedInitialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [successSummary, setSuccessSummary] =
    useState<SuccessSubmissionSummary | null>(null);
  const [familyOptions, setFamilyOptions] = useState<string[]>([]);
  const [collectorOptions, setCollectorOptions] = useState<string[]>([]);
  const [nativityOptions, setNativityOptions] = useState<string[]>(["Native", "Introduced", "Endemic"]);
  const [herbariumConfig, setHerbariumConfig] = useState<HerbariumConfig | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLookups = async () => {
      try {
        const [families, collectors, config] = await Promise.all([
          getSpeciesFamilies(),
          getCollectorNames(),
          getHerbariumConfig(),
        ]);

        if (!isMounted) {
          return;
        }

        setFamilyOptions(families);
        setCollectorOptions(collectors);
        setHerbariumConfig(config);
        setNativityOptions(config.nativityOptions ?? ["Native", "Introduced", "Endemic"]);
      } catch {
        if (!isMounted) {
          return;
        }

        setFamilyOptions([]);
        setCollectorOptions([]);
      }
    };

    void loadLookups();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!successSummary) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setSuccessSummary(null);
    }, 6000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [successSummary]);

  useEffect(() => {
    setValues(resolvedInitialValues);
    setErrors({});
    setSubmitMessage("");
    setSuccessSummary(null);
    setCurrentStep(0);
    handleClearImage();
  }, [resolvedInitialValues]);

  const isLastStep = currentStep === steps.length - 1;
  const progress = useMemo(
    () => Math.round(((currentStep + 1) / steps.length) * 100),
    [currentStep],
  );

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitMessage("");
    setSuccessSummary(null);
  };

  const validateStep = async (step: number): Promise<boolean> => {
    const requiredFields = herbariumConfig?.requiredFields ?? [];
    const stepFields = STEP_FIELDS[step] ?? [];
    const stepErrors: FormErrors = {};

    // Config-driven required field checks
    for (const field of stepFields) {
      if (!requiredFields.includes(field)) continue;

      if (field === "collector_names") {
        const normalized = values.collector_names.map((c) => c.trim()).filter(Boolean);
        if (normalized.length === 0) {
          stepErrors.collector_names = "At least one collector is required.";
        }
      } else if (field === "date_collected") {
        if (!values.date_collected) {
          stepErrors.date_collected = "Date collected is required.";
        }
      } else {
        const val = values[field];
        if (typeof val === "string" && val.trim() === "") {
          stepErrors[field] = `${FORM_FIELD_LABELS[field]} is required.`;
        }
      }
    }

    // Accession pattern validation (step 0)
    if (step === 0 && herbariumConfig?.accessionPattern && values.accesssion_no.trim() !== "") {
      const regex = accessionPatternToRegex(herbariumConfig.accessionPattern);
      if (!regex.test(values.accesssion_no.trim())) {
        stepErrors.accesssion_no =
          stepErrors.accesssion_no ??
          `Must match pattern: ${herbariumConfig.accessionPattern}`;
      }

      // Check for accession code overlap when editing (in update mode)
      if (!stepErrors.accesssion_no && mode === "update" && providedInitialValues) {
        const hasOverlap = await checkAccessionCodeOverlap(
          values.accesssion_no.trim(),
          providedInitialValues.accesssion_no,
        );
        if (hasOverlap) {
          stepErrors.accesssion_no = `Accession code '${values.accesssion_no.trim()}' already exists in the collection.`;
        }
      }
    }

    // Collector name format validation (step 2)
    if (step === 2 && !stepErrors.collector_names) {
      const normalized = values.collector_names.map((c) => c.trim()).filter(Boolean);
      if (normalized.length > 0) {
        const hasInvalidFormat = normalized.some(
          (c) => !collectorNameFormatPattern.test(c),
        );
        if (hasInvalidFormat) {
          stepErrors.collector_names =
            "Use format: I. Surname or I. I. Surname (e.g., A. Dela Cruz or A. B. Dela Cruz).";
        }
      }
    }

    // Latitude / longitude range checks (step 1)
    if (step === 1) {
      if (values.latitude.trim() !== "") {
        const lat = Number(values.latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          stepErrors.latitude = "Latitude must be between -90 and 90.";
        }
      }
      if (values.longitude.trim() !== "") {
        const lon = Number(values.longitude);
        if (isNaN(lon) || lon < -180 || lon > 180) {
          stepErrors.longitude = "Longitude must be between -180 and 180.";
        }
      }
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (!(await validateStep(currentStep))) {
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleCollectorNameChange = (index: number, value: string) => {
    setValues((prev) => {
      const collectorNames = [...prev.collector_names];
      collectorNames[index] = value;
      return {
        ...prev,
        collector_names: collectorNames,
      };
    });
    setErrors((prev) => ({ ...prev, collector_names: undefined }));
    setSubmitMessage("");
  };

  const handleAddCollector = () => {
    setValues((prev) => ({
      ...prev,
      collector_names: [...prev.collector_names, ""],
    }));
    setErrors((prev) => ({ ...prev, collector_names: undefined }));
  };

  const handleRemoveCollector = (index: number) => {
    setValues((prev) => {
      if (prev.collector_names.length <= 1) {
        return prev;
      }

      const collectorNames = prev.collector_names.filter((_, idx) => idx !== index);
      return {
        ...prev,
        collector_names: collectorNames,
      };
    });
    setErrors((prev) => ({ ...prev, collector_names: undefined }));
  };

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleClearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  }

  const handleSubmitClick = async () => {
    if (!isLastStep) {
      return;
    }

    // Re-validate all data steps (0–3) before submission
    for (let step = 0; step <= 3; step++) {
      if (!(await validateStep(step))) {
        setCurrentStep(step);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitMessage("");
    setSuccessSummary(null);

    const normalizedCollectorNames = values.collector_names
      .map((collectorName) => collectorName.trim())
      .filter(Boolean);

    const collectorPayload = normalizedCollectorNames.map((name) => ({ name }));

    try {
      await saveSpecimenEntry({
        species: {
          family: values.family,
          scientific_name: values.scientific_name,
          common_name: values.common_name || undefined,
          conservation_status: values.conservation_status || undefined,
          nativity: values.nativity || undefined,
        },
        location: {
          country: values.country,
          locality: values.locality,
          province: values.province,
          region: values.region,
          latitude: parseOptionalNumber(values.latitude),
          longitude: parseOptionalNumber(values.longitude),
        },
        collectors: collectorPayload,
        specimen: {
          accesssion_no: values.accesssion_no,
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
        },
      }, { mode, performedBy: currentUser?.email ?? "unknown" });

      if (imageFile) {
        await uploadSpecimenImage(values.accesssion_no, imageFile);
      }

      const collectorNames = collectorPayload.map((c) => c.name).join(", ");

      setSuccessSummary({
        accessionNo: values.accesssion_no,
        scientificName: values.scientific_name,
        collectors: collectorNames,
      });
      setSubmitMessage("");
      if (mode === "create") {
        setValues(initialValues);
        setErrors({});
        setCurrentStep(0);
        handleClearImage();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save specimen. Please try again.";
      setSubmitMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/70 ">
      <CardHeader className="space-y-4">
        <div className="rounded-xl border border-zinc-200/60 bg-zinc-50/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Add New Specimen</CardTitle>
              <CardDescription className="mt-1">
                Capture accurate taxonomy, locality, and field details.
              </CardDescription>
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
              {progress}% complete
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full bg-lime-600 transition-all duration-300"
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
                    ? "border-zinc-200 bg-zinc-50"
                    : isCompleted
                      ? "border-zinc-200 bg-zinc-50/40"
                      : "border-border/70 bg-card"
                } min-w-0 flex-1`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-7 items-center justify-center rounded-full ${
                      isCompleted
                        ? "bg-lime-700 text-white"
                        : isActive
                          ? "bg-zinc-200 text-zinc-900"
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
        <form id="multi-form" onSubmit={(event) => event.preventDefault()} className="space-y-5">
          <div className="rounded-xl border border-border/70 bg-card/80 p-4 sm:p-6">
            {currentStep === 0 && (
              <SpeciesSection
                values={values}
                errors={errors}
                familyOptions={familyOptions}
                conservationOptions={conservationOptions}
                nativityOptions={nativityOptions}
                onFieldChange={setField}
                isAccessionReadOnly={isAccessionReadOnly}
                requiredFields={herbariumConfig?.requiredFields ?? []}
                accessionPattern={herbariumConfig?.accessionPattern}
              />
            )}

            {currentStep === 1 && (
              <LocationSection
                values={values}
                errors={errors}
                onFieldChange={setField}
                requiredFields={herbariumConfig?.requiredFields ?? []}
              />
            )}

            {currentStep === 2 && (
              <CollectorSection
                values={values}
                errors={errors}
                collectorOptions={collectorOptions}
                onCollectorNameChange={handleCollectorNameChange}
                onAddCollector={handleAddCollector}
                onRemoveCollector={handleRemoveCollector}
                requiredFields={herbariumConfig?.requiredFields ?? []}
              />
            )}

            {currentStep === 3 && (
              <DetailsSection
                values={values}
                errors={errors}
                onFieldChange={setField}
                requiredFields={herbariumConfig?.requiredFields ?? []}
              />
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Specimen Image</h3>
                  <p className="text-muted-foreground text-sm">
                    Upload a photo of the herbarium specimen. This step is optional.
                  </p>
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                    e.target.value = "";
                  }}
                />

                {!imagePreview ? (
                  <div
                    className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center transition-colors hover:border-lime-400 cursor-pointer"
                    onClick={() => imageInputRef.current?.click()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-50">
                      <CloudUpload className="size-6 text-lime-700" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-zinc-700">
                        Drag & drop an image here
                      </p>
                      <p className="text-xs text-zinc-400">or click to browse files</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto max-h-64 object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-zinc-500">{imageFile?.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500"
                        onClick={handleClearImage}
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 5 && (
              <ReviewSection values={values} imagePreview={imagePreview} />
            )}
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
          <Button type="button" onClick={handleSubmitClick} disabled={isSubmitting}>
            {isSubmitting
              ? mode === "update"
                ? "Saving changes..."
                : "Submitting..."
              : mode === "update"
                ? "Save Changes"
                : "Submit Specimen"}
          </Button>
        )}
      </CardFooter>

      {submitMessage ? (
        <p className="px-6 pb-5 text-sm font-medium text-zinc-700">
          {submitMessage}
        </p>
      ) : null}

      {successSummary ? (
        <div className="fixed bottom-4 right-4 z-50 w-[min(92vw,420px)] rounded-lg border border-lime-200 bg-white p-4 shadow-xl">
          <div className="mb-2 flex items-center gap-2 text-lime-700">
            <Check className="size-4" />
            <p className="text-sm font-semibold">
              {mode === "update"
                ? "Specimen updated successfully"
                : "Specimen submitted successfully"}
            </p>
          </div>
          <div className="space-y-1 text-sm text-slate-700">
            <p>
              <span className="font-medium">Accession Code:</span> {successSummary.accessionNo}
            </p>
            <p>
              <span className="font-medium">Scientific Name:</span> {successSummary.scientificName}
            </p>
            <p>
              <span className="font-medium">Collectors:</span> {successSummary.collectors}
            </p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
