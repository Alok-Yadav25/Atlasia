"use client";

import { jsonFetcher } from "@/components/explore/feature-page-shell";
import type { NearbyFeatureData } from "@/types/features";
import useSWR from "swr";

export function useNearby(place: string) {
  return useSWR<NearbyFeatureData>(`/api/nearby?name=${encodeURIComponent(place)}`, jsonFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}
