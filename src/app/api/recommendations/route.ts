import { geocodePlace } from "@/lib/place/sources/geocoding";
import { buildPlaceRecommendations } from "@/lib/place/sources/recommendations";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 15;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name || name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Provide a valid place name." }, { status: 400 });
  }
  try {
    const geo = await geocodePlace(name);
    return NextResponse.json(buildPlaceRecommendations(geo), {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recommendations could not be loaded." },
      { status: 502 }
    );
  }
}
