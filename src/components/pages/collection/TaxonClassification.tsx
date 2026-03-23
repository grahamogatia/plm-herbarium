import LabelDesc from "@/components/layout/LabelDesc";
import type { Species } from "@/data/types";

type TaxonClassificationProps = {
  species: Species | null;
};

function TaxonClassification({ species }: TaxonClassificationProps) {
  const genus = species?.scientific_name
    ? species.scientific_name.trim().split(/\s+/)[0]
    : "Loading...";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-15">
        <LabelDesc label="Kingdom">Lorem Ipsum</LabelDesc>
        <LabelDesc label="Family">{species?.family ?? "Loading..."}</LabelDesc>
      </div>
      <div className="flex gap-15">
        <LabelDesc label="Phyllum">Lorem Ipsum</LabelDesc>
        <LabelDesc label="Genus">
          <span className="italic">{genus}</span>
        </LabelDesc>
      </div>
      <div className="flex gap-15">
        <LabelDesc label="Class">Lorem Ipsum</LabelDesc>
        <LabelDesc label="Species">
          <div className="italic">
            {species?.scientific_name ?? "Loading..."}
          </div>
        </LabelDesc>
      </div>
      <LabelDesc label="Order">Lorem Ipsum</LabelDesc>
    </div>
  );
}

export default TaxonClassification;
