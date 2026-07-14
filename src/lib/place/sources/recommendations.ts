import cityRows from "@/data/geonames.generated.json";
import { distanceKm } from "@/lib/place/sources/openstreetmap";
import type { GeocodedPlace } from "@/lib/place/sources/geocoding";
import type { RecommendationData, RecommendedPlace } from "@/types/features";

type CityRow = [string, string, string, number, number, number];
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function normalized(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .split(",")[0]
    .trim();
}

function toRecommended(
  row: CityRow,
  center: { lat: number; lon: number },
  reason: string
): RecommendedPlace {
  const [name, , countryCode, lat, lon, population] = row;
  return {
    name,
    country: regionNames.of(countryCode) ?? countryCode,
    countryCode,
    coordinates: { lat, lon },
    population,
    distanceKm: Math.round(distanceKm(center, { lat, lon })),
    reason,
  };
}

export function buildPlaceRecommendations(geo: GeocodedPlace): RecommendationData {
  const center = { lat: geo.lat, lon: geo.lon };
  const queryName = normalized(geo.name);
  const ranked = (cityRows as CityRow[])
    .filter(([name, asciiName, , , , population]) => {
      return population >= 20_000 && normalized(name) !== queryName && normalized(asciiName) !== queryName;
    })
    .map((row) => ({ row, distance: distanceKm(center, { lat: row[3], lon: row[4] }) }))
    .sort((a, b) => a.distance - b.distance);

  const notableNearby = ranked
    .filter(({ row, distance }) => row[5] >= 75_000 && distance >= 25 && distance <= 350)
    .sort((a, b) => a.distance / Math.log10(a.row[5]) - b.distance / Math.log10(b.row[5]));
  const nearbyPool = notableNearby.length >= 3
    ? notableNearby
    : ranked.filter(({ distance }) => distance >= 18 && distance <= 350);
  const nearbyCities = nearbyPool
    .slice(0, 6)
    .map(({ row }) => toRecommended(row, center, "Close enough to extend the same journey"));

  const targetPopulation = Math.max(geo.population ?? 300_000, 50_000);
  const sameCountry = ranked
    .filter(({ row, distance }) => row[2] === geo.countryCode && distance > 80)
    .sort((a, b) => {
      const populationA = Math.abs(Math.log((a.row[5] + 1) / targetPopulation));
      const populationB = Math.abs(Math.log((b.row[5] + 1) / targetPopulation));
      return populationA - populationB || a.distance - b.distance;
    });
  const regional = ranked.filter(
    ({ row, distance }) => row[2] !== geo.countryCode && distance > 150 && distance < 2_500
  );
  const youMightLike = [...sameCountry.slice(0, 3), ...regional.slice(0, 3)]
    .filter(({ row }, index, values) => values.findIndex((item) => item.row[0] === row[0] && item.row[2] === row[2]) === index)
    .slice(0, 6)
    .map(({ row }) =>
      toRecommended(
        row,
        center,
        row[2] === geo.countryCode
          ? "A similarly scaled destination in the same country"
          : "A popular city within the wider region"
      )
    );

  return {
    query: geo.name,
    center,
    nearbyCities,
    youMightLike,
    note: "Suggestions use distance, country and population from the bundled GeoNames dataset—not personal tracking.",
  };
}
