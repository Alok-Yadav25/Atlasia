import { fetchJson } from "@/lib/place/http";
import type { WeatherData } from "@/types/place";

interface OpenMeteoResponse {
  timezone?: string;
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
}

const weatherLabels: Record<number, string> = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
};

export function weatherCondition(code: number): string {
  return weatherLabels[code] ?? "Changing conditions";
}

export async function fetchWeather(
  lat: number,
  lon: number
): Promise<{ weather: WeatherData; timezone: string | null }> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "1",
  });
  const data = await fetchJson<OpenMeteoResponse>(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );

  if (!data.current) throw new Error("Weather data was incomplete");

  return {
    timezone: data.timezone ?? null,
    weather: {
      temperature: Math.round(data.current.temperature_2m),
      apparentTemperature: Math.round(data.current.apparent_temperature),
      humidity: Math.round(data.current.relative_humidity_2m),
      windSpeed: Math.round(data.current.wind_speed_10m),
      weatherCode: data.current.weather_code,
      condition: weatherCondition(data.current.weather_code),
      isDay: data.current.is_day === 1,
      high: Math.round(data.daily?.temperature_2m_max?.[0] ?? data.current.temperature_2m),
      low: Math.round(data.daily?.temperature_2m_min?.[0] ?? data.current.temperature_2m),
      precipitationProbability: Math.round(
        data.daily?.precipitation_probability_max?.[0] ?? 0
      ),
    },
  };
}
