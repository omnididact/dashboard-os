import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/dashboard-store";
import type { WeatherPayload } from "@/modules/weather/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat") ?? "42.84552");
  const lon = Number(searchParams.get("lon") ?? "-73.818871");
  const city = searchParams.get("city") ?? "Clifton Park, NY";
  const units =
    searchParams.get("units") === "celsius" ? "celsius" : "fahrenheit";

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  // Live-ish: short cache so focus view stays fresh
  const cacheKey = `weather:v2:${lat}:${lon}:${units}`;
  const cached = getCache<WeatherPayload>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const tempUnit = units === "celsius" ? "celsius" : "fahrenheit";
  const windUnit = units === "celsius" ? "kmh" : "mph";
  const precipUnit = units === "celsius" ? "mm" : "inch";

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation,is_day"
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,apparent_temperature,relative_humidity_2m,is_day"
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max"
  );
  url.searchParams.set("temperature_unit", tempUnit);
  url.searchParams.set("wind_speed_unit", windUnit);
  url.searchParams.set("precipitation_unit", precipUnit);
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "DashboardOS/1.0" },
      // Prefer fresh network data; cache ourselves
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream weather error", status: res.status },
        { status: 502 }
      );
    }
    const raw = await res.json();

    // Full local calendar day of hours (00:00–23:00 today) + remaining tomorrow strip
    const localNow = new Date();
    const todayY = localNow.getFullYear();
    const todayM = localNow.getMonth();
    const todayD = localNow.getDate();

    const hourly: WeatherPayload["hourly"] = [];
    const times: string[] = raw.hourly?.time ?? [];
    for (let i = 0; i < times.length; i++) {
      const dt = new Date(times[i]);
      const sameDay =
        dt.getFullYear() === todayY &&
        dt.getMonth() === todayM &&
        dt.getDate() === todayD;
      if (!sameDay) continue;
      hourly.push({
        time: times[i],
        temperature: raw.hourly.temperature_2m[i],
        precipitation: raw.hourly.precipitation[i] ?? 0,
        precipProbability: raw.hourly.precipitation_probability?.[i] ?? null,
        weatherCode: raw.hourly.weather_code[i],
        windSpeed: raw.hourly.wind_speed_10m?.[i] ?? null,
        humidity: raw.hourly.relative_humidity_2m?.[i] ?? null,
        apparentTemperature: raw.hourly.apparent_temperature?.[i] ?? null,
        isDay: raw.hourly.is_day?.[i] === 1,
      });
    }

    // If timezone parsing left us empty, fall back to next 24 hourly points
    if (hourly.length === 0) {
      const now = Date.now();
      for (let i = 0; i < times.length; i++) {
        const t = new Date(times[i]).getTime();
        if (t < now - 60 * 60 * 1000) continue;
        hourly.push({
          time: times[i],
          temperature: raw.hourly.temperature_2m[i],
          precipitation: raw.hourly.precipitation[i] ?? 0,
          precipProbability: raw.hourly.precipitation_probability?.[i] ?? null,
          weatherCode: raw.hourly.weather_code[i],
          windSpeed: raw.hourly.wind_speed_10m?.[i] ?? null,
          humidity: raw.hourly.relative_humidity_2m?.[i] ?? null,
          apparentTemperature: raw.hourly.apparent_temperature?.[i] ?? null,
          isDay: raw.hourly.is_day?.[i] === 1,
        });
        if (hourly.length >= 24) break;
      }
    }

    const daily: WeatherPayload["daily"] = (raw.daily?.time ?? []).map(
      (date: string, i: number) => ({
        date,
        tempMax: raw.daily.temperature_2m_max[i],
        tempMin: raw.daily.temperature_2m_min[i],
        weatherCode: raw.daily.weather_code[i],
        precipSum: raw.daily.precipitation_sum[i],
        precipProbabilityMax:
          raw.daily.precipitation_probability_max?.[i] ?? null,
        sunrise: raw.daily.sunrise?.[i] ?? null,
        sunset: raw.daily.sunset?.[i] ?? null,
        uvIndexMax: raw.daily.uv_index_max?.[i] ?? null,
      })
    );

    const payload: WeatherPayload = {
      city,
      units,
      current: {
        temperature: raw.current.temperature_2m,
        weatherCode: raw.current.weather_code,
        humidity: raw.current.relative_humidity_2m,
        windSpeed: raw.current.wind_speed_10m,
        apparentTemperature: raw.current.apparent_temperature,
        precipitation: raw.current.precipitation ?? 0,
        isDay: raw.current.is_day === 1,
      },
      hourly,
      daily,
      timezone: raw.timezone ?? null,
      updatedAt: new Date().toISOString(),
    };

    setCache(cacheKey, payload, 5 * 60 * 1000);
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      {
        error: "Failed to fetch weather",
        detail: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 }
    );
  }
}
