import { fetchEvents } from "@/lib/place/sources/events";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 20;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name || name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Provide a valid place name." }, { status: 400 });
  }
  const data = await fetchEvents(name);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=7200" },
  });
}
