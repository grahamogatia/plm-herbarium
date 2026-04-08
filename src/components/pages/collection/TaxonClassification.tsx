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
      <div className="grid grid-cols-2 gap-4">
        <LabelDesc label="Kingdom">Lorem Ipsum</LabelDesc>
        {show("family") && (
          <LabelDesc label="Family">{species?.family ?? "Loading..."}</LabelDesc>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <LabelDesc label="Phyllum">Lorem Ipsum</LabelDesc>
        {show("genus") && (
          <LabelDesc label="Genus">
            <span className="italic">{genus}</span>
          </LabelDesc>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <LabelDesc label="Class">Lorem Ipsum</LabelDesc>
        {show("species") && (
          <LabelDesc label="Species">
            <div className="italic">
              {species?.scientific_name ?? "Loading..."}
            </div>
          </LabelDesc>
        )}
      </div>
      <LabelDesc label="Order">Lorem Ipsum</LabelDesc>
    </div>
  );
}

export default TaxonClassification;
