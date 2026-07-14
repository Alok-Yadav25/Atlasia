import { fetchJson } from "@/lib/place/http";
import { geocodePlace } from "@/lib/place/sources/geocoding";
import type { NatureData, NatureSpecies } from "@/types/features";

interface INaturalistSpeciesResponse {
  results?: Array<{
    count?: number;
    taxon?: {
      id?: number;
      name?: string;
      preferred_common_name?: string;
      default_photo?: { medium_url?: string };
    };
  }>;
}

async function speciesNear(
  lat: number,
  lon: number,
  iconicTaxa: string,
  group: NatureSpecies["group"]
): Promise<NatureSpecies[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lon),
    radius: "50",
    quality_grade: "research",
    iconic_taxa: iconicTaxa,
    per_page: "8",
    order_by: "observations_count",
    locale: "en",
  });
  const data = await fetchJson<INaturalistSpeciesResponse>(
    `https://api.inaturalist.org/v1/observations/species_counts?${params}`,
    { timeoutMs: 9_000 }
  );
  return (data.results ?? []).flatMap((entry) => {
    const taxon = entry.taxon;
    if (!taxon?.id || !taxon.name) return [];
    return [{
      id: taxon.id,
      name: taxon.preferred_common_name ?? taxon.name,
      scientificName: taxon.name,
      observations: entry.count ?? 0,
      imageUrl: taxon.default_photo?.medium_url ?? null,
      sourceUrl: `https://www.inaturalist.org/taxa/${taxon.id}`,
      group,
    }];
  });
}

export async function fetchNature(placeName: string): Promise<NatureData> {
  const geo = await geocodePlace(placeName);
  const [floraResult, faunaResult] = await Promise.allSettled([
    speciesNear(geo.lat, geo.lon, "Plantae", "flora"),
    speciesNear(geo.lat, geo.lon, "Aves,Mammalia,Reptilia,Amphibia,Actinopterygii,Insecta", "fauna"),
  ]);
  return {
    query: `${geo.name}, ${geo.country}`,
    center: { lat: geo.lat, lon: geo.lon },
    flora: floraResult.status === "fulfilled" ? floraResult.value : [],
    fauna: faunaResult.status === "fulfilled" ? faunaResult.value : [],
    note: "Nearby research-grade observations from iNaturalist within 50 km; this is not a complete biodiversity inventory.",
  };
}
