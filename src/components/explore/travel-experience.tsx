"use client";

import { FeaturePageShell, jsonFetcher } from "@/components/explore/feature-page-shell";
import { SearchBar } from "@/components/place/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { TravelData } from "@/types/features";
import type { PlaceData } from "@/types/place";
import { ArrowRight, ExternalLink, Plane, Route, Search, TrainFront } from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function TravelBoard({ data }: { data: PlaceData }) {
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(searchParams.get("from") ?? `${data.overview.name}, ${data.overview.country}`);
  const [to, setTo] = useState(searchParams.get("to") ?? (data.overview.countryCode === "IN" ? "Mumbai, India" : "Paris, France"));
  const [fromValue, setFromValue] = useState(from);
  const [toValue, setToValue] = useState(to);
  const [date, setDate] = useState(() => new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10));
  const [adults, setAdults] = useState(1);
  const [requestKey, setRequestKey] = useState<string | null>(null);

  const { data: travel, error, isLoading } = useSWR<TravelData>(requestKey, jsonFetcher, { revalidateOnFocus: false });
  const search = () => {
    const origin = fromValue.trim();
    const destination = toValue.trim();
    if (!origin || !destination || !date) return;
    setFrom(origin);
    setTo(destination);
    setRequestKey(`/api/travel?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&date=${date}&adults=${adults}`);
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-primary/15 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_45%),var(--card)]">
        <CardHeader><Badge variant="outline" className="w-fit"><Route className="size-3" /> National & international</Badge><CardTitle className="mt-3 text-2xl sm:text-3xl">Build the route, then verify the fare</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid items-end gap-3 lg:grid-cols-[1fr_auto_1fr]">
            <div><label className="mb-2 block text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">From</label><SearchBar id="travel-from" value={fromValue} onValueChange={setFromValue} onSearch={(value) => { setFromValue(value); }} /></div>
            <span className="mb-2 hidden size-10 place-items-center rounded-full border border-border bg-background text-primary lg:grid"><ArrowRight className="size-4" /></span>
            <div><label className="mb-2 block text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">To</label><SearchBar id="travel-to" value={toValue} onValueChange={setToValue} onSearch={(value) => { setToValue(value); }} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
            <div><label htmlFor="travel-date" className="mb-2 block text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Departure</label><Input id="travel-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
            <div><label htmlFor="travel-adults" className="mb-2 block text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Travellers</label><Input id="travel-adults" type="number" min={1} max={9} value={adults} onChange={(event) => setAdults(Math.min(Math.max(Number(event.target.value), 1), 9))} /></div>
            <Button className="self-end" size="lg" onClick={search} disabled={!date}><Search className="size-4" /> Find options</Button>
          </div>
        </CardContent>
      </Card>

      {!requestKey && <div className="rounded-[1.75rem] border border-dashed border-border bg-card/35 p-10 text-center"><Plane className="mx-auto size-8 text-primary" /><h2 className="mt-4 text-xl font-semibold">Where next?</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Choose two places to get flight fare samples when Amadeus is connected, plus reliable handoffs for flights, trains and mixed routes.</p></div>}
      {isLoading && <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-52 rounded-3xl" /><Skeleton className="h-52 rounded-3xl" /></div>}
      {error && <Card><CardContent className="p-6 text-sm text-muted-foreground">{error.message}</CardContent></Card>}
      {travel && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardContent className="p-5"><p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Route</p><p className="mt-3 font-semibold">{travel.international ? "International" : "Domestic"}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Straight-line distance</p><p className="mt-3 font-semibold">{travel.distanceKm.toLocaleString()} km</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Airport pair</p><p className="mt-3 font-semibold">{travel.originIata && travel.destinationIata ? `${travel.originIata} → ${travel.destinationIata}` : "Resolved by provider"}</p></CardContent></Card>
          </div>

          {travel.flightOffers.length > 0 && <section><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Flight samples</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Live offer snapshot</h2></div><Badge variant="outline">Amadeus</Badge></div><div className="mt-5 grid gap-4 md:grid-cols-2">{travel.flightOffers.map((offer) => <Card key={offer.id} className="bg-card/70"><CardContent className="p-5"><div className="flex items-center justify-between gap-4"><span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary"><Plane className="size-4" /></span><p className="text-2xl font-semibold">{offer.currency} {Math.round(offer.price).toLocaleString()}</p></div><p className="mt-5 font-semibold">{offer.carrier} · {offer.stops ? `${offer.stops} stop${offer.stops > 1 ? "s" : ""}` : "Non-stop"}</p><p className="mt-2 text-sm text-muted-foreground">{dateLabel(offer.departure)} → {dateLabel(offer.arrival)}</p><p className="mt-1 text-xs text-muted-foreground">{offer.duration} · {adults} traveller{adults > 1 ? "s" : ""}</p></CardContent></Card>)}</div></section>}

          <section><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Live provider handoff</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Flights, rail and every route between</h2><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{travel.links.map((link) => { const Icon = link.kind === "flight" ? Plane : link.kind === "train" ? TrainFront : Route; return <Card key={link.id} className="group bg-card/70 transition hover:-translate-y-1 hover:border-primary/30"><CardContent className="flex h-full flex-col p-5"><span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" /></span><h3 className="mt-5 text-lg font-semibold">{link.label}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{link.note}</p><Button asChild variant="outline" className="mt-5 w-full"><a href={link.url} target="_blank" rel="noreferrer">Open provider <ExternalLink className="size-3.5" /></a></Button></CardContent></Card>; })}</div></section>
          <p className="rounded-2xl border border-border bg-card/55 p-4 text-xs leading-5 text-muted-foreground">{travel.note}</p>
        </motion.div>
      )}
    </div>
  );
}

export function TravelExperience() {
  return <FeaturePageShell eyebrow="Travel desk" title={(place) => `From ${place} to anywhere`} description="Compare how to move between places, with optional live flight samples and honest handoffs to flight and rail booking providers.">{(data) => <TravelBoard data={data} />}</FeaturePageShell>;
}
