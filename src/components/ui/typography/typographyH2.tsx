import type { PropsWithChildren } from "react";

export function TypographyH2({ children }: PropsWithChildren) {
  return (
    <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight text-balance">
        {children}
    </h1>
  )
}
