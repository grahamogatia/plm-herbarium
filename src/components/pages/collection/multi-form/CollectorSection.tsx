import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import FieldBlock from "./FieldBlock";
import type { FormErrors, FormValues } from "./types";

type Props = {
  values: FormValues;
  errors: FormErrors;
  onCollectorNameChange: (index: number, value: string) => void;
  onAddCollector: () => void;
  onRemoveCollector: (index: number) => void;
};

function CollectorSection({
  values,
  errors,
  onCollectorNameChange,
  onAddCollector,
  onRemoveCollector,
}: Props) {
  return (
    <div className="max-w-2xl space-y-3">
      <FieldBlock
        label="Collector(s)"
        htmlFor="collectorName"
        error={errors.collector_names}
      >
        <div className="space-y-2">
          {values.collector_names.map((collectorName, index) => (
            <div key={`collector-${index}`} className="flex items-center gap-2">
              <Input
                id={`collectorName-${index}`}
                className="h-10"
                value={collectorName}
                onChange={(event) =>
                  onCollectorNameChange(index, event.target.value)
                }
                placeholder={`e.g. Collector ${index + 1}`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onRemoveCollector(index)}
                disabled={values.collector_names.length === 1}
                aria-label={`Remove collector ${index + 1}`}
              >
                <Minus className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </FieldBlock>

      <Button type="button" variant="outline" size="sm" onClick={onAddCollector}>
        <Plus className="size-4" />
        Add another collector
      </Button>
    </div>
  );
}

export default CollectorSection;
