"use client";

import { FeatureNav } from "@/components/explore/feature-nav";
import { BrandMark } from "@/components/explore/brand-mark";
import { SearchBar } from "@/components/place/search-bar";
import { jsonFetcher } from "@/components/explore/feature-page-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PlacePhoto } from "@/types/features";
import { ArrowUpRight, Compass, Globe2, MapPin, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

const welcomePlaces = [
  { name: "Tokyo", country: "Japan", note: "Night energy, design and food" },
  { name: "Paris", country: "France", note: "Art, neighbourhoods and cafés" },
  { name: "Cape Town", country: "South Africa", note: "Coastlines, mountains and culture" },
  { name: "Kyoto", country: "Japan", note: "Temples, gardens and craft" },
  { name: "Barcelona", country: "Spain", note: "Architecture, beaches and late dinners" },
  { name: "New York", country: "United States", note: "Museums, music and city momentum" },
];

function WelcomePlaceCard({ place, index }: { place: (typeof welcomePlaces)[number]; index: number }) {
  const fullName = `${place.name}, ${place.country}`;
  const { data } = useSWR<{ photos: PlacePhoto[] }>(
    `/api/media?name=${encodeURIComponent(fullName)}`,
    jsonFetcher,
    { revalidateOnFocus: false, dedupingInterval: 86_400_000 }
  );
  const photos = data?.photos ?? [];
  const photo = photos.length > 0 ? photos[index % photos.length] : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.045 }}
      whileHover={{ y: -8 }}
    >
      <Link href={`/?place=${encodeURIComponent(fullName)}`} className="block">
        <Card className="group relative aspect-[4/5] overflow-hidden border-white/10 bg-card shadow-2xl transition duration-500 hover:border-white/25">
          {photo && (
            <Image
              src={photo.thumbnailUrl}
              alt={`${place.name}, ${place.country}`}
              fill
              unoptimized
              sizes="(max-width: 640px) 86vw, (max-width: 1024px) 45vw, 30vw"
              className="object-cover transition duration-1000 ease-out group-hover:scale-[1.16]"
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.06),rgba(0,0,0,.9))]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-white">
            <Badge className="border-white/12 bg-black/30 text-white backdrop-blur-xl">Recommended</Badge>
            <span className="grid size-9 place-items-center rounded-full bg-black/35 backdrop-blur-xl transition group-hover:rotate-12 group-hover:scale-110"><ArrowUpRight className="size-4" /></span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="text-2xl font-semibold tracking-tight">{place.name}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60"><MapPin className="size-3" /> {place.country}</p>
            <p className="mt-4 text-sm leading-6 text-white/72">{place.note}</p>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

interface WelcomeExperienceProps {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearch: (value: string) => void;
}

export function WelcomeExperience({ searchValue, onSearchValueChange, onSearch }: WelcomeExperienceProps) {
  return (
    <main className="min-h-screen overflow-clip bg-[#05070b] text-white">
      <FeatureNav place="" searchValue={searchValue} onSearchValueChange={onSearchValueChange} onSearch={onSearch} overlay />
      <section className="relative isolate grid min-h-[92vh] place-items-center overflow-hidden px-4 pb-16 pt-36 text-center sm:px-6">
        <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_50%_38%,rgba(34,211,238,.18),transparent_28%),radial-gradient(circle_at_18%_72%,rgba(168,85,247,.12),transparent_24%),radial-gradient(circle_at_82%_68%,rgba(251,191,36,.1),transparent_22%),#05070b]" />
        <motion.div className="pointer-events-none absolute size-[44rem] rounded-full border border-white/6" animate={{ rotate: 360 }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} />
        <motion.div className="pointer-events-none absolute size-[29rem] rounded-full border border-dashed border-cyan-300/10" animate={{ rotate: -360 }} transition={{ duration: 52, repeat: Infinity, ease: "linear" }} />
        <div className="mx-auto w-full max-w-5xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="mx-auto flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/65 backdrop-blur-xl"><Globe2 className="size-3.5 text-cyan-300" /> One search. A whole place, connected.</motion.div>
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.75 }} className="mt-8 flex justify-center"><BrandMark /></motion.div>
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="mt-6 text-balance text-6xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-8xl lg:text-[9rem]">Atlasia</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42, duration: 0.8 }} className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-white/56 sm:text-xl">Choose any city or place. Atlasia brings its story, weather, food, people, routes, photos and nearby discoveries into one living view.</motion.p>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.7 }} className="mx-auto mt-10 max-w-3xl">
            <SearchBar id="atlasia-welcome-search" value={searchValue} onValueChange={onSearchValueChange} onSearch={onSearch} />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {welcomePlaces.slice(0, 5).map((place) => {
                const fullName = `${place.name}, ${place.country}`;
                return <button key={fullName} type="button" onClick={() => onSearch(fullName)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/58 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10 hover:text-white">{place.name}</button>;
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-cyan-300 uppercase"><Sparkles className="size-3.5" /> Start somewhere remarkable</p><h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Places worth opening first</h2></div>
          <Badge className="border-white/10 bg-white/5 text-white/65"><Compass className="size-3" /> Curated Atlasia picks</Badge>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{welcomePlaces.map((place, index) => <WelcomePlaceCard key={`${place.name}-${place.country}`} place={place} index={index} />)}</div>
      </section>
    </main>
  );
}
