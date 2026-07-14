import { cleanText, fetchJson, truncate } from "@/lib/place/http";
import type { EventItem, EventsData } from "@/types/features";

interface TicketmasterResponse {
  _embedded?: {
    events?: Array<{
      id?: string;
      name?: string;
      url?: string;
      info?: string;
      pleaseNote?: string;
      images?: Array<{ url?: string; ratio?: string; width?: number }>;
      dates?: { start?: { localDate?: string; localTime?: string; dateTime?: string }; end?: { dateTime?: string } };
      classifications?: Array<{ segment?: { name?: string }; genre?: { name?: string } }>;
      _embedded?: { venues?: Array<{ name?: string }> };
    }>;
  };
}

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

function categoryFor(value: string): EventItem["category"] {
  const text = value.toLocaleLowerCase();
  if (/sport|match|game|league|cup|race|tournament/.test(text)) return "sport";
  if (/dj|club|nightlife|party|dance/.test(text)) return "nightlife";
  if (/music|concert|festival|band|singer|tour/.test(text)) return "music";
  if (/museum|art|theatre|theater|culture|exhibition/.test(text)) return "culture";
  return "event-radar";
}

async function fetchTicketmaster(placeName: string): Promise<EventItem[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) throw new Error("Ticketmaster is not configured");
  const city = placeName.split(",")[0].trim();
  const params = new URLSearchParams({
    apikey: apiKey,
    city,
    size: "20",
    sort: "date,asc",
  });
  const data = await fetchJson<TicketmasterResponse>(
    `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
    { timeoutMs: 10_000 }
  );
  return (data._embedded?.events ?? []).flatMap((event) => {
    if (!event.id || !event.name || !event.url) return [];
    const classification = event.classifications?.[0];
    const categoryText = `${classification?.segment?.name ?? ""} ${classification?.genre?.name ?? ""}`;
    const start = event.dates?.start?.dateTime ?? [event.dates?.start?.localDate, event.dates?.start?.localTime].filter(Boolean).join("T");
    const image = [...(event.images ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? null;
    return [{
      id: event.id,
      title: event.name,
      description: truncate(cleanText(event.info ?? event.pleaseNote ?? "Open the official listing for details and availability."), 240),
      date: start || null,
      endDate: event.dates?.end?.dateTime ?? null,
      venue: event._embedded?.venues?.[0]?.name ?? null,
      category: categoryFor(categoryText),
      imageUrl: image,
      url: event.url,
      source: "Ticketmaster",
      dateIsVerified: true,
    } satisfies EventItem];
  });
}

async function fetchEventRadar(placeName: string): Promise<EventItem[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];
  const params = new URLSearchParams({
    q: `"${placeName}" (festival OR concert OR sport OR match OR DJ OR exhibition OR event)`,
    lang: "en",
    max: "10",
    sortby: "publishedAt",
    apikey: apiKey,
  });
  const data = await fetchJson<GNewsResponse>(`https://gnews.io/api/v4/search?${params}`, {
    timeoutMs: 9_000,
  });
  return (data.articles ?? []).flatMap((article, index) => {
    if (!article.title || !article.url) return [];
    return [{
      id: `event-radar-${index}-${article.publishedAt ?? "latest"}`,
      title: article.title,
      description: truncate(cleanText(article.description ?? "Open the source and verify the event date before making plans."), 240),
      date: article.publishedAt ?? null,
      endDate: null,
      venue: null,
      category: categoryFor(article.title),
      imageUrl: article.image ?? null,
      url: article.url,
      source: article.source?.name ?? "Event radar",
      dateIsVerified: false,
    } satisfies EventItem];
  });
}

export async function fetchEvents(placeName: string): Promise<EventsData> {
  try {
    const events = await fetchTicketmaster(placeName);
    if (events.length) {
      return {
        query: placeName,
        events,
        source: "ticketmaster",
        note: "Dates come from official ticket listings. Availability and schedules can still change.",
      };
    }
  } catch {
    // Fall through to current event coverage.
  }

  try {
    const events = await fetchEventRadar(placeName);
    return {
      query: placeName,
      events,
      source: events.length ? "gnews" : "none",
      note: events.length
        ? "These are current event signals from recent reporting, not verified schedules. Open the source and confirm the date and venue."
        : "No structured event provider is configured. Add TICKETMASTER_API_KEY for dated listings.",
    };
  } catch {
    return {
      query: placeName,
      events: [],
      source: "none",
      note: "Event discovery is temporarily unavailable. Your saved planner remains available on this device.",
    };
  }
}
