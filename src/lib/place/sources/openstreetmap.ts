import { fetchJson, truncate } from "@/lib/place/http";
import type { NearbyPlace } from "@/types/features";
import type {
  Attraction,
  Coordinates,
  Hotel,
  MapPoint,
  TransportPoint,
} from "@/types/place";

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: Coordinates;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const radius = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function coordinates(element: OverpassElement): Coordinates | null {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat: lat!, lon: lon! } : null;
}

function namedElements(elements: OverpassElement[]): OverpassElement[] {
  return elements.filter((element) => {
    const point = coordinates(element);
    const tags = element.tags ?? {};
    return Boolean(point && (tags.name || tags["name:en"]));
  });
}

export async function runOverpass(query: string, timeoutMs = 9_000): Promise<OverpassElement[]> {
  const endpoints = process.env.OVERPASS_API_URL
    ? [process.env.OVERPASS_API_URL]
    : [
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass-api.de/api/interpreter",
        "https://overpass.nchc.org.tw/api/interpreter",
      ];

  try {
    const data = await Promise.any(
      endpoints.map((endpoint) =>
        fetchJson<OverpassResponse>(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: new URLSearchParams({ data: query }),
          timeoutMs,
        })
      )
    );
    return namedElements(data.elements ?? []);
  } catch {
    throw new Error("OpenStreetMap nearby search timed out");
  }
}

function transportType(tags: Record<string, string>): TransportPoint["type"] | null {
  if (tags.aeroway === "aerodrome" || tags.aeroway === "terminal") return "airport";
  if (tags.railway === "subway_entrance" || tags.station === "subway") return "metro";
  if (tags.railway === "tram_stop") return "tram";
  if (tags.railway === "station" || tags.railway === "halt") return "rail";
  if (tags.highway === "bus_stop" || tags.amenity === "bus_station") return "bus";
  return null;
}

function attractionCategory(tags: Record<string, string>): string {
  if (tags.tourism === "museum") return "Museum";
  if (tags.tourism === "viewpoint") return "Viewpoint";
  if (tags.tourism === "gallery") return "Gallery";
  if (tags.tourism === "zoo") return "Zoo";
  if (tags.tourism === "theme_park") return "Theme park";
  return "Attraction";
}

export async function fetchOpenStreetMap(
  center: Coordinates
): Promise<{
  attractions: Attraction[];
  transport: TransportPoint[];
  hotels: Hotel[];
  mapPoints: MapPoint[];
}> {
  const attractionQuery = `[out:json][timeout:9];nwr(around:8000,${center.lat},${center.lon})["tourism"~"attraction|museum|gallery|viewpoint|zoo|theme_park"]["name"];out center tags qt 90;`;
  const transportQuery = `[out:json][timeout:9];(
    nwr(around:18000,${center.lat},${center.lon})["railway"~"station|halt|tram_stop|subway_entrance"]["name"];
    nwr(around:6500,${center.lat},${center.lon})["highway"="bus_stop"]["name"];
    nwr(around:16000,${center.lat},${center.lon})["amenity"="bus_station"]["name"];
    nwr(around:50000,${center.lat},${center.lon})["aeroway"~"aerodrome|terminal"]["name"];
  );out center tags qt 100;`;
  const hotelQuery = `[out:json][timeout:9];nwr(around:12000,${center.lat},${center.lon})["tourism"~"hotel|hostel|guest_house|motel"]["name"];out center tags qt 100;`;

  const [attractionResult, transportResult, hotelResult] = await Promise.allSettled([
    runOverpass(attractionQuery),
    runOverpass(transportQuery),
    runOverpass(hotelQuery),
  ]);

  if (
    attractionResult.status === "rejected" &&
    transportResult.status === "rejected" &&
    hotelResult.status === "rejected"
  ) {
    throw new Error("OpenStreetMap points timed out; the rest of the guide is still available");
  }

  const attractions: Attraction[] = [];
  const transport: TransportPoint[] = [];
  const hotels: Hotel[] = [];
  const mapPoints: MapPoint[] = [];

  for (const element of attractionResult.status === "fulfilled" ? attractionResult.value : []) {
    const point = coordinates(element)!;
    const tags = element.tags ?? {};
    const name = tags.name ?? tags["name:en"]!;
    const id = `osm-${element.type}-${element.id}`;
    const distance = Number(distanceKm(center, point).toFixed(1));
    const category = attractionCategory(tags);
    attractions.push({
      id,
      name,
      description: truncate(
        tags.description ?? `${category} about ${distance.toFixed(1)} km from the city centre.`,
        190
      ),
      category,
      coordinates: point,
      distanceKm: distance,
    });
    mapPoints.push({ id, name, type: "attraction", coordinates: point });
  }

  for (const element of transportResult.status === "fulfilled" ? transportResult.value : []) {
    const point = coordinates(element)!;
    const tags = element.tags ?? {};
    const name = tags.name ?? tags["name:en"]!;
    const type = transportType(tags);
    if (!type) continue;
    const id = `osm-${element.type}-${element.id}`;
    const distance = Number(distanceKm(center, point).toFixed(1));
    transport.push({ id, name, type, coordinates: point, distanceKm: distance });
    mapPoints.push({ id, name, type, coordinates: point });
  }

  for (const element of hotelResult.status === "fulfilled" ? hotelResult.value : []) {
    const point = coordinates(element)!;
    const tags = element.tags ?? {};
    const name = tags.name ?? tags["name:en"]!;
    const id = `osm-${element.type}-${element.id}`;
    const distance = Number(distanceKm(center, point).toFixed(1));
    hotels.push({
      id,
      name,
      distanceKm: distance,
      coordinates: point,
      price: null,
      currency: null,
      priceLabel: tags.stars ? `${tags.stars}-star property · verify availability` : "Verify availability",
    });
    mapPoints.push({ id, name, type: "hotel", coordinates: point });
  }

  return {
    attractions: attractions.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99)).slice(0, 10),
    transport: transport.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 18),
    hotels: hotels.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99)).slice(0, 14),
    mapPoints: mapPoints.slice(0, 70),
  };
}

