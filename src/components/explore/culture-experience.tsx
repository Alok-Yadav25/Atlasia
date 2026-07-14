"use client";

import { FeaturePageShell, jsonFetcher } from "@/components/explore/feature-page-shell";
import { OrbitShowcase, type OrbitItem } from "@/components/explore/orbit-showcase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CultureData, CultureItem } from "@/types/features";
import type { PlaceData } from "@/types/place";
import { BookOpenText, Building2, ExternalLink, Film, Landmark, PawPrint, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import useSWR from "swr";

function MediaCard({ item, index }: { item: CultureItem; index: number }) {
  return (
    <motion.article initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 6) * 0.04 }} viewport={{ once: true }}>
      <Card className="group h-full overflow-hidden bg-card/72">
        {item.imageUrl && <div className="h-52 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${item.imageUrl})` }} />}
        <CardContent className="p-5"><Badge variant="outline">{item.kind === "movie" ? <Film className="size-3" /> : <BookOpenText className="size-3" />}{item.kind}</Badge><h3 className="mt-4 text-xl font-semibold tracking-tight">{item.title}</h3><p className="mt-2 text-xs text-muted-foreground">{item.byline}{item.year ? ` · ${item.year}` : ""}</p><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p><Button asChild variant="ghost" className="mt-4 px-0"><a href={item.url} target="_blank" rel="noreferrer">Open source <ExternalLink className="size-3.5" /></a></Button></CardContent>
      </Card>
    </motion.article>
  );
}

function CultureBoard({ data }: { data: PlaceData }) {
  const { data: culture, error, isLoading } = useSWR<CultureData>(`/api/culture?name=${encodeURIComponent(data.overview.name)}`, jsonFetcher, { revalidateOnFocus: false, dedupingInterval: 86_400_000 });
  if (error && !culture) return <Card><CardContent className="p-8"><h2 className="text-xl font-semibold">The culture feed is resting.</h2><p className="mt-2 text-sm text-muted-foreground">The main place guide still works. Retry this page shortly for movies, books and photo connections.</p></CardContent></Card>;
  if (isLoading || !culture) return <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-96" /><Skeleton className="h-96" /><Skeleton className="h-96" /></div>;
  const orbitItems: OrbitItem[] = [
    ...culture.photos.slice(0, 3).map((photo, index) => ({ title: photo.title, subtitle: index === 0 ? "Monument & city detail" : "Architecture & place", icon: index === 2 ? Building2 : Landmark, imageUrl: photo.thumbnailUrl })),
    ...culture.movies.slice(0, 1).map((item) => ({ title: item.title, subtitle: "Screen connection", icon: Film, imageUrl: item.imageUrl })),
    ...culture.books.slice(0, 1).map((item) => ({ title: item.title, subtitle: "Read the place", icon: BookOpenText, imageUrl: item.imageUrl })),
    { title: "Wild side", subtitle: "Zoos, reserves & fauna nearby", icon: PawPrint, imageUrl: culture.photos[5]?.thumbnailUrl },
  ].slice(0, 6);
  return (
    <div className="space-y-16">
      <section><div className="text-center"><Badge variant="outline"><Sparkles className="size-3" /> Orbit view</Badge><h2 className="mt-4 text-3xl font-semibold tracking-tight">A place is more than one landmark</h2></div><OrbitShowcase place={data.overview.name} items={orbitItems} /></section>
      <section><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">On screen</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Movies and filming stories</h2><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{culture.movies.map((item, index) => <MediaCard key={item.id} item={item} index={index} />)}{!culture.movies.length && <p className="text-sm text-muted-foreground">No strong Wikipedia screen connection was returned for this search.</p>}</div></section>
      <section><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">On the page</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Books connected to the place</h2><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{culture.books.map((item, index) => <MediaCard key={item.id} item={item} index={index} />)}{!culture.books.length && <p className="text-sm text-muted-foreground">Open Library did not return a place-tagged book list.</p>}</div></section>
      <p className="text-xs leading-5 text-muted-foreground">Culture connections are discovery leads from Wikipedia and Open Library metadata. A title can mention, depict, be filmed in, or be catalogued with the place; open the source for the exact relationship.</p>
    </div>
  );
}

export function CultureExperience() {
  return <FeaturePageShell eyebrow="Culture lens" title={(place) => `${place}, beyond the postcard`} description="Orbit through architecture, monuments, wildlife signals, films and books—each linked back to an open source so the connection stays inspectable.">{(data) => <CultureBoard data={data} />}</FeaturePageShell>;
}
