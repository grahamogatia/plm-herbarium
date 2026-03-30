import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { PROVINCE_OPTIONS } from "@/data/provinces";
import { REGION_OPTIONS } from "@/data/regions";

import FieldBlock from "./FieldBlock";
import type { FormErrors, FormValues } from "./types";

type Props = {
  values: FormValues;
  errors: FormErrors;
  onFieldChange: (key: keyof FormValues, value: string) => void;
};

const DECIMAL_COORDINATE_PATTERN = /^-?\d*(\.\d*)?$/;

function LocationSection({ values, errors, onFieldChange }: Props) {
  const [provinceQuery, setProvinceQuery] = useState(values.province);
  const [regionQuery, setRegionQuery] = useState(values.region);

  useEffect(() => {
    if (values.country !== "Philippines") {
      onFieldChange("country", "Philippines");
    }
  }, [onFieldChange, values.country]);

  useEffect(() => {
    setProvinceQuery(values.province);
  }, [values.province]);

  useEffect(() => {
    setRegionQuery(values.region);
  }, [values.region]);

  const filteredProvinceOptions = useMemo(() => {
    const normalizedQuery = provinceQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return PROVINCE_OPTIONS;
    }

    return PROVINCE_OPTIONS.filter((province) =>
      province.toLowerCase().includes(normalizedQuery),
    );
  }, [provinceQuery]);

  const filteredRegionOptions = useMemo(() => {
    const normalizedQuery = regionQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return REGION_OPTIONS;
    }

    return REGION_OPTIONS.filter((region) =>
      region.toLowerCase().includes(normalizedQuery),
    );
  }, [regionQuery]);

  const handleCoordinateChange = (key: "latitude" | "longitude", value: string) => {
    if (!DECIMAL_COORDINATE_PATTERN.test(value)) {
      return;
    }

    onFieldChange(key, value);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FieldBlock label="Country" htmlFor="country" error={errors.country}>
          <Input
            id="country"
            className="h-10"
            value="Philippines"
            readOnly
            disabled
          />
        </FieldBlock>
      </div>

      <div className="sm:col-span-2">
        <FieldBlock label="Locality" htmlFor="locality" error={errors.locality}>
          <Textarea
            id="locality"
            className="min-h-20"
            placeholder="e.g. Along the trail to Mt. Apo, Barangay X, 2km NW of the ranger station"
            value={values.locality}
            onChange={(event) => onFieldChange("locality", event.target.value)}
          />
        </FieldBlock>
      </div>

      <FieldBlock label="Province" htmlFor="province" error={errors.province}>
        <Combobox
          value={values.province || null}
          inputValue={provinceQuery}
          onInputValueChange={(inputValue) => setProvinceQuery(inputValue)}
          onValueChange={(value) => onFieldChange("province", value ?? "")}
        >
          <ComboboxInput
            id="province"
            className="h-10 w-full"
            placeholder="Select province"
            showClear
          />
          <ComboboxContent>
            <ComboboxList>
              {provinceQuery.trim() !== "" && filteredProvinceOptions.length === 0 ? (
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  No matching province found.
                </div>
              ) : null}
              {filteredProvinceOptions.map((province) => (
                <ComboboxItem key={province} value={province}>
                  {province}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </FieldBlock>

      <FieldBlock label="Region" htmlFor="region" error={errors.region}>
        <Combobox
          value={values.region || null}
          inputValue={regionQuery}
          onInputValueChange={(inputValue) => setRegionQuery(inputValue)}
          onValueChange={(value) => onFieldChange("region", value ?? "")}
        >
          <ComboboxInput
            id="region"
            className="h-10 w-full"
            placeholder="Select region"
            showClear
          />
          <ComboboxContent>
            <ComboboxList>
              {regionQuery.trim() !== "" && filteredRegionOptions.length === 0 ? (
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  No matching region found.
                </div>
              ) : null}
              {filteredRegionOptions.map((region) => (
                <ComboboxItem key={region} value={region}>
                  {region}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </FieldBlock>

      <FieldBlock label="Latitude" htmlFor="latitude" error={errors.latitude}>
        <Input
          id="latitude"
          className="h-10"
          inputMode="decimal"
          placeholder="e.g. 14.5995"
          value={values.latitude}
          onChange={(event) => handleCoordinateChange("latitude", event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Decimal degrees, range: -90 to 90</p>
      </FieldBlock>

      <FieldBlock label="Longitude" htmlFor="longitude" error={errors.longitude}>
        <Input
          id="longitude"
          className="h-10"
          inputMode="decimal"
          placeholder="e.g. 120.9842"
          value={values.longitude}
          onChange={(event) => handleCoordinateChange("longitude", event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Decimal degrees, range: -180 to 180</p>
      </FieldBlock>
    </div>
  );
}

export default LocationSection;
