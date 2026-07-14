import { aggregatePlace } from "@/lib/place/aggregate";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();

  if (!name || name.length < 2 || name.length > 120) {
    return NextResponse.json(
      { error: "Provide a place name between 2 and 120 characters." },
      { status: 400 }
    );
  }

  try {
    const data = await aggregatePlace(name);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Atlasia could not load this destination.",
      },
      { status: 502 }
    );
  }
}
