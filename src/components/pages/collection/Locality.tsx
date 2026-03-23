import LabelDesc from "@/components/layout/LabelDesc";
import type { Location, Specimen } from "@/data/types";

type LocalityProps = {
	specimenLocation: Location | null;
	specimen: Specimen | null;
};

function Locality({ specimenLocation, specimen }: LocalityProps) {
	return (
		<div className="flex flex-col gap-2">
			<LabelDesc label="Locality">
				<span>{specimenLocation?.locality ?? "Loading..."}</span>
			</LabelDesc>
			<LabelDesc label="Province">
				<span>{specimenLocation?.province ?? "Loading..."}</span>
			</LabelDesc>
			<LabelDesc label="Region">
				<span>{specimenLocation?.region ?? "Loading..."}</span>
			</LabelDesc>
			<LabelDesc label="Habitat">
				<span>{specimen?.habitat ?? "Loading..."}</span>
			</LabelDesc>
			<LabelDesc label="Altitude (masl)">
				<span>{specimen?.altitude_masl ?? "Loading..."}</span>
			</LabelDesc>
		</div>
	);
}

export default Locality;
