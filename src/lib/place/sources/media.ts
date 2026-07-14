import { cleanText, fetchJson } from "@/lib/place/http";
import type { PlacePhoto } from "@/types/features";

interface CommonsResponse {
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number;
        title?: string;
        imageinfo?: Array<{
          url?: string;
          thumburl?: string;
          descriptionurl?: string;
          extmetadata?: {
            Artist?: { value?: string };
            Credit?: { value?: string };
          };
        }>;
      }
    >;
  };
}

export async function searchCommonsPhotos(
  query: string,
  limit = 10,
  width = 1600
): Promise<PlacePhoto[]> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: String(Math.min(Math.max(limit, 1), 30)),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: String(width),
    format: "json",
    origin: "*",
  });
  const data = await fetchJson<CommonsResponse>(
    `https://commons.wikimedia.org/w/api.php?${params}`,
    { timeoutMs: 9_000 }
  );

  return Object.values(data.query?.pages ?? {}).flatMap((page) => {
    const info = page.imageinfo?.[0];
    const source = info?.url;
    if (!source || !/\.(jpe?g|png|webp)(\?|$)/i.test(source)) return [];
    const title = (page.title ?? "Place photo").replace(/^File:/, "").replace(/\.[^.]+$/, "");
    const artist = cleanText(info?.extmetadata?.Artist?.value ?? "Wikimedia Commons contributor");
    return [
      {
        id: String(page.pageid ?? source),
        title,
        url: source,
        thumbnailUrl: info?.thumburl ?? source,
        sourceUrl: info?.descriptionurl ?? source,
        credit: artist || "Wikimedia Commons contributor",
      },
    ];
  });
}

export async function fetchPlacePhotos(placeName: string): Promise<PlacePhoto[]> {
  const searches = await Promise.allSettled([
    searchCommonsPhotos(`"${placeName}" landmark`),
    searchCommonsPhotos(`"${placeName}" cityscape architecture`),
  ]);
  const seen = new Set<string>();
  return searches
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((photo) => {
      if (seen.has(photo.url)) return false;
      seen.add(photo.url);
      return true;
    })
    .slice(0, 14);
}
