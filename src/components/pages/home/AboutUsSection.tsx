import FullScreen from "@/components/layout/FullScreen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { TypographyH1 } from "@/components/ui/typography/typographyH1";
import { TypographyH2 } from "@/components/ui/typography/typographyH2";
import { TypographyH4 } from "@/components/ui/typography/typographyH4";
import { useState } from "react";
import plmBldg from "@/assets/plm-bldg.png";


function AboutUsSection() {
  const [feedback, setFeedback] = useState("");

  return (
    <FullScreen title="Pamantasan ng Lungsod ng Maynila" className="bg-zinc-50">
      <div className="flex flex-col lg:flex-row w-full">
        <div className="flex flex-col gap-5 px-4 sm:px-10 lg:px-20 py-8 flex-1">
          <TypographyH1>
            <p className="text-zinc-950 italic">Pamantasan ng Lungsod ng Maynila</p>
          </TypographyH1>
          <Card className="h-48 sm:h-64 lg:h-90 overflow-hidden p-0 bg-zinc-50">
            <img
              src={plmBldg}
              alt="PLM Building"
              className="w-full h-full object-cover rounded-lg m-0"
            />
          </Card>
        </div>
        <div className="flex flex-col px-4 sm:px-10 lg:px-20 py-8 flex-1 gap-6">
          <div>
            <TypographyH2>
              <p className="text-zinc-950">About Us</p>
            </TypographyH2>
          </div>
          <div>
            <TypographyH4>
              <p className="text-zinc-950 text-sm">
                The PLM Botanical Herbarium is the official herbarium of
                Pamantasan ng Lungsod ng Maynila - the first city university herbarium in
                Manila. Established to preserve plant and fungal specimens from student
                and faculty research, it serves as a vital for education, biodiversity
                studies, and local conservation efforts.
              </p>
            </TypographyH4>
          </div>
          <div>
            <TypographyH2>
              <p className="text-zinc-950">Contact Us</p>
            </TypographyH2>
          </div>
          <div>
            <TypographyH4>
              <p className="text-zinc-950 text-sm">
              We'd love to hear from you! Whether you have questions about
              our collection, suggestions to improve the system, or feedback about
              your experience using the PLM Botanical Herbarium Collection, our team
              is here to help.
              </p>
            </TypographyH4>
          </div>
          <div className="flex flex-col gap-3">
            <Textarea
              className="bg-zinc-50 h-30"
              placeholder="Leave your feedback here!"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <Button
              className="bg-lime-600 text-white hover:bg-lime-700 w-fit disabled:opacity-50"
              disabled={!feedback}
          >
            Submit Feedback
          </Button>
          </div>
        </div>
      </div>
    </FullScreen>
  );
}

export default AboutUsSection;