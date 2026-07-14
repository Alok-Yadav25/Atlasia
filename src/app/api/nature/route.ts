import { fetchNature } from "@/lib/place/sources/nature";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 20;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name || name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Provide a valid place name." }, { status: 400 });
  }
  try {
    return NextResponse.json(await fetchNature(name), {
      headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nature observations could not be loaded." },
      { status: 502 }
    );
  }
}
