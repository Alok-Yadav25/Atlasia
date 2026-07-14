"use client";

import { FeaturePageShell } from "@/components/explore/feature-page-shell";
import { useNearby } from "@/components/explore/use-nearby";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Hotel, PlaceData } from "@/types/place";
import { BedDouble, ExternalLink, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";

function StayBoard({ data }: { data: PlaceData }) {
  const { data: nearby, isLoading } = useNearby(data.overview.name);
  const seen = new Set<string>();
  const hotels: Hotel[] = [...data.hotels, ...(nearby?.hotels ?? [])].filter((hotel) => {
    const key = hotel.name.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 24);

  if (isLoading) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-52 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><Badge variant="outline">{hotels.length} named stays</Badge><h2 className="mt-3 text-3xl font-semibold tracking-tight">A better place to land</h2></div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">OpenStreetMap finds nearby properties. Live price and room availability appear only when Amadeus returns an offer.</p>
      </div>
      {hotels.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel, index) => {
            const availabilityUrl = `https://www.google.com/travel/hotels?q=${encodeURIComponent(`${hotel.name}, ${data.overview.name}`)}`;
            return (
              <motion.article key={hotel.id} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04 }} viewport={{ once: true }}>
                <Card className="group h-full overflow-hidden bg-card/72 transition hover:-translate-y-1 hover:border-primary/30">
                  <CardContent className="flex h-full flex-col p-5">
                    <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><BedDouble className="size-5" /></span>
                    <h3 className="mt-5 text-xl font-semibold tracking-tight">{hotel.name}</h3>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" /> {hotel.distanceKm !== null ? `${hotel.distanceKm.toFixed(1)} km from centre` : data.overview.name}</p>
                    <div className="mt-5 rounded-xl bg-muted/50 p-3 text-sm font-medium">{hotel.priceLabel}</div>
                    <Button asChild className="mt-5 w-full" variant="outline"><a href={availabilityUrl} target="_blank" rel="noreferrer">Check availability <ExternalLink className="size-3.5" /></a></Button>
                  </CardContent>
                </Card>
              </motion.article>
            );
          })}
        </div>
      ) : (
        <Card><CardContent className="p-8"><Sparkles className="size-5 text-primary" /><h3 className="mt-4 text-xl font-semibold">No nearby listing returned</h3><p className="mt-2 text-sm text-muted-foreground">The map provider may be busy. Use the live hotel search while this source recovers.</p><Button asChild className="mt-5"><a href={`https://www.google.com/travel/hotels?q=${encodeURIComponent(data.overview.name)}`} target="_blank" rel="noreferrer">Search stays <ExternalLink className="size-4" /></a></Button></CardContent></Card>
      )}
      <div className="flex gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-5 text-sm leading-6 text-muted-foreground"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><p>Prices are indicative and can exclude taxes or fees. Verify cancellation rules and the final total with the booking provider before paying.</p></div>
    </div>
  );
}

export function StayExperience() {
  return <FeaturePageShell eyebrow="Stay finder" title={(place) => `Sleep well in ${place}`} description="Named hotels, distance from the centre and a direct path to current availability—without pretending a map listing is a confirmed room.">{(data) => <StayBoard data={data} />}</FeaturePageShell>;
}
