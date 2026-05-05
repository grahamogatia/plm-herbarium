import { useId, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import FieldBlock from "./FieldBlock";
import type { FormErrors, FormValues } from "./types";
import type { FormFieldKey } from "@/api/config";

type Props = {
  values: FormValues;
  errors: FormErrors;
  onFieldChange: (key: keyof FormValues, value: string) => void;
  requiredFields: FormFieldKey[];
  habitOptions: string[];
  onHabitOptionCreate?: (newHabit: string) => void;
};

function DetailsSection({
  values,
  errors,
  onFieldChange,
  requiredFields,
  habitOptions,
  onHabitOptionCreate,
}: Props) {
  const [habitQuery, setHabitQuery] = useState("");
  const habitInputId = useId();

  const filteredHabitOptions = useMemo(() => {
    const q = habitQuery.trim().toLowerCase();
    if (!q) return habitOptions;
    return habitOptions.filter((o) => o.toLowerCase().includes(q));
  }, [habitOptions, habitQuery]);

  const showCreateOption =
    habitQuery.trim().length > 0 &&
    !habitOptions.some(
      (o) => o.toLowerCase() === habitQuery.trim().toLowerCase(),
    );

  function handleHabitSelect(value: string | null) {
    onFieldChange("habit", value ?? "");
    setHabitQuery("");
  }

  function handleCreateHabit() {
    const trimmed = habitQuery.trim();
    if (!trimmed) return;
    onHabitOptionCreate?.(trimmed);
    onFieldChange("habit", trimmed);
    setHabitQuery("");
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FieldBlock
        label="Date Collected"
        htmlFor="dateCollected"
        error={errors.date_collected}
        required={requiredFields.includes("date_collected")}
      >
        <Input
          id="dateCollected"
          type="date"
          className="h-10"
          value={values.date_collected}
          onChange={(event) => onFieldChange("date_collected", event.target.value)}
        />
      </FieldBlock>

      {/* Habit — creatable combobox */}
      <FieldBlock
        label="Habit"
        htmlFor={habitInputId}
        error={errors.habit}
        required={requiredFields.includes("habit")}
      >
        <Combobox
          value={values.habit || null}
          onValueChange={handleHabitSelect}
        >
          <ComboboxInput
            id={habitInputId}
            className="h-10"
            placeholder="Select or type a habit…"
            value={habitQuery || values.habit}
            onChange={(e) => {
              setHabitQuery(e.target.value);
              if (!e.target.value) onFieldChange("habit", "");
            }}
          />
          <ComboboxContent>
            <ComboboxList>
              {filteredHabitOptions.map((option) => (
                <ComboboxItem key={option} value={option}>
                  {option}
                </ComboboxItem>
              ))}
              {showCreateOption && (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-lime-700 hover:bg-lime-50 transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCreateHabit();
                  }}
                >
                  <Plus className="size-3.5" />
                  Add &quot;{habitQuery.trim()}&quot;
                </button>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </FieldBlock>

      <div className="sm:col-span-2">
        <FieldBlock label="Habitat" htmlFor="habitat" error={errors.habitat} required={requiredFields.includes("habitat")}>
          <Textarea
            id="habitat"
            className="min-h-20"
            value={values.habitat}
            onChange={(event) => onFieldChange("habitat", event.target.value)}
          />
        </FieldBlock>
      </div>

      <FieldBlock
        label="Altitude (masl)"
        htmlFor="altitude"
        error={errors.altitude_masl}
        required={requiredFields.includes("altitude_masl")}
      >
        <Input
          id="altitude"
          type="text"
          placeholder="e.g. 1200, ~800–1000"
          className="h-10"
          value={values.altitude_masl}
          onChange={(event) => onFieldChange("altitude_masl", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock
        label="Plant Height (m)"
        htmlFor="height"
        error={errors.plant_height_m}
        required={requiredFields.includes("plant_height_m")}
      >
        <Input
          id="height"
          type="text"
          placeholder="e.g. 12.5, ~2–3m, <1m"
          className="h-10"
          value={values.plant_height_m}
          onChange={(event) => onFieldChange("plant_height_m", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock label="DBH (cm)" htmlFor="dbh" error={errors.dbh_cm} required={requiredFields.includes("dbh_cm")}>
        <Input
          id="dbh"
          type="text"
          placeholder="e.g. 30.5, ~15–20cm (optional)"
          className="h-10"
          value={values.dbh_cm}
          onChange={(event) => onFieldChange("dbh_cm", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock
        label="Phenophase"
        htmlFor="phenophase"
        error={errors.phenophase}
        required={requiredFields.includes("phenophase")}
      >
        <Input
          id="phenophase"
          type="text"
          placeholder="e.g. Flowering, Fruiting, Vegetative"
          className="h-10"
          value={values.phenophase}
          onChange={(event) => onFieldChange("phenophase", event.target.value)}
        />
      </FieldBlock>

      <div className="sm:col-span-2">
        <FieldBlock label="Flower Description" htmlFor="flower" required={requiredFields.includes("flower_description")}>
          <Textarea
            id="flower"
            className="min-h-20"
            value={values.flower_description}
            onChange={(event) =>
              onFieldChange("flower_description", event.target.value)
            }
          />
        </FieldBlock>
      </div>

      <div className="sm:col-span-2">
        <FieldBlock label="Fruit Description" htmlFor="fruit" required={requiredFields.includes("fruit_description")}>
          <Textarea
            id="fruit"
            className="min-h-20"
            value={values.fruit_description}
            onChange={(event) =>
              onFieldChange("fruit_description", event.target.value)
            }
          />
        </FieldBlock>
      </div>

      <div className="sm:col-span-2">
        <FieldBlock label="Leaf Description" htmlFor="leaf" required={requiredFields.includes("leaf_description")}>
          <Textarea
            id="leaf"
            className="min-h-20"
            value={values.leaf_description}
            onChange={(event) =>
              onFieldChange("leaf_description", event.target.value)
            }
          />
        </FieldBlock>
      </div>

      <div className="sm:col-span-2">
        <FieldBlock label="Notes" htmlFor="notes" error={errors.notes} required={requiredFields.includes("notes")}>
          <Textarea
            id="notes"
            className="min-h-24"
            value={values.notes}
            onChange={(event) => onFieldChange("notes", event.target.value)}
          />
        </FieldBlock>
      </div>
    </div>
  );
}

export default DetailsSection;
