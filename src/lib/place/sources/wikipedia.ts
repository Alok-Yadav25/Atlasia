import { fetchJson, truncate } from "@/lib/place/http";

interface WikipediaSearchResponse {
  query?: {
    search?: Array<{ title: string }>;
  };
}

interface WikipediaSummary {
  title: string;
  description?: string;
  extract?: string;
  wikibase_item?: string;
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
}

export interface WikipediaPlace {
  title: string;
  description: string;
  summary: string;
  imageUrl: string | null;
  wikipediaUrl: string | null;
  wikidataId: string | null;
}

export async function fetchWikipediaPlace(query: string): Promise<WikipediaPlace> {
  const searchParams = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srnamespace: "0",
    srlimit: "1",
    format: "json",
    origin: "*",
  });
  const search = await fetchJson<WikipediaSearchResponse>(
    `https://en.wikipedia.org/w/api.php?${searchParams}`
  );
  const title = search.query?.search?.[0]?.title ?? query;
  const summary = await fetchJson<WikipediaSummary>(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );

  return {
    title: summary.title,
    description: summary.description ?? "A place worth exploring",
    summary: truncate(summary.extract ?? `Discover ${summary.title}.`, 760),
    imageUrl: summary.originalimage?.source ?? summary.thumbnail?.source ?? null,
    wikipediaUrl: summary.content_urls?.desktop?.page ?? null,
    wikidataId: summary.wikibase_item ?? null,
  };
}
