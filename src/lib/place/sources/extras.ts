import { SourceUnavailableError, cleanText, fetchJson, truncate } from "@/lib/place/http";
import type { Coordinates, CostOfLiving, Hotel, NewsItem, VideoItem } from "@/types/place";

interface GNewsResponse {
  articles?: Array<{
    title?: string;
    description?: string;
    url?: string;
    image?: string;
    publishedAt?: string;
    source?: { name?: string };
  }>;
}

interface YouTubeResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
    };
  }>;
}

interface TeleportScoresResponse {
  teleport_city_score?: number;
  summary?: string;
  categories?: Array<{ name?: string; score_out_of_10?: number }>;
  _links?: { self?: { href?: string } };
}

interface WorldBankCountryResponse {
  incomeLevel?: { id?: string; value?: string };
  region?: { value?: string };
}

interface AmadeusTokenResponse {
  access_token?: string;
}

interface AmadeusHotelListResponse {
  data?: Array<{
    hotelId?: string;
    name?: string;
    geoCode?: { latitude?: number; longitude?: number };
    distance?: { value?: number };
  }>;
}

interface AmadeusOffersResponse {
  data?: Array<{
    hotel?: { hotelId?: string; name?: string };
    offers?: Array<{ price?: { total?: string; currency?: string } }>;
  }>;
}

export async function fetchNews(placeName: string): Promise<NewsItem[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) throw new SourceUnavailableError("Add GNEWS_API_KEY to enable recent headlines");

  const params = new URLSearchParams({
    q: `"${placeName}"`,
    lang: "en",
    max: "6",
    sortby: "publishedAt",
    apikey: apiKey,
  });
  const data = await fetchJson<GNewsResponse>(`https://gnews.io/api/v4/search?${params}`);

  return (data.articles ?? [])
    .filter((article) => article.title && article.url)
    .map((article, index) => ({
      id: `news-${index}-${article.publishedAt ?? "latest"}`,
      title: article.title!,
      description: truncate(article.description ?? "Open the article for details.", 180),
      url: article.url!,
      imageUrl: article.image ?? null,
      source: article.source?.name ?? "News source",
      publishedAt: article.publishedAt ?? new Date().toISOString(),
    }));
}

export async function fetchVideos(placeName: string): Promise<VideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new SourceUnavailableError("Add YOUTUBE_API_KEY to enable travel videos");

  const params = new URLSearchParams({
    part: "snippet",
    q: `${placeName} travel guide`,
    type: "video",
    maxResults: "6",
    order: "relevance",
    safeSearch: "strict",
    key: apiKey,
  });
  const data = await fetchJson<YouTubeResponse>(
    `https://www.googleapis.com/youtube/v3/search?${params}`
  );

  return (data.items ?? [])
    .filter((item) => item.id?.videoId && item.snippet?.title)
    .map((item) => {
      const id = item.id!.videoId!;
      return {
        id,
        title: cleanText(item.snippet!.title!),
        channel: item.snippet?.channelTitle ?? "YouTube creator",
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ??
          item.snippet?.thumbnails?.medium?.url ??
          `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        publishedAt: item.snippet?.publishedAt ?? "",
        url: `https://www.youtube.com/watch?v=${id}`,
      };
    });
}

async function fetchCountryCostContext(countryCode: string): Promise<CostOfLiving> {
  const response = await fetchJson<[unknown, WorldBankCountryResponse[]]>(
    `https://api.worldbank.org/v2/country/${countryCode}?format=json`,
    { timeoutMs: 7_000 }
  );
  const country = response[1]?.[0];
  if (!country) throw new Error("Country budget context was unavailable");

  const level = country.incomeLevel?.id ?? "";
  const signals: Record<string, { index: number; label: string; detail: string }> = {
    HIC: {
      index: 78,
      label: "Higher-cost context",
      detail: "This is a high-income market, so accommodation and dining can run above global averages.",
    },
    UMC: {
      index: 58,
      label: "Mid-to-higher context",
      detail: "This is an upper-middle-income market with a wide range between local and visitor prices.",
    },
    LMC: {
      index: 38,
      label: "Value-friendly context",
      detail: "This is a lower-middle-income market, though tourist districts can price well above local averages.",
    },
    LIC: {
      index: 24,
      label: "Lower-cost context",
      detail: "Country-level prices may be lower, but transport, safety and visitor infrastructure can change the real trip cost.",
    },
  };
  const signal = signals[level] ?? {
    index: 50,
    label: "Flexible budget",
    detail: "Live city-level pricing is limited, so plan a flexible range and verify accommodation before booking.",
  };

  return {
    index: signal.index,
    label: signal.label,
    summary: `${signal.detail} This is country-level World Bank context, not a live price index.`,
    score: null,
    sourceUrl: `https://data.worldbank.org/country/${countryCode.toLowerCase()}`,
  };
}

