import FullScreen from "@/components/layout/FullScreen";
import { Button } from "@/components/ui/button";
import { TypographyH1 } from "@/components/ui/typography/typographyH1";
import { TypographyH4 } from "@/components/ui/typography/typographyH4";
import { ArrowRight } from "lucide-react";
import sanggumay from "@/assets/sanggumay.jpg";


function HeroSection() {
  return (
    <FullScreen
      title="Welcome"
      className="flex-col items-center justify-center"
      background={sanggumay}
    >
      <div className="flex flex-col items-center text-center gap-4 sm:gap-6 px-4 sm:px-10 lg:px-20 max-w-4xl mx-auto">
        <TypographyH1>
          <p className="text-zinc-50 [text-shadow:0_4px_20px_rgba(0,0,0,0.9)] backdrop-blur-xs">
            Pioneering Manila's City University Herbarium
          </p>
        </TypographyH1>
        <TypographyH4>
          <p className="text-zinc-50 [text-shadow:0_4px_20px_rgba(0,0,0,0.9)] backdrop-blur-xs text-sm sm:text-base lg:text-lg">
            The PLM Botanical Herbarium is a university-based herbarium located at Pamantasan ng Lungsod ng Maynila, Intramuros, Philippines, dedicated to preserving plant and fungal specimens primarily gathered from undergraduate research projects and course requirements since 1983.
          </p>
        </TypographyH4>
        <Button className="bg-lime-600 w-fit text-white hover:bg-lime-700 rounded-4xl gap-1">
          View Collection <ArrowRight />
        </Button>
      </div>
    </FullScreen>
  );
}

export default HeroSection;