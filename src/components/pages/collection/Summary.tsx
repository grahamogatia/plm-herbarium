import LabelDesc from "@/components/layout/LabelDesc";
import type { SummaryField } from "@/api/config";
import type { Collector, Location, Species, Specimen } from "@/data/types";

type SummaryProps = {
	species: Species | null;
	collectors: Collector[];
	specimenLocation: Location | null;
	specimen: Specimen | null;
	formattedDateCollected: string;
	visibleFields?: SummaryField[];
};

const CONSERVATION_LABELS: Record<string, string> = {
	EX: "Extinct",
	EW: "Extinct in the Wild",
	CE: "Critically Endangered",
	EN: "Endangered",
	VU: "Vulnerable",
	NT: "Near Threatened",
	LC: "Least Concern",
};

function Summary({
	species,
	collectors,
	specimenLocation,
	specimen,
	formattedDateCollected,
	visibleFields,
}: SummaryProps) {
	const collectorsLabel =
		collectors.length > 0
			? collectors.map((collector) => collector.name).join(", ")
			: "Loading...";

	const show = (field: SummaryField) => !visibleFields || visibleFields.includes(field);

	return (
		<div className="flex flex-col gap-2">
			{show("filed_as") && (
				<LabelDesc label="Filed as">
					<span className="italic font-semibold">{species?.family}. </span>
					<span className="italic">{species?.scientific_name ?? "Loading..."}.</span>
				</LabelDesc>
			)}
			{show("collectors") && (
				<LabelDesc label="Collector(s)">
					<span>{collectorsLabel}</span>
				</LabelDesc>
			)}
			{show("date_collected") && (
				<LabelDesc label="Date Collected">
					<span>{formattedDateCollected}</span>
				</LabelDesc>
			)}
			{show("locality") && (
				<LabelDesc label="Locality">
					<span>{specimenLocation?.locality ?? "Loading..."}</span>
				</LabelDesc>
			)}
			{show("accession_no") && (
				<LabelDesc label="Accession No.">
					<span>{specimen?.accesssion_no ?? "Loading..."}</span>
				</LabelDesc>
			)}
			{show("common_name") && (
				<LabelDesc label="Common Name">
					<span>{species?.common_name || "—"}</span>
				</LabelDesc>
			)}
			{show("conservation_status") && (
				<LabelDesc label="Conservation Status">
					<span>
						{species?.conservation_status
							? `${species.conservation_status} — ${CONSERVATION_LABELS[species.conservation_status] ?? ""}`
							: "—"}
					</span>
				</LabelDesc>
			)}
			{show("nativity") && (
				<LabelDesc label="Nativity">
					<span>{species?.nativity || "—"}</span>
				</LabelDesc>
			)}
			{show("habitat") && (
				<LabelDesc label="Habitat">
					<span>{specimen?.habitat || "—"}</span>
				</LabelDesc>
			)}
			{show("habit") && (
				<LabelDesc label="Habit">
					<span>{specimen?.habit || "—"}</span>
				</LabelDesc>
			)}
			{show("notes") && (
				<LabelDesc label="Notes">
					<span>{specimen?.notes || "—"}</span>
				</LabelDesc>
			)}
		</div>
	);
}

export default Summary;
