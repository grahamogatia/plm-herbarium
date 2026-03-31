import { Input } from "@/components/ui/input";
import { useMemo } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import FieldBlock from "./FieldBlock";
import type { FormErrors, FormValues } from "./types";

const CONSERVATION_LABELS: Record<string, string> = {
  EX: "EX – Extinct",
  EW: "EW – Extinct in the Wild",
  CE: "CE – Critically Endangered",
  EN: "EN – Endangered",
  VU: "VU – Vulnerable",
  NT: "NT – Near Threatened",
  LC: "LC – Least Concern",
};

type Props = {
  values: FormValues;
  errors: FormErrors;
  familyOptions: string[];
  conservationOptions: readonly string[];
  nativityOptions: readonly string[];
  onFieldChange: (key: keyof FormValues, value: string) => void;
  isAccessionReadOnly?: boolean;
};

function SpeciesSection({
  values,
  errors,
  familyOptions,
  conservationOptions,
  nativityOptions,
  onFieldChange,
  isAccessionReadOnly = false,
}: Props) {
  const filteredFamilyOptions = useMemo(() => {
    const query = values.family.trim().toLowerCase();
    if (!query) {
      return familyOptions;
    }

    return familyOptions.filter((family) =>
      family.toLowerCase().includes(query),
    );
  }, [familyOptions, values.family]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FieldBlock
        label="Accession Number"
        htmlFor="accessionNo"
        error={errors.accesssion_no}
        required
      >
        <Input
          id="accessionNo"
          className="h-10"
          placeholder="e.g. PLM-2026-001"
          value={values.accesssion_no}
          readOnly={isAccessionReadOnly}
          disabled={isAccessionReadOnly}
          onChange={(event) => onFieldChange("accesssion_no", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock
        label="Scientific Name"
        htmlFor="scientificName"
        error={errors.scientific_name}
        required
      >
        <Input
          id="scientificName"
          className="h-10 italic"
          placeholder="e.g. Ficus benjamina"
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
          placeholder="e.g. Weeping fig"
          value={values.common_name}
          onChange={(event) => onFieldChange("common_name", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock label="Family" htmlFor="family" error={errors.family} required>
        <Combobox
          value={values.family || null}
          inputValue={values.family}
          onInputValueChange={(inputValue) => onFieldChange("family", inputValue)}
          onValueChange={(value) => onFieldChange("family", value ?? "")}
        >
          <ComboboxInput
            id="family"
            className="h-10 w-full italic"
            placeholder="Select or type family"
            showClear
          />
          <ComboboxContent>
            <ComboboxList>
              {values.family.trim() !== "" && filteredFamilyOptions.length === 0 ? (
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  No matching family found. Keep typing to add a new one.
                </div>
              ) : null}
              {filteredFamilyOptions.map((family) => (
                <ComboboxItem key={family} value={family} className="italic">
                  {family}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </FieldBlock>

      <FieldBlock
        label="Conservation Status"
        htmlFor="conservation"
        error={errors.conservation_status}
      >
        <Select
          value={values.conservation_status || undefined}
          onValueChange={(value) => onFieldChange("conservation_status", value)}
        >
          <SelectTrigger id="conservation" className="h-10 w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {conservationOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {CONSERVATION_LABELS[option] ?? option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldBlock>

      <FieldBlock label="Nativity" htmlFor="nativity" error={errors.nativity}>
        <Select
          value={values.nativity || undefined}
          onValueChange={(value) => onFieldChange("nativity", value)}
        >
          <SelectTrigger id="nativity" className="h-10 w-full">
            <SelectValue placeholder="Select nativity" />
          </SelectTrigger>
          <SelectContent>
            {nativityOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldBlock>
    </div>
  );
}

export default SpeciesSection;
