"use client";

import { FeaturePageShell } from "@/components/explore/feature-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addPlannerItem, plannerItemToIcs, readPlanner, writePlanner, type PlannerItem } from "@/lib/planner";
import type { PlaceData } from "@/types/place";
import { CalendarDays, ChevronLeft, ChevronRight, Download, MapPin, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

const categories = ["Sightseeing", "Food", "Stay", "Transport", "Event", "Note"];

function monthCells(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  return [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
}

function PlannerBoard({ data }: { data: PlaceData }) {
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [category, setCategory] = useState("Sightseeing");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setItems(readPlanner()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const cells = useMemo(() => monthCells(month), [month]);
  const visibleItems = items.filter((item) => {
    const parsed = new Date(`${item.date}T00:00:00`);
    return parsed.getMonth() === month.getMonth() && parsed.getFullYear() === month.getFullYear();
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !date) return;
    const item: PlannerItem = { id: crypto.randomUUID(), title: title.trim(), place: data.overview.name, date, time, category, notes: notes.trim() };
    setItems(addPlannerItem(item)); setTitle(""); setNotes(""); toast.success("Added to your planner");
  }

  function remove(id: string) { const next = items.filter((item) => item.id !== id); setItems(next); writePlanner(next); }
  function exportItem(item: PlannerItem) { const blob = new Blob([plannerItemToIcs(item)], { type: "text/calendar;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${item.title.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`; anchor.click(); URL.revokeObjectURL(url); }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <div className="space-y-6">
        <Card className="overflow-hidden bg-card/75"><CardHeader className="flex-row items-center justify-between"><div><Badge variant="outline"><CalendarDays className="size-3" /> Local calendar</Badge><CardTitle className="mt-3 text-2xl">{month.toLocaleDateString("en", { month: "long", year: "numeric" })}</CardTitle></div><div className="flex gap-2"><Button size="icon" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></Button><Button size="icon" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="size-4" /></Button></div></CardHeader><CardContent><div className="grid grid-cols-7 text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{"Sun Mon Tue Wed Thu Fri Sat".split(" ").map((day) => <span key={day} className="py-2">{day}</span>)}</div><div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-border">{cells.map((day, index) => { const iso = day ? `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : ""; const dayItems = visibleItems.filter((item) => item.date === iso); return <div key={`${day}-${index}`} className="min-h-20 bg-background p-2 sm:min-h-24"><span className="text-xs text-muted-foreground">{day}</span>{dayItems.slice(0, 2).map((item) => <div key={item.id} className="mt-1 truncate rounded bg-primary/12 px-1.5 py-1 text-[9px] font-medium text-primary">{item.title}</div>)}</div>; })}</div></CardContent></Card>
        <section><div className="flex items-end justify-between"><div><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Planner cards</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Your trip, one card at a time</h2></div><Badge variant="outline">{items.length} saved</Badge></div><div className="mt-6 grid gap-3 md:grid-cols-2">{items.map((item, index) => <motion.article key={item.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }}><Card className="bg-card/72"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><Badge variant="secondary">{item.category}</Badge><h3 className="mt-3 text-lg font-semibold">{item.title}</h3></div><Button size="icon-sm" variant="ghost" onClick={() => remove(item.id)} aria-label={`Delete ${item.title}`}><Trash2 className="size-4" /></Button></div><p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" /> {item.date} · {item.time || "Any time"}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" /> {item.place}</p>{item.notes && <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.notes}</p>}<Button variant="ghost" className="mt-3 px-0" onClick={() => exportItem(item)}><Download className="size-4" /> Export calendar</Button></CardContent></Card></motion.article>)}{!items.length && <Card className="md:col-span-2"><CardContent className="p-8 text-center text-sm text-muted-foreground">Your first card will appear here and stay on this device.</CardContent></Card>}</div></section>
      </div>
      <Card className="h-fit bg-card/75 xl:sticky xl:top-32"><CardHeader><Badge variant="outline" className="w-fit"><Plus className="size-3" /> New plan</Badge><CardTitle className="mt-3 text-2xl">Add something worth remembering</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><label className="text-xs font-semibold text-muted-foreground">Title<Input className="mt-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sunrise at the fort" /></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-muted-foreground">Date<Input className="mt-2" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="text-xs font-semibold text-muted-foreground">Time<Input className="mt-2" type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div><label className="text-xs font-semibold text-muted-foreground">Category<select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-xs font-semibold text-muted-foreground">Notes<Textarea className="mt-2 min-h-28" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Tickets, meeting point, what to bring…" /></label><Button className="w-full" size="lg"><Plus className="size-4" /> Add planner card</Button></form><p className="mt-4 text-xs leading-5 text-muted-foreground">This MVP stores plans in your browser. Account sync can be added later with Supabase.</p></CardContent></Card>
    </div>
  );
}

export function PlannerExperience() {
  return <FeaturePageShell eyebrow="Trip builder" title={(place) => `Shape your days in ${place}`} description="A working local calendar, itinerary cards and one-click calendar exports—no account required for the first plan.">{(data) => <PlannerBoard data={data} />}</FeaturePageShell>;
}
