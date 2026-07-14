import { fetchCulture } from "@/lib/place/sources/culture";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 25;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name || name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Provide a valid place name." }, { status: 400 });
  }
  const data = await fetchCulture(name);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
