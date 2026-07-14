import { fetchTravelOptions } from "@/lib/place/sources/travel";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 30;

function validPlace(value: string | null): value is string {
  return Boolean(value && value.trim().length >= 2 && value.trim().length <= 120);
}

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const date = request.nextUrl.searchParams.get("date") ?? new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const adults = Math.min(Math.max(Number(request.nextUrl.searchParams.get("adults") ?? 1), 1), 9);
  if (!validPlace(from) || !validPlace(to) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Provide valid origin, destination and travel date." }, { status: 400 });
  }
  try {
    const data = await fetchTravelOptions(from.trim(), to.trim(), date, adults);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Travel options could not be loaded." },
      { status: 502 }
    );
  }
}
