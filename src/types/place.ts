export type SourceState = "ok" | "error" | "unconfigured";

export interface SourceStatus {
  state: SourceState;
  label: string;
  message?: string;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface PlaceOverview {
  name: string;
  description: string;
  summary: string;
  country: string;
  countryCode: string;
  population: number | null;
  coordinates: Coordinates;
  timezone: string | null;
  imageUrl: string | null;
  wikipediaUrl: string | null;
  wikidataId: string | null;
}

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  condition: string;
  isDay: boolean;
  high: number;
  low: number;
  precipitationProbability: number;
}

export interface Attraction {
  id: string;
  name: string;
  description: string;
  category: string;
  coordinates?: Coordinates;
  distanceKm?: number;
}

export interface FoodHighlight {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface NotablePerson {
  id: string;
  name: string;
  occupation: string;
  party: string | null;
  imageUrl: string | null;
  url: string | null;
}

export interface TransportPoint {
  id: string;
  name: string;
  type: "airport" | "rail" | "metro" | "tram" | "bus";
  coordinates: Coordinates;
  distanceKm: number;
}

export interface MapPoint {
  id: string;
  name: string;
  type: "attraction" | "hotel" | TransportPoint["type"];
  coordinates: Coordinates;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  source: string;
  publishedAt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
}

export interface CostOfLiving {
  index: number | null;
  label: string;
  summary: string;
  score: number | null;
  sourceUrl: string | null;
}

export interface Hotel {
  id: string;
  name: string;
  distanceKm: number | null;
  coordinates?: Coordinates;
  price: number | null;
  currency: string | null;
  priceLabel: string;
}

export interface CurrencyData {
  code: string;
  name: string;
  symbol: string;
  rateFromUsd: number | null;
  updatedAt: string | null;
}

export interface CountryDetails {
  capital: string | null;
  languages: string[];
  flagUrl: string | null;
}

export interface PlaceData {
  query: string;
  generatedAt: string;
  expiresAt: string;
  cache: {
    hit: boolean;
    provider: "supabase" | "memory" | "none";
  };
  sources: Record<string, SourceStatus>;
  overview: PlaceOverview;
  weather: WeatherData | null;
  attractions: Attraction[];
  food: FoodHighlight[];
  notablePeople: NotablePerson[];
  transport: TransportPoint[];
  mapPoints: MapPoint[];
  news: NewsItem[];
  videos: VideoItem[];
  costOfLiving: CostOfLiving | null;
  hotels: Hotel[];
  currency: CurrencyData | null;
  countryDetails: CountryDetails;
}

export interface CitySuggestion extends Coordinates {
  name: string;
  country: string;
  countryCode: string;
}
