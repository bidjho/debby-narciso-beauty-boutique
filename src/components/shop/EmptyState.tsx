import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-gradient-blush px-6 py-14 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-card text-primary shadow-soft">
        {icon ?? <Sparkles className="size-6" aria-hidden />}
      </div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
