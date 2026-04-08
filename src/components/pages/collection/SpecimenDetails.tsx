import LabelDesc from "@/components/layout/LabelDesc";
import type { SummaryField } from "@/api/config";
import type { Specimen } from "@/data/types";

type SpecimenDetailsProps = {
  specimen: Specimen | null;
  visibleFields?: SummaryField[];
};

function SpecimenDetails({ specimen, visibleFields }: SpecimenDetailsProps) {
  const show = (field: SummaryField) => !visibleFields || visibleFields.includes(field);

  return (
    <div className="flex flex-col gap-2">
      {show("plant_height") && (
        <LabelDesc label="Plant Height (m)">
          <span>
            {specimen?.plant_height_m != null
              ? `${specimen.plant_height_m} m`
              : "—"}
          </span>
        </LabelDesc>
      )}
      {show("dbh") && (
        <LabelDesc label="DBH (cm)">
          <span>
            {specimen?.dbh_cm != null ? `${specimen.dbh_cm} cm` : "—"}
          </span>
        </LabelDesc>
      )}
      {show("flower_description") && (
        <LabelDesc label="Flower Description">
          <span>{specimen?.flower_description || "—"}</span>
        </LabelDesc>
      )}
      {show("fruit_description") && (
        <LabelDesc label="Fruit Description">
          <span>{specimen?.fruit_description || "—"}</span>
        </LabelDesc>
      )}
      {show("leaf_description") && (
        <LabelDesc label="Leaf Description">
          <span>{specimen?.leaf_description || "—"}</span>
        </LabelDesc>
      )}
    </div>
  );
}

export default SpecimenDetails;
