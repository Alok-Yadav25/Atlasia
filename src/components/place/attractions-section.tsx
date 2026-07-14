import { SectionCard } from "@/components/place/section-card";
import { Badge } from "@/components/ui/badge";
import type { Attraction } from "@/types/place";
import { ArrowUpRight, Binoculars } from "lucide-react";

interface AttractionsSectionProps {
  attractions: Attraction[];
}

export function AttractionsSection({ attractions }: AttractionsSectionProps) {
  return (
    <SectionCard id="discover" title="Worth the detour" eyebrow="Famous spots" icon={Binoculars} className="lg:col-span-7">
      {attractions.length > 0 ? (
        <ol className="grid gap-1">
          {attractions.slice(0, 7).map((attraction, index) => (
            <li key={attraction.id} className="group grid grid-cols-[2.2rem_1fr_auto] items-start gap-3 rounded-xl px-2 py-3.5 transition hover:bg-muted/55">
              <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{attraction.name}</h3>
                  <Badge variant="secondary" className="h-5 text-[9px] uppercase">{attraction.category}</Badge>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {attraction.description || "A popular point of interest near the city centre."}
                </p>
              </div>
              <ArrowUpRight className="mt-0.5 size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">The attraction guide is unavailable, but the map may still reveal nearby places.</p>
      )}
    </SectionCard>
  );
}
