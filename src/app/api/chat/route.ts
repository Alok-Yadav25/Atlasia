import { createGroq } from "@ai-sdk/groq";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";

export const maxDuration = 30;

const requests = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || "local";
  const now = Date.now();
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 12;
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return NextResponse.json({ error: "Too many chat requests. Try again in a minute." }, { status: 429 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The travel companion needs GROQ_API_KEY in the server environment." },
      { status: 503 }
    );
  }

  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 100_000) {
      return NextResponse.json({ error: "Chat request is too large." }, { status: 413 });
    }

    const body = (await request.json()) as {
      messages?: UIMessage[];
      placeContext?: unknown;
    };
    if (!Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Messages are required." }, { status: 400 });
    }

    const context = JSON.stringify(body.placeContext ?? {}).slice(0, 14_000);
    const groq = createGroq({ apiKey });
    const result = streamText({
      model: groq(process.env.GROQ_MODEL ?? "openai/gpt-oss-20b"),
      system: `You are Atlasia AI, the in-app travel companion for Atlasia.
Use the provided place context as your primary source. Be concise, practical, warm, and transparent when data is missing.
Never invent current prices, opening hours, safety claims, or visa rules. Suggest verifying time-sensitive details.
Format responses as clean Markdown, usually under 180 words.

CURRENT PLACE CONTEXT:
${context}`,
      messages: await convertToModelMessages(body.messages),
      temperature: 0.55,
      maxOutputTokens: 900,
    });

    return result.toUIMessageStreamResponse();
  } catch {
    return NextResponse.json(
      { error: "The travel companion could not answer right now." },
      { status: 500 }
    );
  }
}
