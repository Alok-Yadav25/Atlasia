"use client";

import { SectionCard } from "@/components/place/section-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { PlaceData } from "@/types/place";
import { Check, Copy, ExternalLink, Globe2, Languages, MapPinned, UsersRound } from "lucide-react";
import { useState } from "react";

interface OverviewSectionProps {
  data: PlaceData;
}

export function OverviewSection({ data }: OverviewSectionProps) {
  const [copied, setCopied] = useState(false);
  const { overview, countryDetails } = data;
  const coordinates = `${overview.coordinates.lat.toFixed(4)}, ${overview.coordinates.lon.toFixed(4)}`;

  async function copyCoordinates() {
    await navigator.clipboard.writeText(coordinates);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }

  return (
    <SectionCard
      id="overview"
      title="The short story"
      eyebrow="Overview"
      icon={Globe2}
      className="lg:col-span-8"
      action={
        overview.wikipediaUrl ? (
          <Button asChild size="sm" variant="ghost">
            <a href={overview.wikipediaUrl} target="_blank" rel="noreferrer">
              Wikipedia <ExternalLink className="size-3.5" />
            </a>
          </Button>
        ) : null
      }
    >
      <p className="max-w-3xl text-pretty text-[15px] leading-7 text-muted-foreground sm:text-base">
        {overview.summary}
      </p>
      <Separator className="my-6" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <UsersRound className="size-3.5" /> Population
          </p>
          <p className="mt-2 font-mono text-sm font-medium">
            {overview.population ? new Intl.NumberFormat("en", { notation: "compact" }).format(overview.population) : "Not listed"}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPinned className="size-3.5" /> Coordinates
          </p>
          <button
            type="button"
            onClick={copyCoordinates}
            className="mt-2 flex items-center gap-2 font-mono text-sm font-medium transition hover:text-primary"
          >
            {coordinates} {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
        <div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Languages className="size-3.5" /> Languages
          </p>
          <p className="mt-2 text-sm font-medium">
            {countryDetails.languages.slice(0, 3).join(", ") || "Not listed"}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe2 className="size-3.5" /> Local time zone
          </p>
          <p className="mt-2 font-mono text-sm font-medium">{overview.timezone ?? "Not listed"}</p>
        </div>
      </div>
    </SectionCard>
  );
}
