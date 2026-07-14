import { fetchTraffic } from "@/lib/place/sources/traffic";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 20;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name || name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Provide a valid place name." }, { status: 400 });
  }
  try {
    return NextResponse.json(await fetchTraffic(name), {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Traffic could not be loaded." },
      { status: 502 }
    );
  }
}
