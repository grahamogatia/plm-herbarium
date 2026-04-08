import type { PropsWithChildren } from "react";

export function TypographyH2({ children }: PropsWithChildren) {
  return (
    <h2 className="scroll-m-20 text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
        {children}
    </h2>
  )
}
