"use client";

import { FeaturePageShell, jsonFetcher } from "@/components/explore/feature-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PlacePhoto } from "@/types/features";
import type { PlaceData } from "@/types/place";
import { ExternalLink, MessageSquareQuote, Newspaper, PenLine, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import useSWR from "swr";

interface TravelNote { id: string; author: string; quote: string; createdAt: string }

function noteKey(place: string) { return `place-explorer-notes-${place.toLocaleLowerCase()}`; }

function StoriesBoard({ data }: { data: PlaceData }) {
  const { data: media } = useSWR<{ photos: PlacePhoto[] }>(`/api/media?name=${encodeURIComponent(data.overview.name)}`, jsonFetcher, { revalidateOnFocus: false, dedupingInterval: 86_400_000 });
  const [notes, setNotes] = useState<TravelNote[]>([]);
  const [author, setAuthor] = useState("");
  const [quote, setQuote] = useState("");
  const [activeNote, setActiveNote] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setNotes(JSON.parse(localStorage.getItem(noteKey(data.overview.name)) ?? "[]") as TravelNote[]);
      } catch {
        setNotes([]);
      }
      setActiveNote(0);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [data.overview.name]);
  useEffect(() => { if (notes.length < 2) return; const timer = window.setInterval(() => setActiveNote((index) => (index + 1) % notes.length), 5_000); return () => window.clearInterval(timer); }, [notes.length]);
  function save(next: TravelNote[]) { setNotes(next); localStorage.setItem(noteKey(data.overview.name), JSON.stringify(next)); }
  function submit(event: FormEvent) { event.preventDefault(); if (!quote.trim()) return; save([{ id: crypto.randomUUID(), author: author.trim() || "Anonymous traveler", quote: quote.trim(), createdAt: new Date().toISOString() }, ...notes]); setAuthor(""); setQuote(""); setActiveNote(0); toast.success("Travel note saved on this device"); }
  function remove(id: string) { save(notes.filter((note) => note.id !== id)); setActiveNote(0); }

  return (
    <div className="space-y-16">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="relative min-h-[28rem] overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--weather-glow,rgba(56,189,248,.18)),transparent_55%)]" />
          <div className="relative"><Badge variant="outline"><MessageSquareQuote className="size-3" /> Traveler note stack</Badge><h2 className="mt-4 text-3xl font-semibold tracking-tight">Your own field notes</h2><p className="mt-2 text-sm text-muted-foreground">Real notes you add here rotate as a card stack. Nothing is fabricated or published.</p></div>
          <div className="relative mt-8 min-h-56">
            {notes.slice(0, 3).reverse().map((note, index) => <div key={note.id} className="absolute inset-x-4 top-0 h-52 rounded-2xl border border-border bg-background/70" style={{ transform: `translateY(${index * 12}px) scale(${0.94 + index * 0.03})`, opacity: 0.35 + index * 0.2 }} />)}
            <AnimatePresence mode="wait">
              {notes.length ? <motion.article key={notes[activeNote % notes.length]?.id} initial={{ opacity: 0, y: 28, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: -20, rotate: -2 }} transition={{ duration: 0.55 }} className="relative z-10 min-h-52 rounded-2xl border border-primary/15 bg-background p-6 shadow-2xl"><MessageSquareQuote className="size-6 text-primary" /><blockquote className="mt-5 text-pretty text-xl leading-8">“{notes[activeNote % notes.length]?.quote}”</blockquote><div className="mt-5 flex items-center justify-between"><p className="text-sm font-medium">{notes[activeNote % notes.length]?.author}</p><Button size="icon-sm" variant="ghost" onClick={() => remove(notes[activeNote % notes.length]!.id)} aria-label="Delete this note"><Trash2 className="size-4" /></Button></div></motion.article> : <div className="relative z-10 grid min-h-52 place-items-center rounded-2xl border border-dashed border-border bg-background/55 p-6 text-center text-sm text-muted-foreground">Add the first honest note about {data.overview.name}.</div>}
            </AnimatePresence>
          </div>
        </div>
        <Card className="bg-card/75"><CardContent className="p-6 sm:p-8"><Badge variant="outline"><PenLine className="size-3" /> Add a note</Badge><form onSubmit={submit} className="mt-6 space-y-4"><label className="text-xs font-semibold text-muted-foreground">Name<Input className="mt-2" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Optional" /></label><label className="text-xs font-semibold text-muted-foreground">What should you remember?<Textarea className="mt-2 min-h-40" value={quote} onChange={(event) => setQuote(event.target.value.slice(0, 320))} placeholder="The quiet lane behind the market was the best part…" /></label><Button className="w-full"><Plus className="size-4" /> Save note</Button></form></CardContent></Card>
      </section>
      <section><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Animated city journal</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Scroll the story as it unfolds</h2><div className="mt-8 space-y-8">{data.news.map((story, index) => { const image = story.imageUrl ?? media?.photos[index % Math.max(media?.photos.length ?? 1, 1)]?.thumbnailUrl; return <motion.article key={story.id} initial={{ opacity: 0, y: 70 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15%" }} transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }} className="grid overflow-hidden rounded-3xl border border-border bg-card/65 md:grid-cols-2">{image && <div className="min-h-72 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />}<div className="flex flex-col justify-center p-6 sm:p-10"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Newspaper className="size-3.5 text-primary" /> {story.source} · {new Date(story.publishedAt).toLocaleDateString()}</div><h3 className="mt-5 text-balance text-3xl font-semibold tracking-[-0.04em]">{story.title}</h3><p className="mt-4 text-sm leading-7 text-muted-foreground">{story.description}</p><Button asChild variant="ghost" className="mt-5 w-fit px-0"><a href={story.url} target="_blank" rel="noreferrer">Read source <ExternalLink className="size-3.5" /></a></Button></div></motion.article>; })}{!data.news.length && <Card><CardContent className="p-8 text-sm text-muted-foreground">No current editorial feed is available. Your personal note stack still works offline on this device.</CardContent></Card>}</div></section>
    </div>
  );
}

export function StoriesExperience() {
  return <FeaturePageShell eyebrow="City journal" title={(place) => `Read ${place} as it happens`} description="An editorial scroll through current reporting, rotating place imagery and a truthful card stack made only from notes you add yourself.">{(data) => <StoriesBoard data={data} />}</FeaturePageShell>;
}
