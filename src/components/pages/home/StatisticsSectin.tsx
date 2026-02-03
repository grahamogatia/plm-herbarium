import FullScreen from "@/components/layout/FullScreen";
import StatContainer from "@/components/layout/StatContainer";
import { TypographyH1 } from "@/components/ui/typography/typographyH1";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";
import { CircleCheck, Database, SwitchCamera } from "lucide-react";
import statwc from "@/assets/statwc.png";


function StatisticsSection() {
  return (
    <FullScreen title="Statistics" background={statwc}>
      <div className="pt-28 pb-28 pl-20 pr-20 flex flex-col flex-1 h-full">
        <div>
          <TypographyH2>
            <p>Digital Collection</p>
          </TypographyH2>
          <TypographyH1>
            <p className="text-fuchsia-800">569 Specimen</p>
          </TypographyH1>
        </div>
        <div className="pt-10 flex gap-4">
          <StatContainer
            title="Locations"
            icon={<CircleCheck />}
            number={265}
          />
          <StatContainer
            title="Specimens Digitized"
            icon={<Database />}
            number={200}
          />
          <StatContainer
            title="Percent Digitized"
            icon={<SwitchCamera />}
            number="89%"
          />
        </div>
      </div>
      <div className="flex-1"></div>
    </FullScreen>
  );
}

export default StatisticsSection;