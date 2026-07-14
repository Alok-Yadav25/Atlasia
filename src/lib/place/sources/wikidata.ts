import { fetchJson } from "@/lib/place/http";
import type { NotablePerson } from "@/types/place";

interface SparqlBinding {
  person?: { value: string };
  personLabel?: { value: string };
  occupationLabel?: { value: string };
  partyLabel?: { value: string };
  image?: { value: string };
  article?: { value: string };
}

interface SparqlResponse {
  results?: { bindings?: SparqlBinding[] };
}

export function notablePeopleSparql(wikidataId: string): string {
  if (!/^Q\d+$/.test(wikidataId)) throw new Error("Invalid Wikidata entity id");

  return `
SELECT DISTINCT ?person ?personLabel ?occupationLabel ?partyLabel ?image ?article WHERE {
  VALUES ?occupation {
    wd:Q82955 wd:Q483501 wd:Q639669 wd:Q33999 wd:Q49757
    wd:Q177220 wd:Q753110 wd:Q1028181 wd:Q1281618 wd:Q2526255
  }
  ?person wdt:P19 wd:${wikidataId};
          wdt:P106 ?occupation.
  OPTIONAL { ?person wdt:P102 ?party. }
  OPTIONAL { ?person wdt:P18 ?image. }
  OPTIONAL {
    ?article schema:about ?person;
             schema:isPartOf <https://en.wikipedia.org/>.
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en".
    ?person rdfs:label ?personLabel.
    ?occupation rdfs:label ?occupationLabel.
    ?party rdfs:label ?partyLabel.
  }
}
LIMIT 48`;
}

export async function fetchNotablePeople(wikidataId: string): Promise<NotablePerson[]> {
  const query = notablePeopleSparql(wikidataId);
  const params = new URLSearchParams({ query, format: "json" });
  const data = await fetchJson<SparqlResponse>(
    `https://query.wikidata.org/sparql?${params}`,
    { timeoutMs: 14_000 }
  );
  const people = new Map<string, NotablePerson>();

  for (const binding of data.results?.bindings ?? []) {
    const id = binding.person?.value.split("/").pop();
    const name = binding.personLabel?.value;
    if (!id || !name) continue;

    const existing = people.get(id);
    const occupation = binding.occupationLabel?.value ?? "Notable person";
    if (existing) {
      const occupations = new Set(existing.occupation.split(", "));
      occupations.add(occupation);
      existing.occupation = [...occupations].join(", ");
      continue;
    }

    people.set(id, {
      id,
      name,
      occupation,
      party: binding.partyLabel?.value ?? null,
      imageUrl: binding.image?.value?.replace(/^http:\/\//, "https://") ?? null,
      url: binding.article?.value ?? binding.person?.value ?? null,
    });
  }

  return [...people.values()].slice(0, 12);
}
