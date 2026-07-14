"use client";

import { FeaturePageShell, jsonFetcher } from "@/components/explore/feature-page-shell";
import { SearchBar } from "@/components/place/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { GalleryData, NatureData, NearbyFeatureData, PlacePhoto } from "@/types/features";
import type { PlaceData } from "@/types/place";
import {
  ArrowRightLeft,
  CircleDashed,
  CloudSun,
  Coins,
  Languages,
  Leaf,
  MapPin,
  PawPrint,
  Soup,
  Sparkles,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

function formatPopulation(value: number | null) {
  if (!value) return "Not listed";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function ComparisonCard({ label, left, right, icon: Icon }: { label: string; left: string; right: string; icon: typeof Users }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}>
      <Card className="overflow-hidden bg-card/70">
        <CardContent className="grid min-h-40 grid-cols-[1fr_auto_1fr] items-center gap-3 p-5 text-center">
          <p className="text-lg font-semibold tracking-tight sm:text-2xl">{left}</p>
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" /></span>
            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase">{label}</span>
          </div>
          <p className="text-lg font-semibold tracking-tight sm:text-2xl">{right}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CyclingPhoto({ photos, fallback, name }: { photos: PlacePhoto[]; fallback: string | null; name: string }) {
  const available = useMemo(() => photos.length ? photos : fallback ? [{ id: fallback, title: name, url: fallback, thumbnailUrl: fallback, sourceUrl: fallback, credit: "Destination image" }] : [], [fallback, name, photos]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (available.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % available.length), 5_200);
    return () => window.clearInterval(timer);
  }, [available.length, name]);

  const activeIndex = available.length ? index % available.length : 0;
  const photo = available[activeIndex];
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[1.6rem] border border-white/10 bg-card">
      <AnimatePresence mode="popLayout">
        {photo && (
          <motion.div key={photo.id} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }} className="absolute inset-0">
            <Image src={photo.thumbnailUrl} alt={`${name} — ${photo.title}`} fill unoptimized sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
        <div><p className="text-2xl font-semibold tracking-tight">{name}</p>{photo && <p className="mt-1 line-clamp-1 text-xs text-white/60">{photo.title}</p>}</div>
        {available.length > 1 && <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] backdrop-blur-xl">{activeIndex + 1}/{available.length}</span>}
      </div>
    </div>
  );
}

