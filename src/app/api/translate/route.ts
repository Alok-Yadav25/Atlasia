import { createGroq } from "@ai-sdk/groq";
import { fetchJson } from "@/lib/place/http";
import { generateText } from "ai";
import { NextResponse } from "next/server";

interface MyMemoryResponse {
  responseData?: { translatedText?: string; match?: number };
}

const requests = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(request: Request): boolean {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 20;
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return NextResponse.json({ error: "Too many translation requests. Try again in a minute." }, { status: 429 });
  }

  try {
    const body = (await request.json()) as { text?: unknown; from?: unknown; to?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const from = typeof body.from === "string" ? body.from : "en";
    const to = typeof body.to === "string" ? body.to : "fr";
    if (!text || text.length > 500 || !/^[a-z-]{2,12}$/i.test(from) || !/^[a-z-]{2,12}$/i.test(to)) {
      return NextResponse.json({ error: "Enter up to 500 characters and valid languages." }, { status: 400 });
    }
    if (from === to) return NextResponse.json({ translatedText: text, match: 1 });

    if (process.env.GROQ_API_KEY) {
      try {
        const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
        const result = await generateText({
          model: groq(process.env.GROQ_MODEL ?? "openai/gpt-oss-20b"),
          system: "You are a precise travel phrase translator. Return only the translated text, with no label, note, romanization, quotes, or explanation. Preserve names, numbers, punctuation, and meaning.",
          prompt: `Translate from ISO language ${from} to ISO language ${to}:\n${text}`,
          temperature: 0.1,
          maxOutputTokens: 300,
        });
        const translatedText = result.text.trim();
        if (translatedText) return NextResponse.json({ translatedText, match: null, provider: "groq" });
      } catch {
        // Continue to the free no-key translation fallback.
      }
    }

    const params = new URLSearchParams({ q: text, langpair: `${from}|${to}` });
    const data = await fetchJson<MyMemoryResponse>(
      `https://api.mymemory.translated.net/get?${params}`,
      { timeoutMs: 10_000 }
    );
    const translatedText = data.responseData?.translatedText;
    if (!translatedText) throw new Error("No translation was returned");
    return NextResponse.json({ translatedText, match: data.responseData?.match ?? null, provider: "mymemory" });
  } catch {
    return NextResponse.json({ error: "Translation is temporarily unavailable." }, { status: 502 });
  }
}
