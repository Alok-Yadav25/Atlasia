"use client";

import { FeaturePageShell, jsonFetcher } from "@/components/explore/feature-page-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { GalleryCategory, GalleryData, GalleryPhoto } from "@/types/features";
import type { PlaceData } from "@/types/place";
import { ExternalLink, Images, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

const filters: Array<{ value: "all" | GalleryCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "city", label: "City" },
  { value: "architecture", label: "Architecture" },
  { value: "food", label: "Food" },
  { value: "nature", label: "Nature" },
  { value: "culture", label: "Culture" },
];

function PhotosBoard({ data }: { data: PlaceData }) {
  const dishes = data.food.slice(0, 6).map((item) => item.name).join("|");
  const { data: gallery, isLoading } = useSWR<GalleryData>(`/api/gallery?name=${encodeURIComponent(data.overview.name)}&dishes=${encodeURIComponent(dishes)}`, jsonFetcher, { revalidateOnFocus: false });
  const [filter, setFilter] = useState<"all" | GalleryCategory>("all");
  const [heroIndex, setHeroIndex] = useState(0);
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  const visible = useMemo(() => filter === "all" ? gallery?.photos ?? [] : gallery?.groups[filter] ?? [], [filter, gallery]);

  useEffect(() => {
    if (visible.length < 2) return;
    const timer = window.setInterval(() => setHeroIndex((value) => (value + 1) % visible.length), 4_800);
    return () => window.clearInterval(timer);
  }, [visible.length, filter]);

  if (isLoading) return <div className="space-y-5"><Skeleton className="h-[32rem] rounded-[2rem]" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-56" /><Skeleton className="h-56" /><Skeleton className="h-56" /></div></div>;
  const activeHeroIndex = visible.length ? heroIndex % visible.length : 0;
  const hero = visible[activeHeroIndex];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Photo categories">{filters.map((item) => <Button key={item.value} variant={filter === item.value ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFilter(item.value)}>{item.label}</Button>)}</div>
      {hero ? <section className="relative aspect-[16/10] max-h-[38rem] overflow-hidden rounded-[2rem] border border-white/10 bg-card sm:aspect-[16/8]">
        <AnimatePresence mode="popLayout"><motion.div key={hero.id} initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1 }} className="absolute inset-0"><Image src={hero.thumbnailUrl} alt={`${data.overview.name}: ${hero.title}`} fill priority unoptimized sizes="100vw" className="object-cover" /></motion.div></AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9"><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-white/65 uppercase"><Sparkles className="size-3.5" /> {hero.category}</p><h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">{hero.title}</h2><p className="mt-3 text-xs text-white/55">{activeHeroIndex + 1} of {visible.length} · {hero.credit}</p></div>
      </section> : <div className="rounded-[2rem] border border-dashed border-border p-12 text-center text-muted-foreground"><Images className="mx-auto size-8" /><p className="mt-3">No freely licensed photos were returned for this filter.</p></div>}
      <section className="columns-1 gap-4 sm:columns-2 lg:columns-3">{visible.map((photo, index) => <motion.button key={`${photo.category}-${photo.id}`} type="button" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -6 }} transition={{ delay: Math.min(index * 0.03, 0.25) }} viewport={{ once: true, margin: "-50px" }} onClick={() => setSelected(photo)} className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card text-left"><div className={index % 4 === 0 ? "aspect-[4/5]" : index % 3 === 0 ? "aspect-square" : "aspect-[4/3]"}><Image src={photo.thumbnailUrl} alt={photo.title} unoptimized width={900} height={index % 4 === 0 ? 1125 : 675} className="h-full w-full object-cover transition duration-1000 ease-out group-hover:scale-[1.16]" /></div><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-65 transition group-hover:opacity-100" /><div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"><p className="line-clamp-2 text-sm font-semibold">{photo.title}</p><p className="mt-1 text-[10px] text-white/60">{photo.category}</p></div></motion.button>)}</section>
      {gallery && <p className="text-xs text-muted-foreground">{gallery.note}</p>}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-w-5xl overflow-hidden p-0"><DialogTitle className="sr-only">{selected?.title ?? "Place photo"}</DialogTitle><DialogDescription className="sr-only">Photo from Wikimedia Commons</DialogDescription>{selected && <><div className="relative max-h-[75vh] min-h-[22rem] bg-black"><Image src={selected.url} alt={selected.title} unoptimized width={1600} height={1100} className="max-h-[75vh] w-full object-contain" /></div><div className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold">{selected.title}</p><p className="mt-1 text-xs text-muted-foreground">{selected.credit}</p></div><Button asChild variant="outline" size="sm"><a href={selected.sourceUrl} target="_blank" rel="noreferrer">View source <ExternalLink className="size-3.5" /></a></Button></div></>}</DialogContent></Dialog>
    </div>
  );
}

export function PhotosExperience() {
  return <FeaturePageShell eyebrow="Photo atlas" title={(place) => `${place}, frame by frame`} description="An automatically changing, freely licensed visual atlas of streets, landmarks, culture, nature and food.">{(data) => <PhotosBoard data={data} />}</FeaturePageShell>;
}
