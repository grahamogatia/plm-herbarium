import LabelDesc from "@/components/layout/LabelDesc";
import type { SummaryField } from "@/api/config";
import type { Species } from "@/data/types";

type TaxonClassificationProps = {
  species: Species | null;
  visibleFields?: SummaryField[];
};

function TaxonClassification({ species, visibleFields }: TaxonClassificationProps) {
  const genus = species?.scientific_name
    ? species.scientific_name.trim().split(/\s+/)[0]
    : "Loading...";

  const show = (field: SummaryField) => !visibleFields || visibleFields.includes(field);

  return (
    <div className="flex flex-col gap-2">
      {show("family") && (
        <LabelDesc label="Family">{species?.family ?? "Loading..."}</LabelDesc>
      )}
      {show("genus") && (
        <LabelDesc label="Genus">
          <span className="italic">{genus}</span>
        </LabelDesc>
      )}
      {show("species") && (
        <LabelDesc label="Species">
          <div className="italic">
            {species?.scientific_name ?? "Loading..."}
          </div>
        </LabelDesc>
      )}
    </div>
  );
}

export default TaxonClassification;