function nearbyPlace(element: OverpassElement, center: Coordinates, category: NearbyPlace["category"]): NearbyPlace {
  const point = coordinates(element)!;
  const tags = element.tags ?? {};
  return {
    id: `osm-${element.type}-${element.id}`,
    name: tags.name ?? tags["name:en"]!,
    category,
    coordinates: point,
    distanceKm: Number(distanceKm(center, point).toFixed(1)),
    cuisine: tags.cuisine?.replaceAll(";", ", "),
    phone: tags.phone ?? tags["contact:phone"],
    website: tags.website ?? tags["contact:website"],
    openingHours: tags.opening_hours,
  };
}

export async function fetchNearbyServices(center: Coordinates): Promise<{
  restaurants: NearbyPlace[];
  hospitals: NearbyPlace[];
  landmarks: NearbyPlace[];
  states: Record<string, "ok" | "error">;
}> {
  const restaurantQuery = `[out:json][timeout:8];nwr(around:6500,${center.lat},${center.lon})["amenity"~"restaurant|cafe|fast_food"]["name"];out center tags qt 120;`;
  const hospitalQuery = `[out:json][timeout:8];nwr(around:12000,${center.lat},${center.lon})["amenity"~"hospital|clinic|doctors|pharmacy"]["name"];out center tags qt 120;`;
  const landmarkQuery = `[out:json][timeout:8];(
    nwr(around:10000,${center.lat},${center.lon})["historic"~"monument|memorial|castle|ruins|archaeological_site"]["name"];
    nwr(around:15000,${center.lat},${center.lon})["tourism"="zoo"]["name"];
    nwr(around:20000,${center.lat},${center.lon})["leisure"="nature_reserve"]["name"];
    nwr(around:14000,${center.lat},${center.lon})["leisure"~"park|garden"]["name"];
    nwr(around:22000,${center.lat},${center.lon})["boundary"="protected_area"]["name"];
  );out center tags qt 100;`;

  const [restaurantsResult, hospitalsResult, landmarksResult] = await Promise.allSettled([
    runOverpass(restaurantQuery, 8_000),
    runOverpass(hospitalQuery, 8_000),
    runOverpass(landmarkQuery, 8_000),
  ]);

  const restaurants = (restaurantsResult.status === "fulfilled" ? restaurantsResult.value : [])
    .map((element) =>
      nearbyPlace(
        element,
        center,
        element.tags?.amenity === "cafe" ? "cafe" : "restaurant"
      )
    )
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 24);
  const hospitals = (hospitalsResult.status === "fulfilled" ? hospitalsResult.value : [])
    .map((element) => {
      const amenity = element.tags?.amenity;
      return nearbyPlace(
        element,
        center,
        amenity === "pharmacy" ? "pharmacy" : amenity === "hospital" ? "hospital" : "clinic"
      );
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 24);
  const landmarks = (landmarksResult.status === "fulfilled" ? landmarksResult.value : [])
    .map((element) => {
      const tags = element.tags ?? {};
      const category = tags.leisure === "park" || tags.leisure === "garden"
        ? "flora"
        : tags.tourism === "zoo" || tags.leisure === "nature_reserve" || tags.boundary === "protected_area"
          ? "wildlife"
          : tags.historic === "monument" || tags.historic === "memorial"
            ? "monument"
            : "building";
      return nearbyPlace(element, center, category);
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 20);

  return {
    restaurants,
    hospitals,
    landmarks,
    states: {
      restaurants: restaurantsResult.status === "fulfilled" ? "ok" : "error",
      hospitals: hospitalsResult.status === "fulfilled" ? "ok" : "error",
      landmarks: landmarksResult.status === "fulfilled" ? "ok" : "error",
    },
  };
}
