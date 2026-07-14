"use client";

import { jsonFetcher } from "@/components/explore/feature-page-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PlacePhoto, RecommendationData, RecommendedPlace } from "@/types/features";
import { ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

function RecommendationCard({ place, label }: { place: RecommendedPlace; label: string }) {
  const { data: media } = useSWR<{ photos: PlacePhoto[] }>(`/api/media?name=${encodeURIComponent(`${place.name}, ${place.country}`)}`, jsonFetcher, { revalidateOnFocus: false, dedupingInterval: 86_400_000 });
  const photo = media?.photos[0];
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}>
      <Link href={`/?place=${encodeURIComponent(`${place.name}, ${place.country}`)}`}>
        <Card className="group relative aspect-[4/5] overflow-hidden border-white/10 bg-card">
          {photo && <Image src={photo.thumbnailUrl} alt={`${place.name}, ${place.country}`} fill unoptimized sizes="(max-width: 640px) 80vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.88))]" />
          <div className="absolute inset-x-0 top-0 flex justify-between p-4 text-white"><Badge className="border-white/10 bg-black/30 text-white backdrop-blur-xl">{label}</Badge><span className="grid size-8 place-items-center rounded-full bg-black/30 backdrop-blur-xl"><ArrowUpRight className="size-4" /></span></div>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white"><p className="text-2xl font-semibold tracking-tight">{place.name}</p><p className="mt-1 text-xs text-white/60">{place.country} · {place.distanceKm.toLocaleString()} km</p><p className="mt-4 text-sm leading-6 text-white/72">{place.reason}</p></div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function RecommendationsSection({ placeName }: { placeName: string }) {
  const { data } = useSWR<RecommendationData>(`/api/recommendations?name=${encodeURIComponent(placeName)}`, jsonFetcher, { revalidateOnFocus: false, dedupingInterval: 86_400_000 });
  const suggestions = [...(data?.nearbyCities.slice(0, 3) ?? []), ...(data?.youMightLike.slice(0, 3) ?? [])];
  if (!suggestions.length) return null;
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-primary uppercase"><Sparkles className="size-3.5" /> Keep exploring</p><h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">If you like {placeName}, you might like…</h2></div><Badge variant="outline"><MapPin className="size-3" /> GeoNames suggestions</Badge></div>
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{suggestions.map((place, index) => <RecommendationCard key={`${place.name}-${place.countryCode}`} place={place} label={index < Math.min(3, data?.nearbyCities.length ?? 0) ? "Nearby" : "Similar energy"} />)}</div>
      <p className="mt-5 text-xs leading-5 text-muted-foreground">{data?.note}</p>
    </section>
  );
}
