import { Input } from "@/components/ui/input";

import FieldBlock from "./FieldBlock";
import type { FormErrors, FormValues } from "./types";

type Props = {
  values: FormValues;
  errors: FormErrors;
  onFieldChange: (key: keyof FormValues, value: string) => void;
};

function LocationSection({ values, errors, onFieldChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FieldBlock label="Locality" htmlFor="locality" error={errors.locality}>
        <Input
          id="locality"
          className="h-10"
          value={values.locality}
          onChange={(event) => onFieldChange("locality", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock label="Province" htmlFor="province" error={errors.province}>
        <Input
          id="province"
          className="h-10"
          value={values.province}
          onChange={(event) => onFieldChange("province", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock label="Region" htmlFor="region" error={errors.region}>
        <Input
          id="region"
          className="h-10"
          value={values.region}
          onChange={(event) => onFieldChange("region", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock label="Latitude" htmlFor="latitude" error={errors.latitude}>
        <Input
          id="latitude"
          className="h-10"
          value={values.latitude}
          onChange={(event) => onFieldChange("latitude", event.target.value)}
        />
      </FieldBlock>

      <FieldBlock label="Longitude" htmlFor="longitude" error={errors.longitude}>
        <Input
          id="longitude"
          className="h-10"
          value={values.longitude}
          onChange={(event) => onFieldChange("longitude", event.target.value)}
        />
      </FieldBlock>
    </div>
  );
}

export default LocationSection;
