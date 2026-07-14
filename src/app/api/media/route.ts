import { fetchPlacePhotos } from "@/lib/place/sources/media";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 20;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name || name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Provide a valid place name." }, { status: 400 });
  }
  try {
    const photos = await fetchPlacePhotos(name);
    return NextResponse.json({ query: name, photos }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return NextResponse.json({ query: name, photos: [] });
  }
}
