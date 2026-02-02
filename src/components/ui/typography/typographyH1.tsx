import type { PropsWithChildren } from "react";

export function TypographyH1({ children }: PropsWithChildren) {
  return (
    <h1 className="scroll-m-20 text-5xl font-semibold tracking-tight text-balance">
        {children}
    </h1>
  )
}
