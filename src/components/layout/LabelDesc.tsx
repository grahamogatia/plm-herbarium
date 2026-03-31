import type { PropsWithChildren } from "react";

interface LabelDescProps {
  label: string;
}

function LabelDesc({ label, children }: PropsWithChildren<LabelDescProps>) {
  return (
    <div>
      <p className="font-semibold text-lime-800">{label}</p>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export default LabelDesc;