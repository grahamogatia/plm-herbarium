import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

import FieldBlock from "./FieldBlock";
import type { FormErrors, FormValues } from "./types";

type Props = {
  values: FormValues;
  errors: FormErrors;
  collectorOptions: string[];
  onCollectorNameChange: (index: number, value: string) => void;
  onAddCollector: () => void;
  onRemoveCollector: (index: number) => void;
};

function CollectorSection({
  values,
  errors,
  collectorOptions,
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
        required
      >
        <p className="text-xs text-muted-foreground">
          Format: A. Surname or A. B. Surname
        </p>
        <div className="space-y-2">
          {values.collector_names.map((collectorName, index) => (
            <div key={`collector-${index}`} className="flex items-center gap-2">
              <Combobox
                value={collectorName || null}
                inputValue={collectorName}
                onInputValueChange={(inputValue) =>
                  onCollectorNameChange(index, inputValue)
                }
                onValueChange={(value) => onCollectorNameChange(index, value ?? "")}
              >
                <ComboboxInput
                  id={`collectorName-${index}`}
                  className="h-10 w-full"
                  placeholder="e.g. A. B. Dela Cruz"
                  showClear
                />
                <ComboboxContent>
                  <ComboboxList>
                    {collectorName.trim() !== "" &&
                    collectorOptions.filter((existingCollector) =>
                      existingCollector
                        .toLowerCase()
                        .includes(collectorName.trim().toLowerCase()),
                    ).length === 0 ? (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        No matching collector found. Keep typing to add a new one.
                      </div>
                    ) : null}
                    {collectorOptions
                      .filter((existingCollector) =>
                        existingCollector
                          .toLowerCase()
                          .includes(collectorName.trim().toLowerCase()),
                      )
                      .map((existingCollector) => (
                        <ComboboxItem key={existingCollector} value={existingCollector}>
                          {existingCollector}
                        </ComboboxItem>
                      ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
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
