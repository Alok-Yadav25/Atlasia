import cityRows from "@/data/geonames.generated.json";
import { NextResponse, type NextRequest } from "next/server";

type CityRow = [string, string, string, number, number, number];

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 80) {
    return NextResponse.json({ suggestions: [] });
  }

  const normalizedQuery = normalize(query);
  const suggestions = (cityRows as CityRow[])
    .flatMap((row) => {
      const [name, asciiName, countryCode, lat, lon, population] = row;
      const normalizedName = normalize(name);
      const normalizedAscii = normalize(asciiName);
      const score = normalizedName.startsWith(normalizedQuery)
        ? 0
        : normalizedAscii.startsWith(normalizedQuery)
          ? 1
          : normalizedName.includes(normalizedQuery) || normalizedAscii.includes(normalizedQuery)
            ? 2
            : 9;
      return score < 9 ? [{ name, countryCode, lat, lon, population, score }] : [];
    })
    .sort((a, b) => a.score - b.score || b.population - a.population)
    .slice(0, 8)
    .map((city) => ({
      name: city.name,
      countryCode: city.countryCode,
      lat: city.lat,
      lon: city.lon,
      country: regionNames.of(city.countryCode) ?? city.countryCode,
    }));

  return NextResponse.json(
    { suggestions },
    { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } }
  );
}
