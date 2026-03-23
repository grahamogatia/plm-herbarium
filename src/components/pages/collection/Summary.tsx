import LabelDesc from "@/components/layout/LabelDesc";
import type { Collector, Location, Species, Specimen } from "@/data/types";

type SummaryProps = {
	species: Species | null;
	collector: Collector | null;
	specimenLocation: Location | null;
	specimen: Specimen | null;
	formattedDateCollected: string;
};

function Summary({
	species,
	collector,
	specimenLocation,
	specimen,
	formattedDateCollected,
}: SummaryProps) {
	return (
		<div className="flex flex-col gap-2">
			<LabelDesc label="Filed as">
				<span className="italic font-semibold">{species?.family}. </span>
				<span className="italic">{species?.scientific_name ?? "Loading..."}.</span>
			</LabelDesc>
			<LabelDesc label="Collector(s)">
				<span>{collector?.name ?? "Loading..."}</span>
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
