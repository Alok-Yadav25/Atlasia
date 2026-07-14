import { cleanText, fetchJson, truncate } from "@/lib/place/http";
import type { Attraction, FoodHighlight } from "@/types/place";

interface WikivoyageSearchResponse {
  query?: { search?: Array<{ title: string }> };
}

interface WikivoyageParseResponse {
  parse?: {
    title?: string;
    text?: { "*"?: string };
  };
}

interface WikipediaFoodSearchResponse {
  query?: {
    search?: Array<{ pageid?: number; title?: string; snippet?: string }>;
  };
}

interface MealDbResponse {
  meals?: Array<{ idMeal?: string; strMeal?: string; strMealThumb?: string }> | null;
}

const mealAreas: Record<string, string> = {
  CA: "Canadian", CN: "Chinese", HR: "Croatian", EG: "Egyptian", PH: "Filipino",
  FR: "French", GR: "Greek", IN: "Indian", IE: "Irish", IT: "Italian", JM: "Jamaican",
  JP: "Japanese", KE: "Kenyan", MY: "Malaysian", MX: "Mexican", MA: "Moroccan",
  NL: "Dutch", PL: "Polish", PT: "Portuguese", RU: "Russian", ES: "Spanish",
  TH: "Thai", TN: "Tunisian", TR: "Turkish", UA: "Ukrainian", GB: "British",
  US: "American", VN: "Vietnamese",
};

const signatureDishes: Record<string, string[]> = {
  AR: ["Empanadas", "Asado", "Milanesa", "Dulce de leche"],
  AU: ["Meat pie", "Barramundi", "Lamington", "Pavlova"],
  BR: ["Feijoada", "Pão de queijo", "Moqueca", "Brigadeiro"],
  DE: ["Bratwurst", "Sauerbraten", "Kartoffelpuffer", "Black Forest cake"],
  FR: ["Croissant", "Coq au vin", "Ratatouille", "Crêpes", "French onion soup", "Macarons"],
  ID: ["Nasi goreng", "Satay", "Rendang", "Gado-gado"],
  KR: ["Kimchi", "Bibimbap", "Bulgogi", "Tteokbokki"],
  NZ: ["Hāngi", "Green-lipped mussels", "Pavlova", "Hokey pokey ice cream"],
  PE: ["Ceviche", "Lomo saltado", "Ají de gallina", "Anticuchos"],
  SG: ["Hainanese chicken rice", "Chilli crab", "Laksa", "Kaya toast"],
  ZA: ["Bobotie", "Bunny chow", "Boerewors", "Malva pudding"],
};

function extractSection(html: string, ids: string[]): string {
  for (const id of ids) {
    const match = new RegExp(`id=["']${id.replace(/ /g, "[_ ]")}["']`, "i").exec(html);
    if (!match?.index) continue;
    const start = html.lastIndexOf("<h2", match.index);
    const end = html.indexOf("<h2", match.index + id.length);
    return html.slice(Math.max(0, start), end === -1 ? html.length : end);
  }
  return "";
}

function listItems(section: string): string[] {
  return [...section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => match[1])
    .filter((value) => !value.includes("<li"));
}

function itemName(html: string, text: string): string {
  const bold = html.match(/<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/i)?.[1];
  const linked = html.match(/<a[^>]*>([\s\S]*?)<\/a>/i)?.[1];
  const preferred = cleanText(bold ?? linked ?? "");
  if (preferred.length >= 2 && preferred.length <= 90) return preferred;
  return text.split(/[.:;–—]/)[0].trim().slice(0, 90);
}

function unique<T extends { name: string }>(items: T[]): T[] {
  const names = new Set<string>();
  return items.filter((item) => {
    const key = item.name.toLocaleLowerCase();
    if (names.has(key)) return false;
    names.add(key);
    return true;
  });
}

async function fetchWikipediaFoodHighlights(query: string): Promise<FoodHighlight[]> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: `"${query}" food dish`,
    srlimit: "16",
    srnamespace: "0",
    format: "json",
    origin: "*",
  });
  const data = await fetchJson<WikipediaFoodSearchResponse>(
    `https://en.wikipedia.org/w/api.php?${params}`,
    { timeoutMs: 8_000 }
  );
  const foodTerms = /\b(dish|cuisine|food|meal|recipe|snack|bread|rice|soup|noodle|meat|sweet|dessert|cake|curry|stew|pastry|restaurant)\b/i;
  const genericTitle = /^(list of|history of|traditional food$)|\b(people|district|temple|film|television|chef)\b/i;
  return (data.query?.search ?? [])
    .flatMap((result, index): FoodHighlight[] => {
      const name = cleanText(result.title ?? "");
      const description = cleanText(result.snippet ?? "");
      if (!name || genericTitle.test(name) || !foodTerms.test(`${name} ${description}`)) return [];
      return [{
        id: `wp-food-${result.pageid ?? index}-${name.toLocaleLowerCase().replace(/\W+/g, "-")}`,
        name,
        description: truncate(description || `A food reference associated with ${query}.`, 170),
      }];
    })
    .slice(0, 6);
}

