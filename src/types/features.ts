import type { Coordinates, Hotel } from "@/types/place";

export type NearbyCategory =
  | "restaurant"
  | "cafe"
  | "hospital"
  | "clinic"
  | "pharmacy"
  | "monument"
  | "building"
  | "flora"
  | "wildlife";

export interface NearbyPlace {
  id: string;
  name: string;
  category: NearbyCategory;
  coordinates: Coordinates;
  distanceKm: number;
  cuisine?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
}

export interface PlacePhoto {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  sourceUrl: string;
  credit: string;
}

export interface NearbyFeatureData {
  query: string;
  center: Coordinates;
  hotels: Hotel[];
  restaurants: NearbyPlace[];
  hospitals: NearbyPlace[];
  landmarks: NearbyPlace[];
  emergency: {
    police: string | null;
    ambulance: string | null;
    fire: string | null;
    general: string | null;
    note: string;
  };
  sourceState: Record<string, "ok" | "error">;
}

export interface CultureItem {
  id: string;
  title: string;
  description: string;
  year: number | null;
  imageUrl: string | null;
  url: string;
  kind: "movie" | "book";
  byline: string;
}

export interface CultureData {
  query: string;
  movies: CultureItem[];
  books: CultureItem[];
  photos: PlacePhoto[];
  sources: Record<string, "ok" | "error">;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string | null;
  endDate: string | null;
  venue: string | null;
  category: "sport" | "music" | "nightlife" | "culture" | "event-radar";
  imageUrl: string | null;
  url: string;
  source: string;
  dateIsVerified: boolean;
}

export interface EventsData {
  query: string;
  events: EventItem[];
  source: "ticketmaster" | "gnews" | "none";
  note: string;
}

export type GalleryCategory = "city" | "architecture" | "food" | "nature" | "culture";

export interface GalleryPhoto extends PlacePhoto {
  category: GalleryCategory;
  query: string;
}

export interface GalleryData {
  query: string;
  photos: GalleryPhoto[];
  groups: Record<GalleryCategory, GalleryPhoto[]>;
  dishPhotos: Record<string, PlacePhoto[]>;
  note: string;
}

export interface RecommendedPlace {
  name: string;
  country: string;
  countryCode: string;
  coordinates: Coordinates;
  population: number;
  distanceKm: number;
  reason: string;
}

export interface RecommendationData {
  query: string;
  center: Coordinates;
  nearbyCities: RecommendedPlace[];
  youMightLike: RecommendedPlace[];
  note: string;
}

export interface TravelLink {
  id: string;
  label: string;
  kind: "flight" | "train" | "route";
  url: string;
  note: string;
}

export interface FlightOffer {
  id: string;
  carrier: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  bookingUrl: string | null;
}

export interface TravelData {
  from: string;
  to: string;
  international: boolean;
  distanceKm: number;
  originIata: string | null;
  destinationIata: string | null;
  flightOffers: FlightOffer[];
  links: TravelLink[];
  source: "amadeus" | "search-handoff";
  note: string;
}

export interface TrafficData {
  query: string;
  center: Coordinates;
  localTime: string;
  signal: {
    level: "light" | "moderate" | "busy" | "heavy";
    label: string;
    summary: string;
    estimated: boolean;
  };
  flow: {
    currentSpeedKph: number;
    freeFlowSpeedKph: number;
    confidence: number;
    roadClosure: boolean;
  } | null;
  provider: "tomtom" | "planning-estimate";
  mapLinks: Array<{ label: string; url: string }>;
  note: string;
}

export interface NatureSpecies {
  id: number;
  name: string;
  scientificName: string;
  observations: number;
  imageUrl: string | null;
  sourceUrl: string;
  group: "flora" | "fauna";
}

export interface NatureData {
  query: string;
  center: Coordinates;
  flora: NatureSpecies[];
  fauna: NatureSpecies[];
  note: string;
}
