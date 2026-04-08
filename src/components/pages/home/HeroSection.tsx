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
      className="relative flex-col items-center justify-center"
      background={sanggumay}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex flex-col items-center text-center gap-5 sm:gap-7 px-4 sm:px-10 lg:px-20 max-w-4xl mx-auto">
        <TypographyH1>
          <p className="text-white drop-shadow-lg">
            Pioneering Manila's City University Herbarium
          </p>
        </TypographyH1>
        <TypographyH4>
          <p className="text-zinc-200 text-base sm:text-lg lg:text-xl leading-relaxed">
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