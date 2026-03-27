import { Input } from "@/components/ui/input";

import FieldBlock from "./FieldBlock";
import type { FormErrors, FormValues } from "./types";

type Props = {
  values: FormValues;
  errors: FormErrors;
  conservationOptions: readonly string[];
  nativityOptions: readonly string[];
  onFieldChange: (key: keyof FormValues, value: string) => void;
};

function SpeciesSection({
  values,
  errors,
  conservationOptions,
  nativityOptions,
  onFieldChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FieldBlock
        label="Accession Number"
        htmlFor="accessionNo"
        error={errors.accesssion_no}
      >
        <Input
          id="accessionNo"
          className="h-10"
          value={values.accesssion_no}
          onChange={(event) => onFieldChange("accesssion_no", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock
        label="Scientific Name"
        htmlFor="scientificName"
        error={errors.scientific_name}
      >
        <Input
          id="scientificName"
          className="h-10"
          value={values.scientific_name}
          onChange={(event) => onFieldChange("scientific_name", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock
        label="Common Name"
        htmlFor="commonName"
        error={errors.common_name}
      >
        <Input
          id="commonName"
          className="h-10"
          value={values.common_name}
          onChange={(event) => onFieldChange("common_name", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock label="Family" htmlFor="family" error={errors.family}>
        <Input
          id="family"
          className="h-10"
          value={values.family}
          onChange={(event) => onFieldChange("family", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock
        label="Conservation Status"
        htmlFor="conservation"
        error={errors.conservation_status}
      >
        <select
          id="conservation"
          className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm"
          value={values.conservation_status}
          onChange={(event) =>
            onFieldChange("conservation_status", event.target.value)
          }
        >
          <option value="">Select status</option>
          {conservationOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FieldBlock>

      <FieldBlock label="Nativity" htmlFor="nativity" error={errors.nativity}>
        <select
          id="nativity"
          className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm"
          value={values.nativity}
          onChange={(event) => onFieldChange("nativity", event.target.value)}
        >
          <option value="">Select nativity</option>
          {nativityOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FieldBlock>
    </div>
  );
}

export default SpeciesSection;
