"use client";

import { cn } from "@/lib/utils";

interface WeatherEffectsProps {
  code?: number;
  isDay?: boolean;
}

export function WeatherEffects({ code = 0, isDay = true }: WeatherEffectsProps) {
  const rainy = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
  const snowy = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
  const cloudy = code >= 2 && code <= 48;

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden="true">
      {isDay && code <= 2 && <span className="weather-sun" />}
      {!isDay && <span className="weather-moon" />}
      {cloudy && (
        <>
          <span className="weather-cloud weather-cloud-one" />
          <span className="weather-cloud weather-cloud-two" />
        </>
      )}
      {(rainy || snowy) && (
        <div className={cn("weather-particles", snowy && "weather-snow")}>
          {Array.from({ length: 22 }, (_, index) => (
            <span
              key={index}
              style={
                {
                  "--particle-left": `${(index * 47) % 100}%`,
                  "--particle-opacity": 0.25 + (index % 5) * 0.11,
                  "--particle-duration": `${1.2 + (index % 6) * 0.16}s`,
                  "--snow-duration": `${4 + (index % 6) * 0.45}s`,
                  "--particle-delay": `${index * -0.13}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,var(--weather-glow),transparent_42%)] opacity-80" />
    </div>
  );
}
