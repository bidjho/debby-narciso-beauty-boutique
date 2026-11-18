import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  max,
  className,
  label = "Quantidade",
}: {
  value: number;
  onChange: (v: number) => void;
  max: number | null;
  className?: string;
  label?: string;
}) {
  const atMax = max !== null && value >= max;
  return (
    <div className={cn("inline-flex h-11 items-center rounded-full border border-input bg-card", className)} role="group" aria-label={label}>
      <button
        type="button"
        className="flex h-full w-11 items-center justify-center rounded-l-full text-foreground hover:bg-accent disabled:opacity-40"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Diminuir quantidade"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="flex h-full w-11 items-center justify-center rounded-r-full text-foreground hover:bg-accent disabled:opacity-40"
        onClick={() => onChange(value + 1)}
        disabled={atMax}
        aria-label="Aumentar quantidade"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
