import { Input } from "@/components/ui/input";

import FieldBlock from "./FieldBlock";
import type { FormErrors, FormValues } from "./types";

type Props = {
  values: FormValues;
  errors: FormErrors;
  onFieldChange: (key: keyof FormValues, value: string) => void;
};

function CollectorSection({ values, errors, onFieldChange }: Props) {
  return (
    <div className="max-w-md">
      <FieldBlock
        label="Collector Name"
        htmlFor="collectorName"
        error={errors.collector_name}
      >
        <Input
          id="collectorName"
          className="h-10"
          value={values.collector_name}
          onChange={(event) =>
            onFieldChange("collector_name", event.target.value)
          }
          placeholder="e.g. J.D. Smith"
        />
      </FieldBlock>
    </div>
  );
}

export default CollectorSection;
