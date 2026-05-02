import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MultiForm } from "@/data/multi-form.tsx";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";
import {
	getCollectorsByCollectorIds,
	getLocationByLocationId,
	getSpeciesBySpeciesId,
	getSpecimenByAccession,
} from "@/api/collection";
import type { FormValues } from "@/components/pages/collection/multi-form/types";

const emptyFormValues: FormValues = {
	accesssion_no: "",
	scientific_name: "",
	common_name: "",
	family: "",
	conservation_status: "",
	nativity: "",
	country: "Philippines",
	locality: "",
	province: "",
	region: "",
	latitude: "",
	longitude: "",
	collector_names: [""],
	date_collected: "",
	habitat: "",
	habit: "",
	altitude_masl: "",
	plant_height_m: "",
	dbh_cm: "",
	flower_description: "",
	fruit_description: "",
	leaf_description: "",
	notes: "",
};

function toDateInputValue(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function numberToString(value: number | null | undefined): string {
	return typeof value === "number" ? String(value) : "";
}

function UpdateSpecimenPage() {
	const { accessionNo = "" } = useParams();
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [formValues, setFormValues] = useState<FormValues>({
		...emptyFormValues,
		accesssion_no: accessionNo,
	});

	useEffect(() => {
		let isMounted = true;

		const loadSpecimen = async () => {
			setIsLoading(true);
			setErrorMessage(null);

			try {
				const specimen = await getSpecimenByAccession(accessionNo);

				if (!specimen) {
					throw new Error("Specimen not found.");
				}

				const [species, location, collectors] = await Promise.all([
					getSpeciesBySpeciesId(specimen.species_id),
					getLocationByLocationId(specimen.location_id),
					getCollectorsByCollectorIds(specimen.collector_ids ?? []),
				]);

				const nextValues: FormValues = {
					accesssion_no: specimen.accesssion_no,
					scientific_name: species?.scientific_name ?? "",
					common_name: species?.common_name ?? "",
					family: species?.family ?? "",
					conservation_status: species?.conservation_status ?? "",
					nativity: species?.nativity ?? "",
					country: location?.country ?? "Philippines",
					locality: location?.locality ?? "",
					province: location?.province ?? "",
					region: location?.region ?? "",
					latitude: numberToString(location?.latitude),
					longitude: numberToString(location?.longitude),
					collector_names:
						collectors.length > 0
							? collectors.map((collector) => collector.name)
							: [""],
					date_collected: toDateInputValue(specimen.date_collected),
					habitat: specimen.habitat,
					habit: specimen.habit,
					altitude_masl: String(specimen.altitude_masl),
					plant_height_m: String(specimen.plant_height_m),
					dbh_cm: numberToString(specimen.dbh_cm),
					flower_description: specimen.flower_description ?? "",
					fruit_description: specimen.fruit_description ?? "",
					leaf_description: specimen.leaf_description ?? "",
					notes: specimen.notes,
				};

				if (!isMounted) {
					return;
				}

				setFormValues(nextValues);
			} catch (error) {
				if (!isMounted) {
					return;
				}

				const message =
					error instanceof Error
						? error.message
						: "Failed to load specimen for update.";
				setErrorMessage(message);
				setFormValues({
					...emptyFormValues,
					accesssion_no: accessionNo,
				});
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		void loadSpecimen();

		return () => {
			isMounted = false;
		};
	}, [accessionNo]);

	return (
		<>
			<div className="bg-zinc-900 p-4 w-full">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
					<div className="shrink-0 text-zinc-50">
						<TypographyH2>Update Specimen</TypographyH2>
					</div>
				</div>
			</div>
			<div className="min-h-[calc(100dvh-80px)] px-4 py-6 sm:px-6 lg:px-8">
				<div className="mx-auto w-full max-w-5xl space-y-5">
					<Button asChild variant="ghost" className="w-fit">
						<Link to="/collections">
							<ArrowLeft className="size-4" />
							Back to Collection
						</Link>
					</Button>

					{isLoading ? (
						<div className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
							Loading specimen details...
						</div>
					) : null}

					{!isLoading && errorMessage ? (
						<div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
							{errorMessage}
						</div>
					) : null}

					{!isLoading ? (
						<MultiForm
							mode="update"
							initialValues={formValues}
							isAccessionReadOnly={false}
						/>
					) : null}
				</div>
			</div>
		</>
	);
}

export default UpdateSpecimenPage;
