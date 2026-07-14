import { fetchJson } from "@/lib/place/http";
import { NextResponse, type NextRequest } from "next/server";

interface RateResponse {
  date?: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
}

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from")?.toUpperCase() ?? "USD";
  const to = request.nextUrl.searchParams.get("to")?.toUpperCase() ?? "EUR";
  const amount = Number(request.nextUrl.searchParams.get("amount") ?? "1");
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to) || !Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000) {
    return NextResponse.json({ error: "Invalid currency conversion request." }, { status: 400 });
  }
  if (from === to) return NextResponse.json({ from, to, amount, rate: 1, result: amount, updatedAt: new Date().toISOString() });

  let rate: number | null = null;
  let updatedAt: string | null = null;
  try {
    const data = await fetchJson<RateResponse>(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
      { timeoutMs: 7_000 }
    );
    rate = data.rates?.[to] ?? null;
    updatedAt = data.date ?? null;
  } catch {
    try {
      const data = await fetchJson<RateResponse>(`https://open.er-api.com/v6/latest/${from}`, {
        timeoutMs: 8_000,
      });
      rate = data.rates?.[to] ?? null;
      updatedAt = data.time_last_update_utc ?? null;
    } catch {
      // Return a designed upstream error below.
    }
  }
  if (!Number.isFinite(rate)) {
    return NextResponse.json({ error: "No exchange rate is available for that pair." }, { status: 502 });
  }
  return NextResponse.json({ from, to, amount, rate, result: amount * rate!, updatedAt }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
