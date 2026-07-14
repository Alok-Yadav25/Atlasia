import { SectionCard } from "@/components/place/section-card";
import type { WeatherData } from "@/types/place";
import { CloudRain, Droplets, Gauge, Sunrise, Wind } from "lucide-react";

interface WeatherSectionProps {
  weather: WeatherData | null;
}

export function WeatherSection({ weather }: WeatherSectionProps) {
  return (
    <SectionCard
      id="weather"
      title="Right now"
      eyebrow="Weather"
      icon={CloudRain}
      className="lg:col-span-4"
      contentClassName="pb-6"
    >
      {weather ? (
        <>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-5xl font-semibold tracking-[-0.08em]">{weather.temperature}°</p>
              <p className="mt-2 text-sm text-muted-foreground">Feels like {weather.apparentTemperature}°</p>
            </div>
            <p className="max-w-32 text-right text-sm font-medium">{weather.condition}</p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/55 p-3">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Droplets className="size-3" /> Humidity</p>
              <p className="mt-1.5 font-mono text-sm">{weather.humidity}%</p>
            </div>
            <div className="rounded-xl bg-muted/55 p-3">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Wind className="size-3" /> Wind</p>
              <p className="mt-1.5 font-mono text-sm">{weather.windSpeed} km/h</p>
            </div>
            <div className="rounded-xl bg-muted/55 p-3">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Gauge className="size-3" /> High / low</p>
              <p className="mt-1.5 font-mono text-sm">{weather.high}° / {weather.low}°</p>
            </div>
            <div className="rounded-xl bg-muted/55 p-3">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Sunrise className="size-3" /> Daylight</p>
              <p className="mt-1.5 font-mono text-sm">{weather.isDay ? "Daytime" : "Nighttime"}</p>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Live conditions are taking a weather break.</p>
      )}
    </SectionCard>
  );
}
