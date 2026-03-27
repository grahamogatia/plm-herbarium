import type { FormValues } from "./types";

type Props = {
  values: FormValues;
};

function ValueRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="grid gap-1 rounded-md border border-border/60 p-3">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.08em]">
        {label}
      </p>
      <p className="text-sm">{value === "" || value == null ? "-" : String(value)}</p>
    </div>
  );
}

function ReviewSection({ values }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Review Details</h3>
        <p className="text-muted-foreground text-sm">
          Confirm all details below before submitting.
        </p>
      </div>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Species</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ValueRow label="Accession Number" value={values.accesssion_no} />
          <ValueRow label="Scientific Name" value={values.scientific_name} />
          <ValueRow label="Common Name" value={values.common_name} />
          <ValueRow label="Family" value={values.family} />
          <ValueRow label="Conservation Status" value={values.conservation_status} />
          <ValueRow label="Nativity" value={values.nativity} />
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Location</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ValueRow label="Locality" value={values.locality} />
          <ValueRow label="Province" value={values.province} />
          <ValueRow label="Region" value={values.region} />
          <ValueRow label="Latitude" value={values.latitude} />
          <ValueRow label="Longitude" value={values.longitude} />
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Collector</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ValueRow
            label="Collector(s)"
            value={values.collector_names.filter(Boolean).join(", ")}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Details</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ValueRow label="Date Collected" value={values.date_collected} />
          <ValueRow label="Habit" value={values.habit} />
          <ValueRow label="Habitat" value={values.habitat} />
          <ValueRow label="Altitude (masl)" value={values.altitude_masl} />
          <ValueRow label="Plant Height (m)" value={values.plant_height_m} />
          <ValueRow label="DBH (cm)" value={values.dbh_cm} />
          <ValueRow label="Flower Description" value={values.flower_description} />
          <ValueRow label="Fruit Description" value={values.fruit_description} />
          <ValueRow label="Leaf Description" value={values.leaf_description} />
          <ValueRow label="Notes" value={values.notes} />
        </div>
      </section>
    </div>
  );
}

export default ReviewSection;
