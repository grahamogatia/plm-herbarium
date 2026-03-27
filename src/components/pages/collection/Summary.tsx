import LabelDesc from "@/components/layout/LabelDesc";
import type { Collector, Location, Species, Specimen } from "@/data/types";

type SummaryProps = {
	species: Species | null;
	collectors: Collector[];
	specimenLocation: Location | null;
	specimen: Specimen | null;
	formattedDateCollected: string;
};

function Summary({
	species,
	collectors,
	specimenLocation,
	specimen,
	formattedDateCollected,
}: SummaryProps) {
	const collectorsLabel =
		collectors.length > 0
			? collectors.map((collector) => collector.name).join(", ")
			: "Loading...";

	return (
		<div className="flex flex-col gap-2">
			<LabelDesc label="Filed as">
				<span className="italic font-semibold">{species?.family}. </span>
				<span className="italic">{species?.scientific_name ?? "Loading..."}.</span>
			</LabelDesc>
			<LabelDesc label="Collector(s)">
				<span>{collectorsLabel}</span>
			</LabelDesc>
			<LabelDesc label="Date Collected">
				<span>{formattedDateCollected}</span>
			</LabelDesc>
			<LabelDesc label="Locality">
				<span>{specimenLocation?.locality ?? "Loading..."}</span>
			</LabelDesc>
			<LabelDesc label="Accession No.">
				<span>{specimen?.accesssion_no ?? "Loading..."}</span>
			</LabelDesc>
		</div>
	);
}

export default Summary;
