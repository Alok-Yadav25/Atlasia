import { fetchJson } from "@/lib/place/http";
import { geocodePlace } from "@/lib/place/sources/geocoding";
import { getAmadeusToken } from "@/lib/place/sources/extras";
import { distanceKm } from "@/lib/place/sources/openstreetmap";
import type { FlightOffer, TravelData, TravelLink } from "@/types/features";

interface AmadeusLocationResponse {
  data?: Array<{ iataCode?: string; subType?: string }>;
}

interface AmadeusFlightResponse {
  data?: Array<{
    id?: string;
    itineraries?: Array<{
      duration?: string;
      segments?: Array<{
        carrierCode?: string;
        departure?: { at?: string };
        arrival?: { at?: string };
      }>;
    }>;
    price?: { grandTotal?: string; currency?: string };
  }>;
}

function isoDuration(value = ""): string {
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return value || "Check duration";
  return [match[1] ? `${match[1]}h` : "", match[2] ? `${match[2]}m` : ""].filter(Boolean).join(" ");
}

function travelLinks(from: string, to: string, date: string, isIndia: boolean): TravelLink[] {
  const flightQuery = encodeURIComponent(`Flights from ${from} to ${to} ${date}`);
  const routeQuery = encodeURIComponent(`${from} to ${to}`);
  const links: TravelLink[] = [
    {
      id: "google-flights",
      label: "Compare flights",
      kind: "flight",
      url: `https://www.google.com/travel/flights?q=${flightQuery}`,
      note: "Open live airline and agency results in Google Flights.",
    },
    {
      id: "rome2rio",
      label: "See every route",
      kind: "route",
      url: `https://www.rome2rio.com/map/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
      note: "Compare rail, bus, ferry, driving and flight options.",
    },
    {
      id: "trainline",
      label: "Search train tickets",
      kind: "train",
      url: `https://www.thetrainline.com/search/${routeQuery}`,
      note: "Useful for supported national and cross-border rail networks.",
    },
  ];
  if (isIndia) {
    links.push({
      id: "irctc",
      label: "Book Indian Railways",
      kind: "train",
      url: "https://www.irctc.co.in/nget/train-search",
      note: "Official Indian Railways booking; enter the stations on IRCTC.",
    });
  }
  return links;
}

async function findIata(city: string, token: string, baseUrl: string): Promise<string | null> {
  const keyword = city.split(",")[0].replace(/[^a-z\s-]/gi, "").trim().slice(0, 35);
  if (keyword.length < 2) return null;
  const params = new URLSearchParams({ subType: "CITY,AIRPORT", keyword, "page[limit]": "8", sort: "analytics.travelers.score" });
  const result = await fetchJson<AmadeusLocationResponse>(`${baseUrl}/v1/reference-data/locations?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: 9_000,
  });
  return result.data?.find((location) => location.subType === "CITY" && location.iataCode)?.iataCode
    ?? result.data?.find((location) => location.iataCode)?.iataCode
    ?? null;
}

async function fetchFlightOffers(
  origin: string,
  destination: string,
  date: string,
  adults: number,
  token: string,
  baseUrl: string
): Promise<FlightOffer[]> {
  const params = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: date,
    adults: String(adults),
    max: "8",
    currencyCode: "USD",
  });
  const response = await fetchJson<AmadeusFlightResponse>(`${baseUrl}/v2/shopping/flight-offers?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: 14_000,
  });
  return (response.data ?? []).flatMap((offer, index) => {
    const itinerary = offer.itineraries?.[0];
    const segments = itinerary?.segments ?? [];
    const first = segments[0];
    const last = segments.at(-1);
    const price = Number(offer.price?.grandTotal);
    if (!first?.departure?.at || !last?.arrival?.at || !Number.isFinite(price)) return [];
    return [{
      id: offer.id ?? `flight-${index}`,
      carrier: first.carrierCode ?? "Airline",
      departure: first.departure.at,
      arrival: last.arrival.at,
      duration: isoDuration(itinerary?.duration),
      stops: Math.max(segments.length - 1, 0),
      price,
      currency: offer.price?.currency ?? "USD",
      bookingUrl: null,
    }];
  });
}

export async function fetchTravelOptions(
  from: string,
  to: string,
  date: string,
  adults: number
): Promise<TravelData> {
  const [originGeo, destinationGeo] = await Promise.all([geocodePlace(from), geocodePlace(to)]);
  const centerA = { lat: originGeo.lat, lon: originGeo.lon };
  const centerB = { lat: destinationGeo.lat, lon: destinationGeo.lon };
  const international = originGeo.countryCode !== destinationGeo.countryCode;
  const links = travelLinks(from, to, date, !international && originGeo.countryCode === "IN");
  let originIata: string | null = null;
  let destinationIata: string | null = null;
  let flightOffers: FlightOffer[] = [];
  let source: TravelData["source"] = "search-handoff";

  try {
    const { token, baseUrl } = await getAmadeusToken();
    [originIata, destinationIata] = await Promise.all([
      findIata(originGeo.name, token, baseUrl),
      findIata(destinationGeo.name, token, baseUrl),
    ]);
    if (originIata && destinationIata && originIata !== destinationIata) {
      flightOffers = await fetchFlightOffers(originIata, destinationIata, date, adults, token, baseUrl);
      if (flightOffers.length) source = "amadeus";
    }
  } catch {
    // Provider handoffs remain useful when Amadeus is unavailable or has no test inventory.
  }

  return {
    from: `${originGeo.name}, ${originGeo.country}`,
    to: `${destinationGeo.name}, ${destinationGeo.country}`,
    international,
    distanceKm: Math.round(distanceKm(centerA, centerB)),
    originIata,
    destinationIata,
    flightOffers,
    links,
    source,
    note: flightOffers.length
      ? "Sample live flight offers are from Amadeus. Final availability and fare are confirmed by the booking provider."
      : "Free public APIs do not provide universal live flight and train fares. These links hand off to live providers without inventing prices.",
  };
}