async function fetchMealDbHighlights(countryCode?: string): Promise<FoodHighlight[]> {
  const area = countryCode ? mealAreas[countryCode] : undefined;
  if (!area) return [];
  const data = await fetchJson<MealDbResponse>(
    `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(area)}`,
    { timeoutMs: 8_000 }
  );
  return (data.meals ?? []).slice(0, 6).flatMap((meal, index) => {
    if (!meal.strMeal) return [];
    return [{
      id: `mealdb-${meal.idMeal ?? index}`,
      name: meal.strMeal,
      description: `A ${area.toLocaleLowerCase()} dish to look for in local restaurants and traditional kitchens.`,
      imageUrl: meal.strMealThumb,
    }];
  });
}

async function fallbackFood(query: string, countryCode?: string): Promise<FoodHighlight[]> {
  try {
    const wikipedia = await fetchWikipediaFoodHighlights(query);
    if (wikipedia.length) return wikipedia;
  } catch {
    // TheMealDB keeps the food experience useful during Wikimedia rate limiting.
  }
  try {
    const meals = await fetchMealDbHighlights(countryCode);
    if (meals.length) return meals;
  } catch {
    // Continue to a small, transparent country-level signature-dish fallback.
  }

  return (countryCode ? signatureDishes[countryCode] ?? [] : []).map((name, index) => ({
    id: `signature-dish-${countryCode?.toLocaleLowerCase() ?? "local"}-${index}`,
    name,
    description: `A well-known ${query} food reference to look for in traditional kitchens and local restaurants.`,
  }));
}

export async function fetchWikivoyage(
  query: string,
  countryCode?: string
): Promise<{ attractions: Attraction[]; food: FoodHighlight[] }> {
  const searchParams = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: "1",
    format: "json",
    origin: "*",
  });
  let html = "";
  try {
    const search = await fetchJson<WikivoyageSearchResponse>(
      `https://en.wikivoyage.org/w/api.php?${searchParams}`
    );
    const title = search.query?.search?.[0]?.title ?? query;
    const parseParams = new URLSearchParams({
      action: "parse",
      page: title,
      prop: "text",
      format: "json",
      origin: "*",
      redirects: "1",
    });
    const parsed = await fetchJson<WikivoyageParseResponse>(
      `https://en.wikivoyage.org/w/api.php?${parseParams}`,
      { timeoutMs: 11_000 }
    );
    html = parsed.parse?.text?.["*"] ?? "";
  } catch {
    return { attractions: [], food: await fallbackFood(query, countryCode) };
  }
  if (!html) return { attractions: [], food: await fallbackFood(query, countryCode) };

  const seeSection = [extractSection(html, ["See"]), extractSection(html, ["Do"])]
    .filter(Boolean)
    .join(" ");
  const eatSection = extractSection(html, ["Eat", "Eat_and_drink"]);

  const attractions = unique(
    listItems(seeSection)
      .map((item, index): Attraction | null => {
        const text = cleanText(item);
        const name = itemName(item, text);
        if (name.length < 2 || name.endsWith(":") || text.length < 12) return null;
        return {
          id: `wv-attraction-${index}-${name.toLocaleLowerCase().replace(/\W+/g, "-")}`,
          name,
          description: truncate(text.replace(name, "").replace(/^[\s,.:;–—-]+/, ""), 210),
          category: "Wikivoyage pick",
        };
      })
      .filter((item): item is Attraction => item !== null)
  ).slice(0, 8);

  let food = unique(
    listItems(eatSection)
      .map((item, index): FoodHighlight | null => {
        const text = cleanText(item);
        const name = itemName(item, text);
        if (name.length < 2 || text.length < 10) return null;
        return {
          id: `wv-food-${index}-${name.toLocaleLowerCase().replace(/\W+/g, "-")}`,
          name,
          description: truncate(text.replace(name, "").replace(/^[\s,.:;–—-]+/, ""), 170),
        };
      })
      .filter((item): item is FoodHighlight => item !== null)
  ).slice(0, 6);

  if (!food.length) food = await fallbackFood(query, countryCode);

  return { attractions, food };
}
