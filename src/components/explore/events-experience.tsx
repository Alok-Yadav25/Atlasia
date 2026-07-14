"use client";

import { FeaturePageShell, jsonFetcher } from "@/components/explore/feature-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { addPlannerItem } from "@/lib/planner";
import type { EventItem, EventsData } from "@/types/features";
import type { PlaceData } from "@/types/place";
import { CalendarPlus, ExternalLink, Music2, PartyPopper, Radio, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

const filters = ["all", "sport", "music", "nightlife", "culture", "event-radar"] as const;

function iconFor(category: EventItem["category"]) { return category === "sport" ? Trophy : category === "music" ? Music2 : category === "nightlife" ? PartyPopper : Radio; }

function EventsBoard({ data }: { data: PlaceData }) {
  const { data: eventsData, error, isLoading } = useSWR<EventsData>(`/api/events?name=${encodeURIComponent(data.overview.name)}`, jsonFetcher, { revalidateOnFocus: false, dedupingInterval: 15 * 60_000 });
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  if (error && !eventsData) return <Card><CardContent className="p-8"><h2 className="text-xl font-semibold">The event radar is temporarily quiet.</h2><p className="mt-2 text-sm text-muted-foreground">Your planner and the rest of the guide remain available while this feed recovers.</p></CardContent></Card>;
  if (isLoading || !eventsData) return <Skeleton className="h-[34rem] rounded-3xl" />;
  const events = filter === "all" ? eventsData.events : eventsData.events.filter((event) => event.category === filter);
  const lead = eventsData.events[0];
  function add(event: EventItem) { const date = event.dateIsVerified && event.date ? event.date.slice(0, 10) : new Date().toISOString().slice(0, 10); addPlannerItem({ id: `event-${event.id}`, title: event.title, place: data.overview.name, date, time: event.dateIsVerified && event.date?.includes("T") ? event.date.slice(11, 16) : "", category: "Event", notes: event.dateIsVerified ? `${event.source}${event.venue ? ` · ${event.venue}` : ""}` : "Event radar lead—verify the actual date and venue before going.", sourceUrl: event.url }); toast.success("Added to planner"); }
  return (
    <div className="space-y-10">
      {lead && <motion.section initial={{ clipPath: "inset(45% 45% 45% 45% round 2rem)", opacity: 0 }} animate={{ clipPath: "inset(0% 0% 0% 0% round 2rem)", opacity: 1 }} transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }} className="relative isolate min-h-[34rem] overflow-hidden rounded-3xl border border-white/10 bg-black text-white">{lead.imageUrl && <div className="absolute inset-0 -z-20 bg-cover bg-center opacity-55" style={{ backgroundImage: `url(${lead.imageUrl})` }} />}<div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(0,0,0,.95),rgba(0,0,0,.12)_75%)]" /><div className="flex min-h-[34rem] flex-col justify-end p-6 sm:p-10"><Badge className="w-fit bg-white text-black">Now on the radar</Badge><motion.h2 initial={{ y: 34, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.75, duration: 0.7 }} className="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{lead.title}</motion.h2><p className="mt-4 max-w-2xl text-sm leading-6 text-white/68">{lead.description}</p><div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => add(lead)}><CalendarPlus className="size-4" /> Add to planner</Button><Button asChild variant="outline" className="border-white/20 bg-black/20 text-white hover:bg-white hover:text-black"><a href={lead.url} target="_blank" rel="noreferrer">Open source <ExternalLink className="size-4" /></a></Button></div></div></motion.section>}
      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">{filters.map((value) => <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)} className="shrink-0 capitalize">{value.replace("-", " ")}</Button>)}</div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{events.map((event, index) => { const Icon = iconFor(event.category); return <motion.article key={event.id} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 6) * 0.05 }} viewport={{ once: true }}><Card className="h-full bg-card/72"><CardContent className="flex h-full flex-col p-5"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" /></span><Badge variant="outline" className="capitalize">{event.category.replace("-", " ")}</Badge></div><h3 className="mt-5 text-xl font-semibold tracking-tight">{event.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{event.description}</p><p className="mt-4 text-xs text-muted-foreground">{event.dateIsVerified && event.date ? new Date(event.date).toLocaleString("en", { dateStyle: "medium", timeStyle: event.date.includes("T") ? "short" : undefined }) : "Date needs verification"}{event.venue ? ` · ${event.venue}` : ""}</p><div className="mt-auto flex gap-2 pt-5"><Button size="sm" onClick={() => add(event)}><CalendarPlus className="size-3.5" /> Plan</Button><Button asChild size="sm" variant="ghost"><a href={event.url} target="_blank" rel="noreferrer">Source <ExternalLink className="size-3.5" /></a></Button></div></CardContent></Card></motion.article>; })}</div>
      {!events.length && <Card><CardContent className="p-8 text-center"><PartyPopper className="mx-auto size-6 text-primary" /><h3 className="mt-4 text-xl font-semibold">No event signal in this filter</h3><p className="mt-2 text-sm text-muted-foreground">Try another category or add a dated event-provider key for broader coverage.</p></CardContent></Card>}
      <p className="text-xs leading-5 text-muted-foreground">{eventsData.note}</p>
    </div>
  );
}

export function EventsExperience() {
  return <FeaturePageShell eyebrow="Live city signal" title={(place) => `${place} is already in motion`} description="A cinematic event radar for sport, music, nightlife and culture, with verified dates when a structured provider is available and honest labels when it is not.">{(data) => <EventsBoard data={data} />}</FeaturePageShell>;
}
