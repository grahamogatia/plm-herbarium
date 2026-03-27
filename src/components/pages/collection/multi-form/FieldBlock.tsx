import type { ReactNode } from "react";

function FieldBlock({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="text-foreground/90 text-[11px] font-semibold uppercase tracking-[0.08em]"
      >
        {label}
      </label>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

export default FieldBlock;
