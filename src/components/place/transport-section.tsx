import { SectionCard } from "@/components/place/section-card";
import type { TransportPoint } from "@/types/place";
import { Bus, Plane, Route, TrainFront, TramFront } from "lucide-react";

const transportIcons = {
  airport: Plane,
  rail: TrainFront,
  metro: TrainFront,
  tram: TramFront,
  bus: Bus,
};

interface TransportSectionProps {
  transport: TransportPoint[];
}

export function TransportSection({ transport }: TransportSectionProps) {
  return (
    <SectionCard title="Ways in, out & around" eyebrow="Nearby transport" icon={Route} className="lg:col-span-5">
      {transport.length > 0 ? (
        <div className="space-y-1">
          {transport.slice(0, 8).map((point) => {
            const Icon = transportIcons[point.type];
            return (
              <div key={point.id} className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-muted/55">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/8 text-primary"><Icon className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{point.name}</p>
                  <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">{point.type} connection</p>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">{point.distanceKm.toFixed(1)} km</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">OpenStreetMap did not return named transport stops nearby.</p>
      )}
    </SectionCard>
  );
}
