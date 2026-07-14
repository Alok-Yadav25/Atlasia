"use client";

import { FeaturePageShell, jsonFetcher } from "@/components/explore/feature-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addPlannerItem, plannerItemToIcs, readPlanner, writePlanner, type PlannerItem } from "@/lib/planner";
import type { RecommendationData } from "@/types/features";
import type { PlaceData } from "@/types/place";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  MapPin,
  Plus,
  Route,
  Sparkles,
  Trash2,
  WalletCards,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import useSWR from "swr";

const categories = ["Sightseeing", "Food", "Stay", "Transport", "Event", "Note"];

interface SmartSuggestion {
  id: string;
  title: string;
  place: string;
  category: string;
  day: number;
  reason: string;
  fit: string;
}

function monthCells(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  return [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function PlannerBoard({ data }: { data: PlaceData }) {
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [category, setCategory] = useState("Sightseeing");
  const [notes, setNotes] = useState("");
  const [stayDays, setStayDays] = useState(4);
  const [totalBudget, setTotalBudget] = useState(900);
  const { data: recommendations } = useSWR<RecommendationData>(
    `/api/recommendations?name=${encodeURIComponent(data.overview.name)}`,
    jsonFetcher,
    { revalidateOnFocus: false, dedupingInterval: 86_400_000 }
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setItems(readPlanner()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const cells = useMemo(() => monthCells(month), [month]);
  const dailyBudget = Math.round(totalBudget / Math.max(stayDays, 1));
  const budgetFit = dailyBudget < 70 ? "Lean days" : dailyBudget < 170 ? "Balanced comfort" : "Flexible comfort";
  const smartSuggestions = useMemo<SmartSuggestion[]>(() => {
    const localStops: SmartSuggestion[] = data.attractions
      .slice(0, Math.min(Math.max(stayDays - 1, 1), 3))
      .map((attraction, index) => ({
        id: `attraction-${attraction.id}`,
        title: attraction.name,
        place: data.overview.name,
        category: "Sightseeing",
        day: index + 1,
        reason: attraction.description || `A notable stop in ${data.overview.name}.`,
        fit: index === 0 ? "Essential local stop" : "Easy to sequence locally",
      }));

    if (stayDays >= 2 && data.food[0]) {
      localStops.push({
        id: `food-${data.food[0].id}`,
        title: `Taste ${data.food[0].name}`,
        place: data.overview.name,
        category: "Food",
        day: Math.min(2, stayDays),
        reason: data.food[0].description,
        fit: dailyBudget < 70 ? "Choose a local market version" : "Leave room for a signature meal",
      });
    }

    if (stayDays < 3 || !recommendations) return localStops.slice(0, 5);

    const nearby = recommendations.nearbyCities;
    const wider = recommendations.youMightLike;
    const placePool = dailyBudget < 90
      ? nearby
      : stayDays >= 7
        ? [...wider, ...nearby]
        : [...nearby, ...wider];
    const destinationCount = stayDays >= 7 ? 3 : stayDays >= 4 ? 2 : 1;
    const destinationStops = placePool.slice(0, destinationCount).map((place, index): SmartSuggestion => {
      const isDayTrip = place.distanceKm <= 220;
      return {
        id: `destination-${place.name}-${place.countryCode}`,
        title: isDayTrip ? `Day trip to ${place.name}` : `Extend the route to ${place.name}`,
        place: `${place.name}, ${place.country}`,
        category: isDayTrip ? "Sightseeing" : "Transport",
        day: Math.min(stayDays, 3 + index * 2),
        reason: `${place.reason}. About ${place.distanceKm.toLocaleString()} km from ${data.overview.name}.`,
        fit: dailyBudget < 90
          ? "Closer route to protect the budget"
          : isDayTrip
            ? "Fits without changing hotels"
            : "Best for a longer multi-city stay",
      };
    });

    return [...localStops, ...destinationStops].slice(0, 7);
  }, [dailyBudget, data.attractions, data.food, data.overview.name, recommendations, stayDays]);

  const visibleItems = items.filter((item) => {
    const parsed = new Date(`${item.date}T00:00:00`);
    return parsed.getMonth() === month.getMonth() && parsed.getFullYear() === month.getFullYear();
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !date) return;
    const item: PlannerItem = { id: crypto.randomUUID(), title: title.trim(), place: data.overview.name, date, time, category, notes: notes.trim() };
    setItems(addPlannerItem(item));
    setTitle("");
    setNotes("");
    toast.success("Added to your planner");
  }

  function addSuggestion(suggestion: SmartSuggestion) {
    const item: PlannerItem = {
      id: crypto.randomUUID(),
      title: suggestion.title,
      place: suggestion.place,
      date: addDays(date, suggestion.day - 1),
      time: "09:00",
      category: suggestion.category,
      notes: `${suggestion.reason} ${suggestion.fit}. Suggested from a ${stayDays}-day, $${totalBudget.toLocaleString()} planning brief.`,
    };
    setItems(addPlannerItem(item));
    toast.success(`${suggestion.title} added to day ${suggestion.day}`);
  }

  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    writePlanner(next);
  }

  function exportItem(item: PlannerItem) {
    const blob = new Blob([plannerItemToIcs(item)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${item.title.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_38%),var(--card)]">
        <CardHeader>
          <Badge variant="outline" className="w-fit"><Sparkles className="size-3" /> Smart trip fit</Badge>
          <CardTitle className="mt-3 text-2xl sm:text-3xl">Recommendations shaped by budget and stay time</CardTitle>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">Set the shape of your trip and Atlasia will mix local essentials with nearby places that fit the time available.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
            <label className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Stay length<Input className="mt-2" type="number" min={1} max={21} value={stayDays} onChange={(event) => setStayDays(Math.min(Math.max(Number(event.target.value) || 1, 1), 21))} /></label>
            <label className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Total budget · USD<Input className="mt-2" type="number" min={100} step={50} value={totalBudget} onChange={(event) => setTotalBudget(Math.max(Number(event.target.value) || 100, 100))} /></label>
            <div className="flex min-w-48 items-center gap-3 rounded-xl border border-border bg-background/55 px-4 py-3"><WalletCards className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">${dailyBudget.toLocaleString()} per day</p><p className="font-semibold">{budgetFit}</p></div></div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {smartSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="group bg-background/50 transition hover:-translate-y-1 hover:border-primary/30">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-center justify-between gap-3"><Badge variant="secondary">Day {suggestion.day}</Badge><span className="text-[10px] font-semibold tracking-wider text-primary uppercase">{suggestion.category}</span></div>
                  <h3 className="mt-4 text-lg font-semibold">{suggestion.title}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" /> {suggestion.place}</p>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{suggestion.reason}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-primary"><Route className="size-3.5" /> {suggestion.fit}</p>
                  <Button variant="outline" className="mt-4 w-full" onClick={() => addSuggestion(suggestion)}><Plus className="size-4" /> Add to day {suggestion.day}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Budget fit is directional planning guidance, not a live quote. Atlasia favours closer extensions for leaner budgets and wider multi-city routes for longer, more flexible trips.</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden bg-card/75">
            <CardHeader className="flex-row items-center justify-between">
              <div><Badge variant="outline"><CalendarDays className="size-3" /> Local calendar</Badge><CardTitle className="mt-3 text-2xl">{month.toLocaleDateString("en", { month: "long", year: "numeric" })}</CardTitle></div>
              <div className="flex gap-2"><Button size="icon" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></Button><Button size="icon" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="size-4" /></Button></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{"Sun Mon Tue Wed Thu Fri Sat".split(" ").map((day) => <span key={day} className="py-2">{day}</span>)}</div>
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-border">{cells.map((day, index) => { const iso = day ? `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : ""; const dayItems = visibleItems.filter((item) => item.date === iso); return <div key={`${day}-${index}`} className="min-h-20 bg-background p-2 sm:min-h-24"><span className="text-xs text-muted-foreground">{day}</span>{dayItems.slice(0, 2).map((item) => <div key={item.id} className="mt-1 truncate rounded bg-primary/12 px-1.5 py-1 text-[9px] font-medium text-primary">{item.title}</div>)}</div>; })}</div>
            </CardContent>
          </Card>

          <section>
            <div className="flex items-end justify-between"><div><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Planner cards</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Your trip, one card at a time</h2></div><Badge variant="outline">{items.length} saved</Badge></div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {items.map((item, index) => <motion.article key={item.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }}><Card className="bg-card/72"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><Badge variant="secondary">{item.category}</Badge><h3 className="mt-3 text-lg font-semibold">{item.title}</h3></div><Button size="icon-sm" variant="ghost" onClick={() => remove(item.id)} aria-label={`Delete ${item.title}`}><Trash2 className="size-4" /></Button></div><p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" /> {item.date} · {item.time || "Any time"}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" /> {item.place}</p>{item.notes && <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.notes}</p>}<Button variant="ghost" className="mt-3 px-0" onClick={() => exportItem(item)}><Download className="size-4" /> Export calendar</Button></CardContent></Card></motion.article>)}
              {!items.length && <Card className="md:col-span-2"><CardContent className="p-8 text-center text-sm text-muted-foreground">Choose a smart recommendation or add your first card manually.</CardContent></Card>}
            </div>
          </section>
        </div>

        <Card className="h-fit bg-card/75 xl:sticky xl:top-32">
          <CardHeader><Badge variant="outline" className="w-fit"><Plus className="size-3" /> New plan</Badge><CardTitle className="mt-3 text-2xl">Add something worth remembering</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <label className="text-xs font-semibold text-muted-foreground">Title<Input className="mt-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sunrise at the fort" /></label>
              <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-muted-foreground">Date<Input className="mt-2" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="text-xs font-semibold text-muted-foreground">Time<Input className="mt-2" type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div>
              <label className="text-xs font-semibold text-muted-foreground">Category<select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-xs font-semibold text-muted-foreground">Notes<Textarea className="mt-2 min-h-28" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Tickets, meeting point, what to bring…" /></label>
              <Button className="w-full" size="lg"><Plus className="size-4" /> Add planner card</Button>
            </form>
            <p className="mt-4 flex gap-2 text-xs leading-5 text-muted-foreground"><Clock3 className="mt-0.5 size-3.5 shrink-0" /> Plans stay in this browser and can be exported to your calendar.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PlannerExperience() {
  return <FeaturePageShell eyebrow="Trip builder" title={(place) => `Shape your days in ${place}`} description="Build a trip around your budget and stay length, then save itinerary cards and export them to your calendar.">{(data) => <PlannerBoard data={data} />}</FeaturePageShell>;
}
