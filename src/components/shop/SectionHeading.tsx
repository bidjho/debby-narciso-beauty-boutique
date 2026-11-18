import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1 text-gold">{eyebrow}</p>}
        <h2 className="text-3xl font-semibold md:text-4xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