function CompareList({ title, icon: Icon, left, right }: { title: string; icon: typeof Soup; left: string[]; right: string[] }) {
  return (
    <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} className="overflow-hidden rounded-[1.75rem] border border-border bg-card/68">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4"><span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" /></span><h3 className="font-semibold">{title}</h3></div>
      <div className="grid md:grid-cols-2">
        {[left, right].map((items, side) => (
          <div key={side} className="space-y-2 border-border p-5 md:[&:first-child]:border-r">
            {items.length ? items.slice(0, 6).map((item, index) => <div key={`${item}-${index}`} className="flex gap-3 rounded-xl bg-background/48 px-3 py-2.5 text-sm"><span className="text-primary">{String(index + 1).padStart(2, "0")}</span><span className="line-clamp-2">{item}</span></div>) : <p className="text-sm text-muted-foreground">No structured results returned.</p>}
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function ExtendedCompare({ primary, secondary }: { primary: PlaceData; secondary: PlaceData }) {
  const dishes = (data: PlaceData) => data.food.slice(0, 5).map((item) => item.name).join("|");
  const { data: primaryGallery } = useSWR<GalleryData>(`/api/gallery?name=${encodeURIComponent(primary.overview.name)}&dishes=${encodeURIComponent(dishes(primary))}`, jsonFetcher, { revalidateOnFocus: false });
  const { data: secondaryGallery } = useSWR<GalleryData>(`/api/gallery?name=${encodeURIComponent(secondary.overview.name)}&dishes=${encodeURIComponent(dishes(secondary))}`, jsonFetcher, { revalidateOnFocus: false });
  const { data: primaryNearby } = useSWR<NearbyFeatureData>(`/api/nearby?name=${encodeURIComponent(primary.overview.name)}`, jsonFetcher, { revalidateOnFocus: false });
  const { data: secondaryNearby } = useSWR<NearbyFeatureData>(`/api/nearby?name=${encodeURIComponent(secondary.overview.name)}`, jsonFetcher, { revalidateOnFocus: false });
  const { data: primaryNature } = useSWR<NatureData>(`/api/nature?name=${encodeURIComponent(primary.overview.name)}`, jsonFetcher, { revalidateOnFocus: false });
  const { data: secondaryNature } = useSWR<NatureData>(`/api/nature?name=${encodeURIComponent(secondary.overview.name)}`, jsonFetcher, { revalidateOnFocus: false });
  const nature = (natureData: NatureData | undefined, nearby: NearbyFeatureData | undefined, category: "flora" | "fauna") => {
    const species = category === "flora" ? natureData?.flora : natureData?.fauna;
    if (species?.length) return species.map((item) => `${item.name} (${item.scientificName}) · ${item.observations.toLocaleString()} observations`);
    const nearbyCategory = category === "flora" ? "flora" : "wildlife";
    return nearby?.landmarks.filter((item) => item.category === nearbyCategory).map((item) => `${item.name} · ${item.distanceKm} km`) ?? [];
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <CyclingPhoto photos={primaryGallery?.photos ?? []} fallback={primary.overview.imageUrl} name={primary.overview.name} />
        <CyclingPhoto photos={secondaryGallery?.photos ?? []} fallback={secondary.overview.imageUrl} name={secondary.overview.name} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ComparisonCard label="Weather" icon={CloudSun} left={primary.weather ? `${primary.weather.temperature}° · ${primary.weather.condition}` : "Unavailable"} right={secondary.weather ? `${secondary.weather.temperature}° · ${secondary.weather.condition}` : "Unavailable"} />
        <ComparisonCard label="Population" icon={Users} left={formatPopulation(primary.overview.population)} right={formatPopulation(secondary.overview.population)} />
        <ComparisonCard label="Currency" icon={Coins} left={primary.currency ? `${primary.currency.symbol} ${primary.currency.code}` : "Unavailable"} right={secondary.currency ? `${secondary.currency.symbol} ${secondary.currency.code}` : "Unavailable"} />
        <ComparisonCard label="Languages" icon={Languages} left={primary.countryDetails.languages.slice(0, 2).join(", ") || "Not listed"} right={secondary.countryDetails.languages.slice(0, 2).join(", ") || "Not listed"} />
        <ComparisonCard label="Places found" icon={MapPin} left={`${Math.max(primary.attractions.length, primary.mapPoints.length)} highlights`} right={`${Math.max(secondary.attractions.length, secondary.mapPoints.length)} highlights`} />
        <ComparisonCard label="Cost index" icon={Sparkles} left={primary.costOfLiving?.index !== null && primary.costOfLiving?.index !== undefined ? `${primary.costOfLiving.index}/100 · ${primary.costOfLiving.label}` : primary.costOfLiving?.label ?? "Flexible"} right={secondary.costOfLiving?.index !== null && secondary.costOfLiving?.index !== undefined ? `${secondary.costOfLiving.index}/100 · ${secondary.costOfLiving.label}` : secondary.costOfLiving?.label ?? "Flexible"} />
      </div>
      <CompareList title="Food worth crossing town for" icon={Soup} left={primary.food.map((item) => `${item.name} — ${item.description}`)} right={secondary.food.map((item) => `${item.name} — ${item.description}`)} />
      <CompareList title="People connected to each place" icon={Users} left={primary.notablePeople.map((person) => `${person.name} · ${person.occupation}${person.party ? ` · ${person.party}` : ""}`)} right={secondary.notablePeople.map((person) => `${person.name} · ${person.occupation}${person.party ? ` · ${person.party}` : ""}`)} />
      <div className="grid gap-4 lg:grid-cols-2">
        <CompareList title="Flora & green spaces" icon={Leaf} left={nature(primaryNature, primaryNearby, "flora")} right={nature(secondaryNature, secondaryNearby, "flora")} />
        <CompareList title="Fauna & protected nature" icon={PawPrint} left={nature(primaryNature, primaryNearby, "fauna")} right={nature(secondaryNature, secondaryNearby, "fauna")} />
      </div>
      <div className="flex flex-wrap justify-center gap-3 pt-3">
        <Link href={`/travel?from=${encodeURIComponent(primary.overview.name)}&to=${encodeURIComponent(secondary.overview.name)}`} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">Plan this route</Link>
        <Link href={`/photos?place=${encodeURIComponent(primary.overview.name)}`} className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-accent">Open photo atlas</Link>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">Weather is live. Population and notable people come from open knowledge sources. Cost is directional context. Flora and fauna use nearby research-grade iNaturalist observations with OpenStreetMap fallbacks.</p>
    </div>
  );
}

function CompareBoard({ primary }: { primary: PlaceData }) {
  const searchParams = useSearchParams();
  const initialSecond = searchParams.get("against")?.trim() ?? "";
  const [secondSearch, setSecondSearch] = useState(initialSecond);
  const [secondPlace, setSecondPlace] = useState(initialSecond);
  const { data: secondary, error, isLoading } = useSWR<PlaceData>(
    secondPlace ? `/api/place?name=${encodeURIComponent(secondPlace)}` : null,
    jsonFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  function chooseSecond(nextPlace: string) {
    const next = nextPlace.trim();
    if (next.length < 2) return;
    setSecondSearch(next);
    setSecondPlace(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("place", `${primary.overview.name}, ${primary.overview.country}`);
    params.set("against", next);
    window.history.replaceState(null, "", `/compare?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      <Card className="border-primary/15 bg-[radial-gradient(circle_at_top_right,var(--weather-glow,rgba(56,189,248,.12)),transparent_45%),var(--card)]">
        <CardHeader>
          <Badge variant="outline" className="w-fit"><ArrowRightLeft className="size-3" /> Second city</Badge>
          <CardTitle className="mt-3 text-2xl tracking-tight">Choose the other side</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchBar id="compare-second-place" value={secondSearch} onValueChange={setSecondSearch} onSearch={chooseSecond} className="max-w-2xl" />
        </CardContent>
      </Card>

      {!secondPlace ? (
        <Card className="border-dashed bg-card/35">
          <CardContent className="p-8 text-center sm:p-12">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary"><CircleDashed className="size-5" /></span>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight">Now choose a city to compare with {primary.overview.name}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">No city is selected automatically. Pick the destination that matters to your trip.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Tokyo, Japan", "Paris, France", "Cape Town, South Africa", "Barcelona, Spain"].filter((item) => !item.toLocaleLowerCase().startsWith(primary.overview.name.toLocaleLowerCase())).map((item) => <Button key={item} variant="outline" size="sm" className="rounded-full" onClick={() => chooseSecond(item)}>{item}</Button>)}
            </div>
          </CardContent>
        </Card>
      ) : error && !secondary ? (
        <Card><CardContent className="p-8 text-sm text-muted-foreground">The second city could not be loaded right now. Try another place or retry in a moment.</CardContent></Card>
      ) : isLoading || !secondary ? (
        <div className="grid gap-4"><Skeleton className="h-72" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div><p className="text-2xl font-semibold sm:text-4xl">{primary.overview.name}</p><p className="mt-1 text-sm text-muted-foreground">{primary.overview.country}</p></div>
            <span className="grid size-11 place-items-center rounded-full border bg-card"><ArrowRightLeft className="size-4 text-primary" /></span>
            <div className="text-right"><p className="text-2xl font-semibold sm:text-4xl">{secondary.overview.name}</p><p className="mt-1 text-sm text-muted-foreground">{secondary.overview.country}</p></div>
          </div>
          <ExtendedCompare primary={primary} secondary={secondary} />
        </>
      )}
    </div>
  );
}

export function CompareExperience() {
  return (
    <FeaturePageShell eyebrow="Side-by-side" title={(place) => `${place}, meet your match`} description="Compare the character of two places through food, people, cost, nature, weather, language and living context.">
      {(data) => <CompareBoard primary={data} />}
    </FeaturePageShell>
  );
}
