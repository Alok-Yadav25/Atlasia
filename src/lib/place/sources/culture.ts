import { cleanText, fetchJson, truncate } from "@/lib/place/http";
import { fetchPlacePhotos } from "@/lib/place/sources/media";
import type { CultureData, CultureItem } from "@/types/features";

interface WikipediaPagesResponse {
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number;
        title?: string;
        extract?: string;
        thumbnail?: { source?: string };
      }
    >;
  };
}

interface OpenLibraryResponse {
  docs?: Array<{
    key?: string;
    title?: string;
    author_name?: string[];
    first_publish_year?: number;
    cover_i?: number;
    first_sentence?: string[] | string;
  }>;
}

async function fetchScreenStories(placeName: string): Promise<CultureItem[]> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `films set in "${placeName}" OR films shot in "${placeName}"`,
    gsrnamespace: "0",
    gsrlimit: "10",
    prop: "extracts|pageimages",
    exintro: "1",
    explaintext: "1",
    exchars: "360",
    piprop: "thumbnail",
    pithumbsize: "800",
    format: "json",
    origin: "*",
  });
  const data = await fetchJson<WikipediaPagesResponse>(
    `https://en.wikipedia.org/w/api.php?${params}`,
    { timeoutMs: 9_000 }
  );
  return Object.values(data.query?.pages ?? {})
    .filter((page) => page.pageid && page.title)
    .map((page) => ({
      id: `wiki-${page.pageid}`,
      title: page.title!,
      description: truncate(cleanText(page.extract ?? `Open the source to explore this screen connection to ${placeName}.`), 220),
      year: null,
      imageUrl: page.thumbnail?.source ?? null,
      url: `https://en.wikipedia.org/?curid=${page.pageid}`,
      kind: "movie" as const,
      byline: "Wikipedia screen connection",
    }))
    .slice(0, 8);
}

async function fetchBooks(placeName: string): Promise<CultureItem[]> {
  const params = new URLSearchParams({
    place: placeName,
    limit: "10",
    fields: "key,title,author_name,first_publish_year,cover_i,first_sentence",
  });
  const data = await fetchJson<OpenLibraryResponse>(
    `https://openlibrary.org/search.json?${params}`,
    { timeoutMs: 9_000 }
  );
  return (data.docs ?? [])
    .filter((book) => book.key && book.title)
    .map((book) => {
      const sentence = Array.isArray(book.first_sentence)
        ? book.first_sentence[0]
        : book.first_sentence;
      return {
        id: `book-${book.key}`,
        title: book.title!,
        description: truncate(
          cleanText(sentence ?? `A book catalogued by Open Library with ${placeName} as a place connection.`),
          220
        ),
        year: book.first_publish_year ?? null,
        imageUrl: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
          : null,
        url: `https://openlibrary.org${book.key}`,
        kind: "book" as const,
        byline: book.author_name?.slice(0, 2).join(", ") ?? "Open Library",
      };
    })
    .slice(0, 8);
}

export async function fetchCulture(placeName: string): Promise<CultureData> {
  const [moviesResult, booksResult, photosResult] = await Promise.allSettled([
    fetchScreenStories(placeName),
    fetchBooks(placeName),
    fetchPlacePhotos(placeName),
  ]);
  return {
    query: placeName,
    movies: moviesResult.status === "fulfilled" ? moviesResult.value : [],
    books: booksResult.status === "fulfilled" ? booksResult.value : [],
    photos: photosResult.status === "fulfilled" ? photosResult.value : [],
    sources: {
      wikipedia: moviesResult.status === "fulfilled" ? "ok" : "error",
      openLibrary: booksResult.status === "fulfilled" ? "ok" : "error",
      commons: photosResult.status === "fulfilled" ? "ok" : "error",
    },
  };
}
