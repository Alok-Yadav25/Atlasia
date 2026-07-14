import { SectionCard } from "@/components/place/section-card";
import type { CostOfLiving } from "@/types/place";
import { CircleDollarSign } from "lucide-react";

interface CostSectionProps {
  cost: CostOfLiving | null;
}

export function CostSection({ cost }: CostSectionProps) {
  return (
    <SectionCard title="Daily spend signal" eyebrow="Cost of living" icon={CircleDollarSign} className="lg:col-span-4">
      {cost ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold tracking-tight">{cost.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">Teleport urban-area estimate</p>
            </div>
            {cost.index !== null && (
              <div className="grid size-16 place-items-center rounded-full border-4 border-primary/25 font-mono text-lg font-semibold">
                {cost.index}
              </div>
            )}
          </div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">{cost.summary}</p>
        </>
      ) : (
        <div className="rounded-xl bg-muted/55 p-4">
          <p className="text-sm font-medium">Estimate unavailable</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Teleport does not cover every place. Keep prices in your itinerary flexible.</p>
        </div>
      )}
    </SectionCard>
  );
}
