import FullScreen from "@/components/layout/FullScreen";
import { Button } from "@/components/ui/button";
import { TypographyH1 } from "@/components/ui/typography/typographyH1";
import { TypographyH4 } from "@/components/ui/typography/typographyH4";
import { ArrowRight } from "lucide-react";
import sanggumay from "@/assets/sanggumay.jpg";
import narra from "@/assets/narra.png";


function Home() {
  return (
    <div>
      <FullScreen title="Welcome" className="flex-col" background={sanggumay}>
        <div className="flex flex-col items-center text-center gap-6">
          <TypographyH1>
            <p className="text-zinc-50 [text-shadow:0_4px_20px_rgba(0,0,0,0.9)]">
              Pioneering Manila's City University Herbarium
            </p>
          </TypographyH1>
          <TypographyH4>
            <p className="text-zinc-50 [text-shadow:0_4px_20px_rgba(0,0,0,0.9)]">
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
      <FullScreen title="Statistics" background={narra} className="flex">
        <div>side 1</div>
        <div>side 2</div>
      </FullScreen>
      <FullScreen title="Welcome">
        <div>test</div>
      </FullScreen>
    </div>
  );
}

export default Home;
