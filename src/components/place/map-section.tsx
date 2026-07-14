"use client";

import { SectionCard } from "@/components/place/section-card";
import { Badge } from "@/components/ui/badge";
import type { PlaceData } from "@/types/place";
import { Map } from "lucide-react";
import dynamic from "next/dynamic";

const DynamicPlaceMap = dynamic(
  () => import("@/components/place/place-map").then((module) => module.PlaceMap),
  {
    ssr: false,
    loading: () => <div className="h-[460px] animate-pulse bg-muted" />,
  }
);

interface MapSectionProps {
  data: PlaceData;
}

export function MapSection({ data }: MapSectionProps) {
  const visiblePoints = data.mapPoints.length;
  return (
    <SectionCard
      id="map"
      title="See the city at a glance"
      eyebrow="Interactive map"
      icon={Map}
      className="lg:col-span-12"
      contentClassName="px-0 pb-0 sm:px-0"
      action={<Badge variant="secondary">{visiblePoints} nearby points</Badge>}
    >
      <div className="overflow-hidden border-t border-border/65">
        <DynamicPlaceMap
          center={data.overview.coordinates}
          placeName={data.overview.name}
          points={data.mapPoints}
        />
      </div>
    </SectionCard>
  );
}
