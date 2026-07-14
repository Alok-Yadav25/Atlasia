import { fetchPlaceGallery } from "@/lib/place/sources/gallery";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name || name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Provide a valid place name." }, { status: 400 });
  }
  const dishes = (request.nextUrl.searchParams.get("dishes") ?? "")
    .split("|")
    .map((dish) => dish.trim())
    .filter(Boolean)
    .slice(0, 6);
  try {
    const gallery = await fetchPlaceGallery(name, dishes);
    return NextResponse.json(gallery, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return NextResponse.json({
      query: name,
      photos: [],
      groups: { city: [], architecture: [], food: [], nature: [], culture: [] },
      dishPhotos: {},
      note: "The photo source is temporarily unavailable.",
    });
  }
}
