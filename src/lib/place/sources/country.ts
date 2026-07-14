import { fetchJson } from "@/lib/place/http";
import type { CountryDetails, CurrencyData } from "@/types/place";
import countries from "world-countries";

interface ExchangeRateResponse {
  conversion_rate?: number;
}

interface FrankfurterResponse {
  date?: string;
  rates?: Record<string, number>;
}

interface OpenExchangeResponse {
  time_last_update_utc?: string;
  rates?: Record<string, number>;
}

async function fetchUsdRate(code: string): Promise<{ rate: number | null; updatedAt: string | null }> {
  if (code === "USD") return { rate: 1, updatedAt: new Date().toISOString() };

  const exchangeKey = process.env.EXCHANGE_RATE_API_KEY;
  if (exchangeKey) {
    try {
      const data = await fetchJson<ExchangeRateResponse>(
        `https://v6.exchangerate-api.com/v6/${exchangeKey}/pair/USD/${code}`,
        { timeoutMs: 6_000 }
      );
      if (Number.isFinite(data.conversion_rate)) {
        return { rate: data.conversion_rate!, updatedAt: new Date().toISOString() };
      }
    } catch {
      // Continue to the keyless providers.
    }
  }

  try {
    const data = await fetchJson<FrankfurterResponse>(
      `https://api.frankfurter.app/latest?from=USD&to=${code}`,
      { timeoutMs: 6_000 }
    );
    const rate = data.rates?.[code];
    if (Number.isFinite(rate)) return { rate: rate!, updatedAt: data.date ?? null };
  } catch {
    // Frankfurter covers ECB currencies only, so continue to the broad fallback.
  }

  try {
    const data = await fetchJson<OpenExchangeResponse>("https://open.er-api.com/v6/latest/USD", {
      timeoutMs: 7_000,
    });
    const rate = data.rates?.[code];
    return {
      rate: Number.isFinite(rate) ? rate! : null,
      updatedAt: data.time_last_update_utc ?? null,
    };
  } catch {
    return { rate: null, updatedAt: null };
  }
}

export async function fetchCountryAndCurrency(
  countryCode: string
): Promise<{ countryDetails: CountryDetails; currency: CurrencyData | null }> {
  const normalized = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) throw new Error("Country code was unavailable");

  const country = countries.find((entry) => entry.cca2 === normalized);
  if (!country) throw new Error("Country details were unavailable");

  const currencyEntry = Object.entries(country.currencies ?? {})[0];
  let currency: CurrencyData | null = null;

  if (currencyEntry) {
    const [code, details] = currencyEntry;
    const { rate, updatedAt } = await fetchUsdRate(code);
    currency = {
      code,
      name: details.name ?? code,
      symbol: details.symbol ?? code,
      rateFromUsd: rate,
      updatedAt,
    };
  }

  return {
    countryDetails: {
      capital: country.capital?.[0] ?? null,
      languages: Object.values(country.languages ?? {}),
      flagUrl: null,
    },
    currency,
  };
}