export async function fetchCostOfLiving(
  placeName: string,
  countryCode: string
): Promise<CostOfLiving> {
  const slug = placeName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  let data: TeleportScoresResponse;
  try {
    data = await fetchJson<TeleportScoresResponse>(
      `https://api.teleport.org/api/urban_areas/slug:${slug}/scores/`,
      { timeoutMs: 3_500 }
    );
  } catch {
    return fetchCountryCostContext(countryCode);
  }
  const cost = data.categories?.find((category) =>
    category.name?.toLocaleLowerCase().includes("cost of living")
  );
  const index = Number.isFinite(cost?.score_out_of_10)
    ? Math.round((cost?.score_out_of_10 ?? 0) * 10)
    : null;

  return {
    index,
    label: index === null ? "Urban score available" : index >= 70 ? "More affordable" : index >= 45 ? "Mid-range" : "Higher cost",
    summary: truncate(cleanText(data.summary ?? "Teleport urban-area cost data is limited for this place."), 260),
    score: data.teleport_city_score ?? null,
    sourceUrl: data._links?.self?.href ?? null,
  };
}

export async function getAmadeusToken(): Promise<{ token: string; baseUrl: string }> {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new SourceUnavailableError(
      "Add AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET for live hotel prices"
    );
  }
  const baseUrl = process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";
  const token = await fetchJson<AmadeusTokenResponse>(`${baseUrl}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!token.access_token) throw new Error("Amadeus authentication failed");
  return { token: token.access_token, baseUrl };
}

export async function fetchAmadeusHotels(center: Coordinates): Promise<Hotel[]> {
  const { token, baseUrl } = await getAmadeusToken();
  const listParams = new URLSearchParams({
    latitude: String(center.lat),
    longitude: String(center.lon),
    radius: "20",
    radiusUnit: "KM",
    hotelSource: "ALL",
  });
  const list = await fetchJson<AmadeusHotelListResponse>(
    `${baseUrl}/v1/reference-data/locations/hotels/by-geocode?${listParams}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const rawHotels = (list.data ?? []).filter((hotel) => hotel.hotelId && hotel.name).slice(0, 10);
  const hotelIds = rawHotels.map((hotel) => hotel.hotelId!).join(",");
  let prices = new Map<string, { price: number; currency: string }>();

  if (hotelIds) {
    try {
      const offerParams = new URLSearchParams({
        hotelIds,
        adults: "1",
        roomQuantity: "1",
        bestRateOnly: "true",
      });
      const offers = await fetchJson<AmadeusOffersResponse>(
        `${baseUrl}/v3/shopping/hotel-offers?${offerParams}`,
        { headers: { Authorization: `Bearer ${token}` }, timeoutMs: 12_000 }
      );
      prices = new Map(
        (offers.data ?? []).flatMap((entry) => {
          const hotelId = entry.hotel?.hotelId;
          const total = Number(entry.offers?.[0]?.price?.total);
          const currency = entry.offers?.[0]?.price?.currency;
          return hotelId && Number.isFinite(total) && currency
            ? [[hotelId, { price: total, currency }] as const]
            : [];
        })
      );
    } catch {
      // Hotel names remain useful if the offers endpoint has no availability.
    }
  }

  return rawHotels.map((hotel) => {
    const price = prices.get(hotel.hotelId!);
    const lat = hotel.geoCode?.latitude;
    const lon = hotel.geoCode?.longitude;
    return {
      id: hotel.hotelId!,
      name: hotel.name!,
      distanceKm: hotel.distance?.value ?? null,
      coordinates:
        Number.isFinite(lat) && Number.isFinite(lon) ? { lat: lat!, lon: lon! } : undefined,
      price: price?.price ?? null,
      currency: price?.currency ?? null,
      priceLabel: price
        ? `From ${price.currency} ${Math.round(price.price)} / night`
        : "Check live rates",
    };
  });
}
