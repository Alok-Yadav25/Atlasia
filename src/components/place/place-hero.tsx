"use client";

import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/place/search-bar";
import { WeatherEffects } from "@/components/place/weather-effects";
import type { PlaceData } from "@/types/place";
import type { PlacePhoto } from "@/types/features";
import { CloudSun, Database, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

const fallbackImages = [
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2200&q=85",
  "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?auto=format&fit=crop&w=2200&q=85",
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=2200&q=85",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=2200&q=85",
];

function hashPlace(value: string): number {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
}

interface PlaceHeroProps {
  data: PlaceData;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearch: (value: string) => void;
}

export function PlaceHero({
  data,
  searchValue,
  onSearchValueChange,
  onSearch,
}: PlaceHeroProps) {
  const { data: media } = useSWR<{ photos: PlacePhoto[] }>(
    `/api/media?name=${encodeURIComponent(data.overview.name)}`,
    async (url: string) => {
      const response = await fetch(url);
      return (await response.json()) as { photos: PlacePhoto[] };
    },
    { revalidateOnFocus: false, dedupingInterval: 86_400_000 }
  );
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const [imageIndex, setImageIndex] = useState(0);
  const fallback = fallbackImages[hashPlace(data.overview.name) % fallbackImages.length];
  const sources = useMemo(() => {
    const values = [data.overview.imageUrl, ...(media?.photos.map((photo) => photo.thumbnailUrl) ?? []), fallback]
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).filter((value) => !failedImages.has(value));
  }, [data.overview.imageUrl, failedImages, fallback, media?.photos]);
  const source = sources[imageIndex % Math.max(sources.length, 1)] ?? fallback;

  useEffect(() => {
    if (sources.length < 2) return;
    const timer = window.setInterval(
      () => setImageIndex((index) => (index + 1) % sources.length),
      6_500
    );
    return () => window.clearInterval(timer);
  }, [sources.length]);

  return (
    <section className="relative min-h-[88svh] overflow-hidden border-b border-white/8">
      <AnimatePresence mode="popLayout">
        <motion.div key={source} initial={{ opacity: 0, scale: 1.07 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.35 }} className="absolute inset-0">
          <Image
            src={source}
            alt={`A view representing ${data.overview.name}`}
            fill
            unoptimized
            priority={imageIndex === 0}
            sizes="100vw"
            className="object-cover object-center"
            onError={() => setFailedImages((current) => new Set(current).add(source))}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(3,7,18,.15)_0%,rgba(3,7,18,.4)_43%,var(--weather-deep)_100%)]" />
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(0,0,0,.52)_0%,transparent_68%)]" />
      <WeatherEffects code={data.weather?.weatherCode} isDay={data.weather?.isDay} />

      <div className="relative z-10 mx-auto flex min-h-[88svh] w-full max-w-7xl flex-col justify-end px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
        <motion.div
          key={data.overview.name}
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Badge className="border-white/15 bg-black/25 text-white backdrop-blur-xl" variant="outline">
              <MapPin className="size-3" /> {data.overview.country}
            </Badge>
            {data.weather && (
              <Badge className="border-white/15 bg-black/25 text-white backdrop-blur-xl" variant="outline">
                <CloudSun className="size-3" /> {data.weather.temperature}° · {data.weather.condition}
              </Badge>
            )}
            <Badge className="border-white/15 bg-black/25 text-white backdrop-blur-xl" variant="outline">
              <Database className="size-3" /> {data.cache.hit ? "Cached view" : "Freshly explored"}
            </Badge>
          </div>
          <p className="mb-3 text-xs font-semibold tracking-[0.28em] text-white/70 uppercase">
            Your single-page field guide
          </p>
          <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-[-0.055em] text-white drop-shadow-2xl sm:text-7xl lg:text-[6.5rem] lg:leading-[0.9]">
            {data.overview.name}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/78 sm:text-lg">
            {data.overview.description}. Live weather, local flavour, people, places and practical details—without the tab chaos.
          </p>
          <SearchBar
            id="hero-place-search"
            value={searchValue}
            onValueChange={onSearchValueChange}
            onSearch={onSearch}
            className="mt-8 max-w-2xl"
          />
        </motion.div>

        <div className="mt-10 flex items-center gap-3 text-xs text-white/58">
          <span className="h-px w-10 bg-white/35" />
          Scroll to unpack the city
        </div>
      </div>
    </section>
  );
}
