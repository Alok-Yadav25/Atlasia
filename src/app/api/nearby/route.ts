import { geocodePlace } from "@/lib/place/sources/geocoding";
import { emergencyNumbers } from "@/lib/place/sources/emergency";
import { fetchNearbyServices, fetchOpenStreetMap } from "@/lib/place/sources/openstreetmap";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name || name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Provide a valid place name." }, { status: 400 });
  }
  try {
    const geo = await geocodePlace(name);
    const center = { lat: geo.lat, lon: geo.lon };
    const [servicesResult, osmResult] = await Promise.allSettled([
      fetchNearbyServices(center),
      fetchOpenStreetMap(center),
    ]);
    const services = servicesResult.status === "fulfilled"
      ? servicesResult.value
      : { restaurants: [], hospitals: [], landmarks: [], states: { restaurants: "error" as const, hospitals: "error" as const, landmarks: "error" as const } };
    const hotels = osmResult.status === "fulfilled" ? osmResult.value.hotels : [];
    return NextResponse.json({
      query: name,
      center,
      hotels,
      restaurants: services.restaurants,
      hospitals: services.hospitals,
      landmarks: services.landmarks,
      emergency: emergencyNumbers(geo.countryCode),
      sourceState: {
        ...services.states,
        hotels: osmResult.status === "fulfilled" ? "ok" : "error",
      },
    }, {
      headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nearby discovery failed." },
      { status: 502 }
    );
  }
}
