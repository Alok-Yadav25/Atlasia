import { findLocalCity } from "@/data/cities";
import { fetchJson, toNumber } from "@/lib/place/http";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    country?: string;
    country_code?: string;
  };
  extratags?: {
    population?: string;
  };
}

export interface GeocodedPlace {
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  country: string;
  countryCode: string;
  population: number | null;
  type: string;
}

export async function geocodePlace(query: string): Promise<GeocodedPlace> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
    limit: "1",
    featuretype: "settlement",
    "accept-language": "en",
  });

  try {
    const results = await fetchJson<NominatimResult[]>(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { timeoutMs: 8_000 }
    );
    const result = results[0];

    if (!result) throw new Error("Place was not found");

    const lat = Number(result.lat);
    const lon = Number(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new Error("Place coordinates were invalid");
    }

    const address = result.address ?? {};
    return {
      name:
        result.name ??
        address.city ??
        address.town ??
        address.village ??
        address.municipality ??
        query.split(",")[0].trim(),
      displayName: result.display_name,
      lat,
      lon,
      country: address.country ?? "Unknown country",
      countryCode: (address.country_code ?? "").toUpperCase(),
      population: toNumber(result.extratags?.population),
      type: result.type,
    };
  } catch (error) {
    const local = findLocalCity(query);
    if (!local) throw error;

    return {
      name: local.name,
      displayName: `${local.name}, ${local.country}`,
      lat: local.lat,
      lon: local.lon,
      country: local.country,
      countryCode: local.countryCode,
      population: null,
      type: "city",
    };
  }
}
