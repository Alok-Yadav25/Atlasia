import { fetchJson } from "@/lib/place/http";
import { geocodePlace } from "@/lib/place/sources/geocoding";
import type { TrafficData } from "@/types/features";

interface OpenMeteoClock {
  timezone?: string;
  current?: { time?: string };
}

interface TomTomFlow {
  flowSegmentData?: {
    currentSpeed?: number;
    freeFlowSpeed?: number;
    confidence?: number;
    roadClosure?: boolean;
  };
}

function timeSignal(hour: number): TrafficData["signal"] {
  const rushHour = (hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 20);
  const shoulder = (hour >= 6 && hour < 23) && !rushHour;
  if (rushHour) return {
    level: "busy",
    label: "Likely rush hour",
    summary: "Allow extra time on central roads and around major stations.",
    estimated: true,
  };
  if (shoulder) return {
    level: "moderate",
    label: "Typical daytime movement",
    summary: "Traffic may build near commercial centres, schools and transport hubs.",
    estimated: true,
  };
  return {
    level: "light",
    label: "Likely quieter roads",
    summary: "This local-time planning estimate suggests lighter movement than peak hours.",
    estimated: true,
  };
}

function flowSignal(current: number, freeFlow: number, closure: boolean): TrafficData["signal"] {
  if (closure) return { level: "heavy", label: "Road closure reported", summary: "Use a live navigation app to reroute around the closure.", estimated: false };
  const ratio = freeFlow > 0 ? current / freeFlow : 1;
  if (ratio < 0.35) return { level: "heavy", label: "Heavy traffic", summary: "Current speeds are far below the free-flow speed near the city centre.", estimated: false };
  if (ratio < 0.62) return { level: "busy", label: "Busy traffic", summary: "Current speeds are noticeably below free flow near the city centre.", estimated: false };
  if (ratio < 0.82) return { level: "moderate", label: "Moderate traffic", summary: "Traffic is moving with some delay near the city centre.", estimated: false };
  return { level: "light", label: "Traffic flowing well", summary: "Current speeds are close to free flow near the city centre.", estimated: false };
}

export async function fetchTraffic(placeName: string): Promise<TrafficData> {
  const geo = await geocodePlace(placeName);
  const center = { lat: geo.lat, lon: geo.lon };
  let localTime = new Date().toISOString();
  try {
    const clockParams = new URLSearchParams({ latitude: String(center.lat), longitude: String(center.lon), current: "temperature_2m", timezone: "auto" });
    const clock = await fetchJson<OpenMeteoClock>(`https://api.open-meteo.com/v1/forecast?${clockParams}`, { timeoutMs: 6_000 });
    localTime = clock.current?.time ?? localTime;
  } catch {
    // UTC still provides an honest fallback timestamp.
  }
  const hour = Number(localTime.slice(11, 13));
  let signal = timeSignal(Number.isFinite(hour) ? hour : new Date().getUTCHours());
  let flow: TrafficData["flow"] = null;
  let provider: TrafficData["provider"] = "planning-estimate";
  const tomtomKey = process.env.TOMTOM_API_KEY;

  if (tomtomKey) {
    try {
      const params = new URLSearchParams({ point: `${center.lat},${center.lon}`, unit: "KMPH", key: tomtomKey });
      const response = await fetchJson<TomTomFlow>(`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?${params}`, { timeoutMs: 7_000 });
      const data = response.flowSegmentData;
      if (Number.isFinite(data?.currentSpeed) && Number.isFinite(data?.freeFlowSpeed)) {
        flow = {
          currentSpeedKph: data!.currentSpeed!,
          freeFlowSpeedKph: data!.freeFlowSpeed!,
          confidence: data?.confidence ?? 0,
          roadClosure: Boolean(data?.roadClosure),
        };
        signal = flowSignal(flow.currentSpeedKph, flow.freeFlowSpeedKph, flow.roadClosure);
        provider = "tomtom";
      }
    } catch {
      // Keep the clearly labelled local-time planning estimate.
    }
  }

  return {
    query: `${geo.name}, ${geo.country}`,
    center,
    localTime,
    signal,
    flow,
    provider,
    mapLinks: [
      { label: "Open live traffic in Google Maps", url: `https://www.google.com/maps/@?api=1&map_action=map&center=${center.lat},${center.lon}&zoom=13&basemap=roadmap&layer=traffic` },
      { label: "Navigate with Waze", url: `https://www.waze.com/ul?ll=${center.lat}%2C${center.lon}&navigate=yes&zoom=14` },
    ],
    note: provider === "tomtom"
      ? "Live flow describes the road segment closest to the city centre; conditions vary across the city."
      : "This is a local-time planning estimate, not a live traffic reading. Add TOMTOM_API_KEY for a live centre-road flow signal.",
  };
}
