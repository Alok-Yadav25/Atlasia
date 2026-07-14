import { SourceUnavailableError } from "@/lib/place/http";
import { normalizeCacheKey, readPlaceCache, writePlaceCache } from "@/lib/place/cache";
import { fetchCountryAndCurrency } from "@/lib/place/sources/country";
import { fetchAmadeusHotels, fetchCostOfLiving, fetchNews, fetchVideos } from "@/lib/place/sources/extras";
import { geocodePlace } from "@/lib/place/sources/geocoding";
import { fetchOpenStreetMap } from "@/lib/place/sources/openstreetmap";
import { fetchNotablePeople } from "@/lib/place/sources/wikidata";
import { fetchWikipediaPlace } from "@/lib/place/sources/wikipedia";
import { fetchWikivoyage } from "@/lib/place/sources/wikivoyage";
import { fetchWeather } from "@/lib/place/sources/weather";
import type {
  Attraction,
  CountryDetails,
  CurrencyData,
  Hotel,
  PlaceData,
  SourceStatus,
} from "@/types/place";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

const labels: Record<string, string> = {
  geocoding: "OpenStreetMap geocoding",
  wikipedia: "Wikipedia",
  weather: "Open-Meteo",
  wikivoyage: "Wikivoyage / food fallback",
  wikidata: "Wikidata",
  openstreetmap: "OpenStreetMap",
  country: "Country data & FX",
  news: "GNews",
  videos: "YouTube",
  costOfLiving: "Teleport / World Bank",
  hotels: "Amadeus",
};

interface Captured<T> {
  key: string;
  value: T;
  status: SourceStatus;
}

async function capture<T>(key: string, task: () => Promise<T>, fallback: T): Promise<Captured<T>> {
  try {
    return {
      key,
      value: await task(),
      status: { state: "ok", label: labels[key] ?? key },
    };
  } catch (error) {
    const unavailable = error instanceof SourceUnavailableError;
    return {
      key,
      value: fallback,
      status: {
        state: unavailable ? "unconfigured" : "error",
        label: labels[key] ?? key,
        message:
          error instanceof Error
            ? error.message
            : unavailable
              ? "Source is not configured"
              : "Source request failed",
      },
    };
  }
}

function mergeAttractions(primary: Attraction[], fallback: Attraction[]): Attraction[] {
  const seen = new Set<string>();
  return [...primary, ...fallback]
    .filter((item) => {
      const key = item.name.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);
}

export async function aggregatePlace(query: string): Promise<PlaceData> {
  const cacheKey = normalizeCacheKey(query);
  const cached = await readPlaceCache(cacheKey);
  if (cached.data) {
    return {
      ...cached.data,
      cache: { hit: true, provider: cached.provider },
    };
  }

  const [geocodingResult, wikipediaResult] = await Promise.all([
    capture("geocoding", () => geocodePlace(query), null),
    capture("wikipedia", () => fetchWikipediaPlace(query), null),
  ]);

  if (!geocodingResult.value) {
    throw new Error(
      "We could not locate that place. Try adding a country, for example “Springfield, USA”."
    );
  }

  const geo = geocodingResult.value;
  const wikipedia = wikipediaResult.value;
  const center = { lat: geo.lat, lon: geo.lon };
  const placeName = wikipedia?.title ?? geo.name;
  const sources: Record<string, SourceStatus> = {
    geocoding: geocodingResult.status,
    wikipedia: wikipediaResult.status,
  };

  const emptyCountry: { countryDetails: CountryDetails; currency: CurrencyData | null } = {
    countryDetails: { capital: null, languages: [], flagUrl: null },
    currency: null,
  };
  const emptyOsm = { attractions: [], transport: [], hotels: [], mapPoints: [] };
  const emptyGuide = { attractions: [], food: [] };

  const results = await Promise.all([
    capture("weather", () => fetchWeather(geo.lat, geo.lon), null),
    capture("wikivoyage", () => fetchWikivoyage(placeName, geo.countryCode), emptyGuide),
    capture(
      "wikidata",
      () =>
        wikipedia?.wikidataId
          ? fetchNotablePeople(wikipedia.wikidataId)
          : Promise.reject(new SourceUnavailableError("No Wikidata place entity was found")),
      []
    ),
    capture("openstreetmap", () => fetchOpenStreetMap(center), emptyOsm),
    capture("country", () => fetchCountryAndCurrency(geo.countryCode), emptyCountry),
    capture("news", () => fetchNews(placeName), []),
    capture("videos", () => fetchVideos(placeName), []),
    capture("costOfLiving", () => fetchCostOfLiving(placeName, geo.countryCode), null),
    capture("hotels", () => fetchAmadeusHotels(center), []),
  ]);

  for (const result of results) sources[result.key] = result.status;

  const [weather, guide, notablePeople, osm, country, news, videos, cost, amadeusHotels] =
    results.map((result) => result.value) as [
      Awaited<ReturnType<typeof fetchWeather>> | null,
      Awaited<ReturnType<typeof fetchWikivoyage>>,
      Awaited<ReturnType<typeof fetchNotablePeople>>,
      Awaited<ReturnType<typeof fetchOpenStreetMap>>,
      Awaited<ReturnType<typeof fetchCountryAndCurrency>>,
      Awaited<ReturnType<typeof fetchNews>>,
      Awaited<ReturnType<typeof fetchVideos>>,
      Awaited<ReturnType<typeof fetchCostOfLiving>> | null,
      Hotel[],
    ];

  const generatedAt = new Date();
  const hotels = amadeusHotels.length > 0 ? amadeusHotels : osm.hotels;
  const hasTransientFailure = Object.values(sources).some((source) => source.state === "error");
  const effectiveTtl = hasTransientFailure ? 60 * 60 * 1_000 : CACHE_TTL_MS;
  const data: PlaceData = {
    query,
    generatedAt: generatedAt.toISOString(),
    expiresAt: new Date(generatedAt.getTime() + effectiveTtl).toISOString(),
    cache: { hit: false, provider: cached.provider },
    sources,
    overview: {
      name: placeName,
      description: wikipedia?.description ?? `${geo.type} in ${geo.country}`,
      summary:
        wikipedia?.summary ??
        `${geo.name} is a ${geo.type} in ${geo.country}. Explore nearby landmarks, transport and live conditions.`,
      country: geo.country,
      countryCode: geo.countryCode,
      population: geo.population,
      coordinates: center,
      timezone: weather?.timezone ?? null,
      imageUrl: wikipedia?.imageUrl ?? null,
      wikipediaUrl: wikipedia?.wikipediaUrl ?? null,
      wikidataId: wikipedia?.wikidataId ?? null,
    },
    weather: weather?.weather ?? null,
    attractions: mergeAttractions(guide.attractions, osm.attractions),
    food: guide.food,
    notablePeople,
    transport: osm.transport,
    mapPoints: osm.mapPoints,
    news,
    videos,
    costOfLiving: cost,
    hotels,
    currency: country.currency,
    countryDetails: country.countryDetails,
  };

  await writePlaceCache(cacheKey, data);
  return data;
}
