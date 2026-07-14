"use client";

import { jsonFetcher } from "@/components/explore/feature-page-shell";
import { OrbitShowcase, type OrbitItem } from "@/components/explore/orbit-showcase";
import { useNearby } from "@/components/explore/use-nearby";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GalleryData } from "@/types/features";
import type { PlaceData } from "@/types/place";
import { BedDouble, Building2, Landmark, PawPrint, Soup, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

export function HomeOrbitSection({ data }: { data: PlaceData }) {
  const { data: nearby } = useNearby(data.overview.name);
  const dishes = data.food.slice(0, 5).map((item) => item.name).join("|");
  const { data: gallery } = useSWR<GalleryData>(`/api/gallery?name=${encodeURIComponent(data.overview.name)}&dishes=${encodeURIComponent(dishes)}`, jsonFetcher, { revalidateOnFocus: false, dedupingInterval: 86_400_000 });
  const photos = gallery?.photos ?? [];
  const building = nearby?.landmarks.find((item) => item.category === "building");
  const wildlife = nearby?.landmarks.find((item) => item.category === "wildlife");
  const items: OrbitItem[] = [
    { title: data.attractions[0]?.name ?? `${data.overview.name} monuments`, subtitle: "Landmark", icon: Landmark, imageUrl: gallery?.groups.architecture[0]?.thumbnailUrl ?? data.overview.imageUrl },
    { title: nearby?.restaurants[0]?.name ?? `Restaurants in ${data.overview.name}`, subtitle: nearby?.restaurants[0]?.cuisine ?? "Local food", icon: UtensilsCrossed, imageUrl: gallery?.groups.food[0]?.thumbnailUrl },
    { title: data.hotels[0]?.name ?? `Stays in ${data.overview.name}`, subtitle: "Hotel", icon: BedDouble, imageUrl: gallery?.groups.city[0]?.thumbnailUrl },
    { title: building?.name ?? `${data.overview.name} architecture`, subtitle: "Building", icon: Building2, imageUrl: gallery?.groups.architecture[1]?.thumbnailUrl },
    { title: wildlife?.name ?? `Wild side of ${data.overview.name}`, subtitle: "Animals & nature", icon: PawPrint, imageUrl: gallery?.groups.nature[0]?.thumbnailUrl },
    { title: data.food[0]?.name ?? `Taste ${data.overview.name}`, subtitle: "Signature dish", icon: Soup, imageUrl: gallery?.dishPhotos[data.food[0]?.name ?? ""]?.[0]?.thumbnailUrl ?? gallery?.groups.food[1]?.thumbnailUrl },
  ];

  return (
    <section className="border-y border-border/70 bg-card/25 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center"><Badge variant="outline">Living place orbit</Badge><h2 className="mt-5 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">Everything moves around the place.</h2><p className="mt-4 leading-7 text-muted-foreground">Monuments, restaurants, stays, buildings, wildlife and dishes rearrange themselves for every search.</p></div>
        <OrbitShowcase place={data.overview.name} items={items} />
        <div className="flex flex-wrap justify-center gap-3"><Button asChild><Link href={`/food?place=${encodeURIComponent(data.overview.name)}`}>Explore food</Link></Button><Button asChild variant="outline"><Link href={`/stay?place=${encodeURIComponent(data.overview.name)}`}>Find a stay</Link></Button><Button asChild variant="outline"><Link href={`/culture?place=${encodeURIComponent(data.overview.name)}`}>Movies, books & photos</Link></Button></div>
      </div>
      {photos.length > 0 && <div className="photo-ribbon mt-16 overflow-hidden"><div className="photo-ribbon-track">{[...photos, ...photos].map((photo, index) => <a key={`${photo.id}-${index}`} href={photo.sourceUrl} target="_blank" rel="noreferrer" className="block h-44 w-72 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-cover bg-center transition hover:scale-[1.02]" style={{ backgroundImage: `url(${photo.thumbnailUrl})` }} aria-label={`${photo.title} on Wikimedia Commons`} />)}</div></div>}
    </section>
  );
}
