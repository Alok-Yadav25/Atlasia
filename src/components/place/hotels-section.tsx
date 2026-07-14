import { SectionCard } from "@/components/place/section-card";
import type { Hotel } from "@/types/place";
import { BedDouble, MapPin } from "lucide-react";

interface HotelsSectionProps {
  hotels: Hotel[];
  hasLiveRates: boolean;
}

export function HotelsSection({ hotels, hasLiveRates }: HotelsSectionProps) {
  return (
    <SectionCard id="stay" title="A place to land" eyebrow="Nearby hotels" icon={BedDouble} className="lg:col-span-5">
      {hotels.length > 0 ? (
        <div className="space-y-1">
          {hotels.slice(0, 7).map((hotel) => (
            <article key={hotel.id} className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-muted/55">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/8 text-primary"><BedDouble className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium">{hotel.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="size-3" /> {hotel.distanceKm !== null ? `${hotel.distanceKm.toFixed(1)} km away` : "Nearby"}
                </p>
              </div>
              <p className="max-w-28 text-right text-[11px] font-medium text-muted-foreground">{hotel.priceLabel}</p>
            </article>
          ))}
          {!hasLiveRates && <p className="px-2 pt-3 text-[11px] leading-5 text-muted-foreground">Names come from OpenStreetMap. Add Amadeus keys for approximate live offers.</p>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No named hotels were returned nearby.</p>
      )}
    </SectionCard>
  );
}
