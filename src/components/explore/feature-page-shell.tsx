"use client";

import { BlurTitle } from "@/components/explore/blur-title";
import { FeatureNav } from "@/components/explore/feature-nav";
import { SearchBar } from "@/components/place/search-bar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlacePhoto } from "@/types/features";
import type { PlaceData } from "@/types/place";
import { AnimatePresence, motion, useScroll } from "motion/react";
import { ArrowRight, CloudSun, Globe2, MapPin, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import useSWR from "swr";

async function jsonFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "This place could not be loaded.");
  return body;
}

interface FeaturePageShellProps {
  eyebrow: string;
  title: (placeName: string) => string;
  description: string;
  children: (data: PlaceData, place: string) => ReactNode;
}

export function FeaturePageShell({ eyebrow, title, description, children }: FeaturePageShellProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const place = searchParams.get("place")?.trim() || searchParams.get("from")?.trim() || "";
  const [selection, setSelection] = useState("");
  const { scrollYProgress } = useScroll();
  const { data, error, isLoading } = useSWR<PlaceData>(
    place ? `/api/place?name=${encodeURIComponent(place)}` : null,
    jsonFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const { data: media } = useSWR<{ photos: PlacePhoto[] }>(
    place ? `/api/media?name=${encodeURIComponent(data?.overview.name ?? place)}` : null,
    jsonFetcher,
    { revalidateOnFocus: false, dedupingInterval: 86_400_000 }
  );
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = media?.photos ?? [];

  useEffect(() => {
    if (photos.length < 2) return;
    const timer = window.setInterval(() => setPhotoIndex((index) => (index + 1) % photos.length), 7_000);
    return () => window.clearInterval(timer);
  }, [photos.length]);

  function choosePlace(nextPlace: string) {
    const next = nextPlace.trim();
    if (next.length < 2) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set(pathname === "/travel" ? "from" : "place", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (!place) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#05070b] text-white">
        <FeatureNav place="" />
        <section className="relative isolate grid min-h-[calc(100vh-7rem)] place-items-center px-4 py-20 text-center sm:px-6">
          <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,.16),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(168,85,247,.1),transparent_25%),#05070b]" />
          <div className="mx-auto w-full max-w-4xl">
            <span className="mx-auto grid size-14 place-items-center rounded-full border border-white/10 bg-white/5 text-cyan-300"><Globe2 className="size-6" /></span>
            <p className="mt-8 text-xs font-semibold tracking-[0.26em] text-cyan-300 uppercase">{eyebrow}</p>
            <h1 className="mt-4 text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-7xl">Start with a place, then let Atlasia connect the rest.</h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-white/55 sm:text-lg">{description}</p>
            <div className="mx-auto mt-10 max-w-2xl"><SearchBar id={`feature-place-${pathname.replaceAll("/", "-") || "home"}`} value={selection} onValueChange={setSelection} onSearch={choosePlace} /></div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["Tokyo, Japan", "Paris, France", "Cape Town, South Africa", "Barcelona, Spain"].map((item) => <button key={item} type="button" onClick={() => choosePlace(item)} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/58 transition hover:border-white/25 hover:bg-white/10 hover:text-white">{item}<ArrowRight className="size-3" /></button>)}
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-background">
        <FeatureNav place={place} />
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-3xl font-semibold">This route went quiet.</h1>
          <p className="mt-3 text-muted-foreground">{error.message}</p>
        </div>
      </main>
    );
  }

  if (isLoading || !data) {
    return (
      <main className="min-h-screen bg-background">
        <FeatureNav place={place} />
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-16 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 max-w-4xl" />
          <Skeleton className="h-[28rem] w-full rounded-3xl" />
        </div>
      </main>
    );
  }

  const activePhoto = photos[photoIndex]?.thumbnailUrl ?? data.overview.imageUrl;

  return (
    <main className="min-h-screen overflow-clip bg-background text-foreground">
      <motion.div className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-primary" style={{ scaleX: scrollYProgress }} />
      <FeatureNav place={place} />
      <section className="relative isolate overflow-hidden border-b border-border/70 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <AnimatePresence mode="popLayout">
          {activePhoto && (
            <motion.div
              key={activePhoto}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 0.34, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 -z-20 bg-cover bg-center"
              style={{ backgroundImage: `url(${JSON.stringify(activePhoto).slice(1, -1)})` }}
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--background)_8%,color-mix(in_oklab,var(--background)_78%,transparent)_58%,var(--background)_100%),linear-gradient(0deg,var(--background),transparent_70%)]" />
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-white/12 bg-black/20 text-white backdrop-blur-xl"><MapPin className="size-3" /> {data.overview.country}</Badge>
            {data.weather && <Badge variant="outline" className="border-white/12 bg-black/20 text-white backdrop-blur-xl"><CloudSun className="size-3" /> {data.weather.temperature}° · {data.weather.condition}</Badge>}
          </div>
          <p className="mt-10 flex items-center gap-2 text-xs font-semibold tracking-[0.26em] text-primary uppercase"><Sparkles className="size-3.5" /> {eyebrow}</p>
          <BlurTitle className="mt-4 max-w-5xl text-balance text-5xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-7xl lg:text-[6rem]">
            {title(data.overview.name)}
          </BlurTitle>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">{children(data, place)}</div>
    </main>
  );
}

export { jsonFetcher };
