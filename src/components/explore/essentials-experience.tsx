"use client";

import { FeaturePageShell } from "@/components/explore/feature-page-shell";
import { useNearby } from "@/components/explore/use-nearby";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlaceData } from "@/types/place";
import { Ambulance, Building2, ExternalLink, Flame, MapPin, Phone, ShieldAlert } from "lucide-react";

function EssentialsBoard({ data }: { data: PlaceData }) {
  const { data: nearby, error, isLoading } = useNearby(data.overview.name);
  if (error && !nearby) return <Card><CardContent className="p-8"><ShieldAlert className="size-5 text-amber-400" /><h2 className="mt-4 text-xl font-semibold">Nearby services could not be checked.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Do not rely on this page during an active emergency. Contact official local emergency services and retry when your connection is stable.</p></CardContent></Card>;
  if (isLoading || !nearby) return <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>;
  const numbers = [
    { label: "General", value: nearby.emergency.general, icon: Phone },
    { label: "Police", value: nearby.emergency.police, icon: ShieldAlert },
    { label: "Ambulance", value: nearby.emergency.ambulance, icon: Ambulance },
    { label: "Fire", value: nearby.emergency.fire, icon: Flame },
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {numbers.map(({ label, value, icon: Icon }) => <Card key={label} className="bg-card/72"><CardContent className="p-5"><span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" /></span><p className="mt-5 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">{label}</p><p className="mt-2 font-mono text-2xl font-semibold">{value ?? "Verify locally"}</p>{value && <Button asChild className="mt-4 w-full" variant="outline"><a href={`tel:${value.split(" ")[0]}`}>Call {label}</a></Button>}</CardContent></Card>)}
      </div>
      <div className="flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/6 p-5 text-sm leading-6 text-muted-foreground"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-400" /><p>{nearby.emergency.note}</p></div>
      <section>
        <div className="flex items-end justify-between"><div><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Medical help nearby</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Hospitals, clinics & pharmacies</h2></div><Badge variant="outline">{nearby.hospitals.length} found</Badge></div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {nearby.hospitals.map((place) => {
            const mapUrl = `https://www.openstreetmap.org/?mlat=${place.coordinates.lat}&mlon=${place.coordinates.lon}#map=17/${place.coordinates.lat}/${place.coordinates.lon}`;
            return <Card key={place.id} className="bg-card/70"><CardHeader className="flex-row items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="size-4" /></span><div className="min-w-0 flex-1"><CardTitle className="truncate text-base">{place.name}</CardTitle><p className="mt-1 flex items-center gap-1 text-xs capitalize text-muted-foreground"><MapPin className="size-3" /> {place.distanceKm} km · {place.category}</p></div><Button asChild size="icon-sm" variant="ghost"><a href={mapUrl} target="_blank" rel="noreferrer" aria-label={`Open ${place.name} on map`}><ExternalLink className="size-4" /></a></Button></CardHeader></Card>;
          })}
          {!nearby.hospitals.length && <Card className="md:col-span-2"><CardContent className="p-6 text-sm text-muted-foreground">No medical facilities were returned by the nearby map query. In an emergency, use official local services rather than waiting for this page.</CardContent></Card>}
        </div>
      </section>
    </div>
  );
}

export function EssentialsExperience() {
  return <FeaturePageShell eyebrow="Travel essentials" title={(place) => `Know your lifelines in ${place}`} description="Emergency reference numbers and nearby medical facilities, clearly separated from real-time emergency guidance.">{(data) => <EssentialsBoard data={data} />}</FeaturePageShell>;
}
