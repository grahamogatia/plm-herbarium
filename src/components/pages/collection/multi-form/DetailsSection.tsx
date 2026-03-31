import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import FieldBlock from "./FieldBlock";
import type { FormErrors, FormValues } from "./types";

type Props = {
  values: FormValues;
  errors: FormErrors;
  onFieldChange: (key: keyof FormValues, value: string) => void;
};

function DetailsSection({
  values,
  errors,
  onFieldChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FieldBlock
        label="Date Collected"
        htmlFor="dateCollected"
        error={errors.date_collected}
        required
      >
        <Input
          id="dateCollected"
          type="date"
          className="h-10"
          value={values.date_collected}
          onChange={(event) => onFieldChange("date_collected", event.target.value)}
        />
      </FieldBlock>

      <div className="sm:col-span-2">
        <FieldBlock label="Habit" htmlFor="habit" error={errors.habit} required>
          <Textarea
            id="habit"
            className="min-h-20"
            placeholder="e.g. Tree with spreading canopy"
            value={values.habit}
            onChange={(event) => onFieldChange("habit", event.target.value)}
          />
        </FieldBlock>
      </div>

      <div className="sm:col-span-2">
        <FieldBlock label="Habitat" htmlFor="habitat" error={errors.habitat}>
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
      >
        <Input
          id="altitude"
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          placeholder="e.g. 1200"
          className="h-10"
          value={values.altitude_masl}
          onChange={(event) => onFieldChange("altitude_masl", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock
        label="Plant Height (m)"
        htmlFor="height"
        error={errors.plant_height_m}
      >
        <Input
          id="height"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="e.g. 12.5"
          className="h-10"
          value={values.plant_height_m}
          onChange={(event) => onFieldChange("plant_height_m", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock label="DBH (cm)" htmlFor="dbh" error={errors.dbh_cm}>
        <Input
          id="dbh"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          placeholder="e.g. 30.5 (optional)"
          className="h-10"
          value={values.dbh_cm}
          onChange={(event) => onFieldChange("dbh_cm", event.target.value)}
        />
      </FieldBlock>

      <div className="sm:col-span-2">
        <FieldBlock label="Flower Description" htmlFor="flower">
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
        <FieldBlock label="Fruit Description" htmlFor="fruit">
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
        <FieldBlock label="Leaf Description" htmlFor="leaf">
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
        <FieldBlock label="Notes" htmlFor="notes" error={errors.notes}>
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
