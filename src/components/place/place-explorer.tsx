"use client";

import { AttractionsSection } from "@/components/place/attractions-section";
import { CostSection } from "@/components/place/cost-section";
import { CurrencySection } from "@/components/place/currency-section";
import { DashboardSkeleton } from "@/components/place/dashboard-skeleton";
import { FoodSection } from "@/components/place/food-section";
import { HotelsSection } from "@/components/place/hotels-section";
import { HomeOrbitSection } from "@/components/place/home-orbit-section";
import { MapSection } from "@/components/place/map-section";
import { NewsSection } from "@/components/place/news-section";
import { OverviewSection } from "@/components/place/overview-section";
import { PeopleSection } from "@/components/place/people-section";
import { PlaceHero } from "@/components/place/place-hero";
import { RoadmapSection } from "@/components/place/roadmap-section";
import { RecommendationsSection } from "@/components/place/recommendations-section";
import { SearchBar } from "@/components/place/search-bar";
import { SourceHealth } from "@/components/place/source-health";
import { TransportSection } from "@/components/place/transport-section";
import { TravelChat } from "@/components/place/travel-chat";
import { VideosSection } from "@/components/place/videos-section";
import { WeatherSection } from "@/components/place/weather-section";
import { WelcomeExperience } from "@/components/place/welcome-experience";
import { Button } from "@/components/ui/button";
import { FeatureNav } from "@/components/explore/feature-nav";
import type { PlaceData, WeatherData } from "@/types/place";
import { Compass, GitFork, LoaderCircle, RefreshCw } from "lucide-react";
import { motion, useScroll } from "motion/react";
import { useState, type CSSProperties } from "react";
import useSWR from "swr";

interface WeatherTheme {
  primary: string;
  accent: string;
  deep: string;
  glow: string;
}

function themeForWeather(weather: WeatherData | null): WeatherTheme {
  if (!weather) return { primary: "oklch(0.72 0.16 210)", accent: "#22d3ee", deep: "rgba(4,16,31,.98)", glow: "rgba(34,211,238,.22)" };
  const code = weather.weatherCode;
  if ((code >= 51 && code <= 67) || code >= 80) return { primary: "oklch(0.72 0.13 235)", accent: "#38bdf8", deep: "rgba(5,15,35,.98)", glow: "rgba(56,189,248,.24)" };
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { primary: "oklch(0.8 0.08 230)", accent: "#bae6fd", deep: "rgba(15,23,42,.98)", glow: "rgba(186,230,253,.25)" };
  if (code >= 2 && code <= 48) return { primary: "oklch(0.72 0.1 260)", accent: "#a5b4fc", deep: "rgba(17,24,39,.98)", glow: "rgba(165,180,252,.2)" };
  if (!weather.isDay) return { primary: "oklch(0.7 0.17 295)", accent: "#c4b5fd", deep: "rgba(13,8,35,.98)", glow: "rgba(196,181,253,.2)" };
  return { primary: "oklch(0.78 0.16 75)", accent: "#fbbf24", deep: "rgba(22,14,8,.98)", glow: "rgba(251,191,36,.22)" };
}

async function placeFetcher(url: string): Promise<PlaceData> {
  const response = await fetch(url);
  const body = (await response.json()) as PlaceData | { error?: string };
  if (!response.ok) {
    throw new Error("error" in body && body.error ? body.error : "Atlasia could not load this destination.");
  }
  return body as PlaceData;
}

export function PlaceExplorer({ initialPlace = null }: { initialPlace?: string | null }) {
  const [searchValue, setSearchValue] = useState(initialPlace ?? "");
  const [activePlace, setActivePlace] = useState(initialPlace ?? "");
  const { scrollYProgress } = useScroll();
  const { data, error, isLoading, isValidating, mutate } = useSWR<PlaceData>(
    activePlace ? `/api/place?name=${encodeURIComponent(activePlace)}` : null,
    placeFetcher,
    { keepPreviousData: true, revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  function search(place: string) {
    const next = place.trim();
    if (next.length < 2) return;
    setSearchValue(next);
    setActivePlace(next);
    window.history.replaceState(null, "", `/?place=${encodeURIComponent(next)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!activePlace) {
    return (
      <WelcomeExperience
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        onSearch={search}
      />
    );
  }

  if (isLoading && !data) return <DashboardSkeleton />;

  if (error && !data) {
    return (
      <main className="grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.18),transparent_35%),#05070b] px-4 text-white">
        <div className="w-full max-w-xl text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/10"><Compass className="size-6" /></span>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">That trail went cold.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/65">{error.message}</p>
          <SearchBar id="recovery-search" value={searchValue} onValueChange={setSearchValue} onSearch={search} className="mt-8" />
          <Button variant="ghost" className="mt-4 text-white hover:bg-white/10 hover:text-white" onClick={() => void mutate()}><RefreshCw className="size-4" /> Try again</Button>
        </div>
      </main>
    );
  }

  if (!data) return <DashboardSkeleton />;

  const theme = themeForWeather(data.weather);
  const style = {
    "--primary": theme.primary,
    "--ring": theme.primary,
    "--place-accent": theme.accent,
    "--weather-deep": theme.deep,
    "--weather-glow": theme.glow,
  } as CSSProperties;

  return (
    <main style={style} className="relative min-h-screen overflow-clip bg-background text-foreground">
      <motion.div className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary" style={{ scaleX: scrollYProgress }} />
      <FeatureNav place={activePlace} searchValue={searchValue} onSearchValueChange={setSearchValue} onSearch={search} overlay />

      {isValidating && (
        <div className="fixed top-19 right-4 z-40 flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
          <LoaderCircle className="size-3.5 animate-spin text-primary" /> Refreshing the world…
        </div>
      )}

      <PlaceHero key={data.overview.name} data={data} searchValue={searchValue} onSearchValueChange={setSearchValue} onSearch={search} />
      <SourceHealth sources={data.sources} />
      <HomeOrbitSection data={data} />

      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,var(--weather-glow),transparent_28%),radial-gradient(circle_at_85%_45%,var(--weather-glow),transparent_26%)] opacity-70" />
        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-12">
          <OverviewSection data={data} />
          <WeatherSection weather={data.weather} />
          <CurrencySection currency={data.currency} />
          <CostSection cost={data.costOfLiving} />
          <TransportSection transport={data.transport} />
          <AttractionsSection attractions={data.attractions} />
          <FoodSection food={data.food} placeName={data.overview.name} />
          <MapSection data={data} />
          <PeopleSection people={data.notablePeople} />
          <HotelsSection hotels={data.hotels} hasLiveRates={data.sources.hotels?.state === "ok"} />
          <NewsSection news={data.news} configured={data.sources.news?.state !== "unconfigured"} />
          <VideosSection videos={data.videos} configured={data.sources.videos?.state !== "unconfigured"} />
        </div>
      </section>

      <RecommendationsSection placeName={data.overview.name} />

      <RoadmapSection />
      <footer className="border-t border-border/65">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Atlasia · Built on open knowledge and graceful fallbacks.</p>
          <div className="flex items-center gap-4">
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:text-foreground">Open data credits</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground"><GitFork className="size-3.5" /> Source-ready</a>
          </div>
        </div>
      </footer>

      <TravelChat data={data} />
    </main>
  );
}
