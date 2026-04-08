import type { ReactNode } from "react";
import { TypographyH1 } from "../ui/typography/typographyH1";

interface StatContainerProps {
  title: string;
  icon: ReactNode;
  number: number | string;
  className?: string;
}

function StatContainer({
  title,
  icon,
  number,
  className = "",
}: StatContainerProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl ${className}`}
    >
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <div className="flex items-center justify-center text-center [&_svg]:size-8 sm:[&_svg]:size-12 text-lime-700">
          {icon}
        </div>
        <TypographyH1>
          <p className="text-2xl sm:text-4xl">{number}</p>
        </TypographyH1>
        <div className="text-sm sm:text-base text-zinc-500">{title}</div>
      </div>
    </div>
  );
}

export default StatContainer;
