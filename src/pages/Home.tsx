import FullScreen from "@/components/layout/FullScreen";
import { Button } from "@/components/ui/button";
import { TypographyH1 } from "@/components/ui/typography/typographyH1";
import { TypographyH4 } from "@/components/ui/typography/typographyH4";
import { ArrowRight, CircleCheck, Database, SwitchCamera } from "lucide-react";
import sanggumay from "@/assets/sanggumay.jpg";
import statwc from "@/assets/statwc.png";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";
import StatContainer from "@/components/layout/StatContainer";

function Home() {
  return (
    <div>
      <FullScreen
        title="Welcome"
        className="flex-col items-center justify-center"
        background={sanggumay}
      >
        <div className="flex flex-col items-center text-center gap-6">
          <TypographyH1>
            <p className="text-zinc-50 [text-shadow:0_4px_20px_rgba(0,0,0,0.9)] backdrop-blur-xs">
              Pioneering Manila's City University Herbarium
            </p>
          </TypographyH1>
          <TypographyH4>
            <p className="text-zinc-50 [text-shadow:0_4px_20px_rgba(0,0,0,0.9)] backdrop-blur-xs">
              The PLM Botanical Herbarium is a university-based herbarium
              located at Pamantasan ng Lungsod ng Maynila, <br />
              Intramuros, Philippines, dedicated to preserving plant and fungal
              specimens primarily gathered <br /> from undergraduate research
              projects and course requirements since 1983.
            </p>
          </TypographyH4>
          <Button className="bg-zinc-200 w-fit text-zinc-950 rounded-4xl  gap-1">
            View Collection <ArrowRight />
          </Button>
        </div>
      </FullScreen>
      <FullScreen
        title="Statistics"
        background={statwc}
      >
        <div className="pt-28 pb-28 flex flex-col flex-1 h-full">
          <div className="pl-20">
            <TypographyH2>
              <p>Digital Collection</p>
            </TypographyH2>
            <TypographyH1>
              <p className="text-teal-800">569 Specimen</p>
            </TypographyH1>
          </div>
          <div className="pt-10 flex justify-center gap-4">
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
      <FullScreen title="Welcome">
        <div>test</div>
      </FullScreen>
    </div>
  );
}

export default Home;
