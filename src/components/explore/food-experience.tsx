"use client";

import { FeaturePageShell, jsonFetcher } from "@/components/explore/feature-page-shell";
import { useNearby } from "@/components/explore/use-nearby";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { GalleryData, RecommendationData } from "@/types/features";
import type { PlaceData } from "@/types/place";
import { Clock3, ExternalLink, MapPin, Soup, Sparkles, UtensilsCrossed } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

function FoodBoard({ data }: { data: PlaceData }) {
  const { data: nearby, isLoading } = useNearby(data.overview.name);
  const dishQuery = data.food.slice(0, 6).map((item) => item.name).join("|");
  const { data: gallery } = useSWR<GalleryData>(`/api/gallery?name=${encodeURIComponent(data.overview.name)}&dishes=${encodeURIComponent(dishQuery)}`, jsonFetcher, { revalidateOnFocus: false });
  const { data: recommendations } = useSWR<RecommendationData>(`/api/recommendations?name=${encodeURIComponent(data.overview.name)}`, jsonFetcher, { revalidateOnFocus: false });
  const foodPhotos = useMemo(() => {
    const direct = data.food.flatMap((item) => item.imageUrl ? [{ id: item.id, title: item.name, url: item.imageUrl, thumbnailUrl: item.imageUrl, sourceUrl: "https://www.themealdb.com/", credit: "TheMealDB" }] : []);
    return direct.length ? direct : gallery?.groups.food.length ? gallery.groups.food : gallery?.photos ?? [];
  }, [data.food, gallery]);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (foodPhotos.length < 2) return;
    const timer = window.setInterval(() => setPhotoIndex((value) => (value + 1) % foodPhotos.length), 4_600);
    return () => window.clearInterval(timer);
  }, [foodPhotos.length, data.overview.name]);

  const heroPhoto = foodPhotos[foodPhotos.length ? photoIndex % foodPhotos.length : 0];
  return (
    <div className="space-y-16">
      {heroPhoto && <section className="relative aspect-[16/10] max-h-[35rem] overflow-hidden rounded-[2rem] border border-border sm:aspect-[16/8]">
        <AnimatePresence mode="popLayout"><motion.div key={heroPhoto.id} initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0"><Image src={heroPhoto.thumbnailUrl} alt={`${data.overview.name} food: ${heroPhoto.title}`} fill unoptimized sizes="100vw" className="object-cover" /></motion.div></AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9"><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-white/65 uppercase"><Sparkles className="size-3.5" /> changing table</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Eat the place, not just the itinerary</h2><p className="mt-3 line-clamp-1 text-xs text-white/55">{heroPhoto.title} · Wikimedia Commons</p></div>
      </section>}
      <section>
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Dishes & local flavour</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">Start with the plate</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.food.length ? data.food.map((item, index) => {
            const photo = item.imageUrl ? { id: item.id, title: item.name, url: item.imageUrl, thumbnailUrl: item.imageUrl, sourceUrl: "https://www.themealdb.com/", credit: "TheMealDB" } : gallery?.dishPhotos[item.name]?.[0] ?? foodPhotos[index % Math.max(foodPhotos.length, 1)];
            return <motion.div key={item.id} initial={{ opacity: 0, rotate: index % 2 ? 2 : -2, y: 22 }} whileInView={{ opacity: 1, rotate: 0, y: 0 }} viewport={{ once: true, margin: "-40px" }}>
              <Card className="group h-full overflow-hidden bg-card/72">{photo && <div className="relative aspect-[16/10] overflow-hidden"><Image src={photo.thumbnailUrl} alt={`${item.name} in ${data.overview.name}`} fill unoptimized sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-1000 ease-out group-hover:scale-[1.14]" /><div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" /></div>}<CardContent className="p-5"><span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary"><Soup className="size-4" /></span><h3 className="mt-5 text-xl font-semibold">{item.name}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p></CardContent></Card>
            </motion.div>;
          }) : <Card className="md:col-span-2"><CardContent className="p-6"><h3 className="font-semibold">The guide has no structured dish list yet</h3><p className="mt-2 text-sm text-muted-foreground">Atlasia can still build a food trail from the place context, while nearby restaurants load below.</p></CardContent></Card>}
        </div>
      </section>
      <section>
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Nearby restaurants</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Follow the neighbourhood</h2></div>{nearby && <Badge variant="outline">{nearby.restaurants.length} nearby</Badge>}</div>
        {isLoading ? <div className="mt-6 grid gap-3 md:grid-cols-2"><Skeleton className="h-28" /><Skeleton className="h-28" /></div> : nearby?.restaurants.length ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {nearby.restaurants.map((restaurant) => {
              const mapUrl = `https://www.openstreetmap.org/?mlat=${restaurant.coordinates.lat}&mlon=${restaurant.coordinates.lon}#map=17/${restaurant.coordinates.lat}/${restaurant.coordinates.lon}`;
              return <Card key={restaurant.id} className="bg-card/70"><CardContent className="flex items-start gap-4 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><UtensilsCrossed className="size-4" /></span><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{restaurant.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" /> {restaurant.distanceKm} km · {restaurant.cuisine || restaurant.category}</p>{restaurant.openingHours && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" /> {restaurant.openingHours}</p>}</div><Button asChild size="icon-sm" variant="ghost"><a href={mapUrl} target="_blank" rel="noreferrer" aria-label={`Open ${restaurant.name} on map`}><ExternalLink className="size-4" /></a></Button></CardContent></Card>;
            })}
          </div>
        ) : <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No restaurant list returned right now. The nearby source may be rate-limited; try again shortly.</p>}
      </section>
      {recommendations?.youMightLike.length ? <section><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">If you like this table</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Taste these places next</h2><div className="mt-6 grid gap-4 md:grid-cols-3">{recommendations.youMightLike.slice(0, 6).map((place) => <Link key={`${place.name}-${place.countryCode}`} href={`/food?place=${encodeURIComponent(`${place.name}, ${place.country}`)}`} className="group rounded-2xl border border-border bg-card/65 p-5 transition hover:-translate-y-1 hover:border-primary/35"><p className="text-lg font-semibold">{place.name}</p><p className="mt-1 text-xs text-muted-foreground">{place.country}</p><p className="mt-4 text-sm leading-6 text-muted-foreground">Open its local dishes, food photos and nearby restaurant trail.</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-primary">Taste next <ExternalLink className="size-3" /></span></Link>)}</div></section> : null}
    </div>
  );
}

export function FoodExperience() {
  return <FeaturePageShell eyebrow="Food atlas" title={(place) => `Taste ${place}, one stop at a time`} description="Local dishes, changing food photography and nearby restaurant names from open sources—with cuisine and opening-hour details when contributors provide them.">{(data) => <FoodBoard data={data} />}</FeaturePageShell>;
}
