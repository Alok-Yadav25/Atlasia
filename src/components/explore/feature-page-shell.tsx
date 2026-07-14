"use client";

import { BlurTitle } from "@/components/explore/blur-title";
import { FeatureNav } from "@/components/explore/feature-nav";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlacePhoto } from "@/types/features";
import type { PlaceData } from "@/types/place";
import { AnimatePresence, motion, useScroll } from "motion/react";
import { CloudSun, MapPin, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
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
  const place = searchParams.get("place")?.trim() || searchParams.get("from")?.trim() || "Jaipur, India";
  const { scrollYProgress } = useScroll();
  const { data, error, isLoading } = useSWR<PlaceData>(
    `/api/place?name=${encodeURIComponent(place)}`,
    jsonFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const { data: media } = useSWR<{ photos: PlacePhoto[] }>(
    `/api/media?name=${encodeURIComponent(data?.overview.name ?? place)}`,
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
