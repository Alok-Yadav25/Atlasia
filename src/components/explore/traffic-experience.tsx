"use client";

import { FeaturePageShell, jsonFetcher } from "@/components/explore/feature-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrafficData } from "@/types/features";
import type { PlaceData } from "@/types/place";
import { Activity, Bus, Clock3, ExternalLink, Gauge, Navigation, TrainFront } from "lucide-react";
import { motion } from "motion/react";
import useSWR from "swr";

const signalClasses: Record<TrafficData["signal"]["level"], string> = {
  light: "from-emerald-500/24 text-emerald-300",
  moderate: "from-amber-500/24 text-amber-300",
  busy: "from-orange-500/24 text-orange-300",
  heavy: "from-rose-500/24 text-rose-300",
};

function TrafficBoard({ data }: { data: PlaceData }) {
  const { data: traffic, isLoading, error } = useSWR<TrafficData>(`/api/traffic?name=${encodeURIComponent(data.overview.name)}`, jsonFetcher, { refreshInterval: 300_000, revalidateOnFocus: true });
  if (isLoading) return <div className="space-y-4"><Skeleton className="h-72 rounded-[2rem]" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div></div>;
  if (error || !traffic) return <Card><CardContent className="p-8 text-sm text-muted-foreground">Traffic context could not be loaded right now. {error?.message}</CardContent></Card>;

  const time = traffic.localTime.includes("T") ? traffic.localTime.split("T")[1]?.slice(0, 5) : traffic.localTime;
  return (
    <div className="space-y-10">
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br ${signalClasses[traffic.signal.level]} via-card to-card p-7 sm:p-10`}>
        <div className="flex flex-wrap items-start justify-between gap-6"><div><Badge variant="outline" className="border-current/20 bg-black/10"><Activity className="size-3" /> {traffic.provider === "tomtom" ? "Live centre-road flow" : "Planning estimate"}</Badge><h2 className="mt-7 text-4xl font-semibold tracking-tight sm:text-6xl">{traffic.signal.label}</h2><p className="mt-4 max-w-2xl text-base leading-7 text-foreground/68">{traffic.signal.summary}</p></div><div className="grid size-24 place-items-center rounded-full border border-current/20 bg-black/10 backdrop-blur-xl"><Gauge className="size-9" /></div></div>
      </motion.section>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><Clock3 className="size-5 text-primary" /><p className="mt-5 text-xs tracking-[0.16em] text-muted-foreground uppercase">Local time</p><p className="mt-2 text-2xl font-semibold">{time || "Now"}</p></CardContent></Card>
        <Card><CardContent className="p-5"><Navigation className="size-5 text-primary" /><p className="mt-5 text-xs tracking-[0.16em] text-muted-foreground uppercase">Current speed</p><p className="mt-2 text-2xl font-semibold">{traffic.flow ? `${Math.round(traffic.flow.currentSpeedKph)} km/h` : "Add live source"}</p></CardContent></Card>
        <Card><CardContent className="p-5"><Gauge className="size-5 text-primary" /><p className="mt-5 text-xs tracking-[0.16em] text-muted-foreground uppercase">Free-flow speed</p><p className="mt-2 text-2xl font-semibold">{traffic.flow ? `${Math.round(traffic.flow.freeFlowSpeedKph)} km/h` : "Varies by road"}</p></CardContent></Card>
      </div>
      <section><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Live navigation</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Open the road layer you trust</h2><div className="mt-5 flex flex-wrap gap-3">{traffic.mapLinks.map((link) => <Button asChild key={link.url} variant="outline"><a href={link.url} target="_blank" rel="noreferrer">{link.label} <ExternalLink className="size-3.5" /></a></Button>)}</div></section>
      <section><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Alternatives nearby</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Skip the traffic</h2></div><Badge variant="outline">{data.transport.length} stops</Badge></div><div className="mt-5 grid gap-3 md:grid-cols-2">{data.transport.slice(0, 10).map((point) => { const Icon = point.type === "rail" || point.type === "metro" || point.type === "tram" ? TrainFront : Bus; return <Card key={point.id} className="bg-card/65"><CardContent className="flex items-center gap-4 p-4"><span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" /></span><div><p className="font-semibold">{point.name}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{point.type} · {point.distanceKm} km away</p></div></CardContent></Card>; })}</div></section>
      <p className="rounded-2xl border border-border bg-card/55 p-4 text-xs leading-5 text-muted-foreground">{traffic.note}</p>
    </div>
  );
}

export function TrafficExperience() {
  return <FeaturePageShell eyebrow="Traffic pulse" title={(place) => `${place}, in motion`} description="A live traffic signal when configured, a clearly labelled local-time estimate otherwise, and one-click access to live navigation layers.">{(data) => <TrafficBoard data={data} />}</FeaturePageShell>;
}
