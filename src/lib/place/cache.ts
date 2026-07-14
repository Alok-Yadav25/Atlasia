import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PlaceData } from "@/types/place";

type CacheProvider = PlaceData["cache"]["provider"];

interface MemoryEntry {
  data: PlaceData;
  expiresAt: number;
}

declare global {
  var __placeExplorerCache: Map<string, MemoryEntry> | undefined;
}

const memoryCache = globalThis.__placeExplorerCache ?? new Map<string, MemoryEntry>();
globalThis.__placeExplorerCache = memoryCache;

let supabase: SupabaseClient | null | undefined;

function getSupabase(): SupabaseClient | null {
  if (supabase !== undefined) return supabase;
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  supabase =
    url && serviceRoleKey
      ? createClient(url, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  return supabase;
}

function readMemory(cacheKey: string): PlaceData | null {
  const entry = memoryCache.get(cacheKey);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(cacheKey);
    return null;
  }
  return entry.data;
}

export async function readPlaceCache(
  cacheKey: string
): Promise<{ data: PlaceData | null; provider: CacheProvider }> {
  const client = getSupabase();

  if (client) {
    try {
      const { data, error } = await client
        .from("place_cache")
        .select("payload, expires_at")
        .eq("cache_key", cacheKey)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      if (data?.payload) {
        return { data: data.payload as PlaceData, provider: "supabase" };
      }
    } catch {
      // A missing/misconfigured cache table must never break place discovery.
    }
  }

  const memory = readMemory(cacheKey);
  return {
    data: memory,
    provider: client ? "supabase" : "memory",
  };
}

export async function writePlaceCache(cacheKey: string, data: PlaceData): Promise<void> {
  const expiresAt = Date.parse(data.expiresAt);
  memoryCache.set(cacheKey, { data, expiresAt });

  const client = getSupabase();
  if (!client) return;

  try {
    await client.from("place_cache").upsert(
      {
        cache_key: cacheKey,
        place_name: data.overview.name,
        payload: data,
        expires_at: data.expiresAt,
        updated_at: data.generatedAt,
      },
      { onConflict: "cache_key" }
    );
  } catch {
    // The in-memory cache remains a safe local fallback.
  }
}

export function normalizeCacheKey(query: string): string {
  return query.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}
