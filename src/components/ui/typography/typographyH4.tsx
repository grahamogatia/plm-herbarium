import type { PropsWithChildren } from "react";

export function TypographyH4({ children }: PropsWithChildren) {
  return (
    <h4 className="scroll-m-20 text-base sm:text-lg lg:text-xl font-light tracking-tight">
      {children}
    </h4>
  )
}
