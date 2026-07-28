import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/dashboard-store";

export const runtime = "nodejs";

export type CommutePerson = {
  id: string;
  name: string;
  destLabel: string;
  destLat: number;
  destLon: number;
  color?: string;
  workStart?: string;
  bufferMinutes?: number;
};

export type CommuteResult = {
  id: string;
  name: string;
  destLabel: string;
  /** Baseline free-flow duration (OSRM) */
  baseDurationSec: number;
  /** Adjusted duration (traffic + weather) */
  durationSec: number;
  distanceM: number;
  durationText: string;
  baseDurationText: string;
  distanceText: string;
  geometry: [number, number][];
  color: string;
  leaveBy: string | null;
  leaveByIso: string | null;
  factors: {
    trafficMultiplier: number;
    weatherMultiplier: number;
    weatherNote: string | null;
    trafficNote: string | null;
  };
};

export type CommutePayload = {
  home: { lat: number; lon: number; label: string };
  routes: CommuteResult[];
  weather: {
    code: number | null;
    precip: number | null;
    temp: number | null;
    summary: string | null;
  };
  updatedAt: string;
  note: string;
  source: string;
};

function formatDuration(sec: number) {
  if (!sec || sec <= 0) return "—";
  const mins = Math.round(sec / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatDistance(m: number) {
  if (!m) return "—";
  const miles = m / 1609.344;
  return `${miles.toFixed(1)} mi`;
}

/** Time-of-day traffic model for Capital Region / suburban corridors */
function trafficMultiplierNow(): { mult: number; note: string | null } {
  const now = new Date();
  const dow = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  if (dow === 0 || dow === 6) {
    return { mult: 1.05, note: "Weekend traffic light" };
  }
  // Morning rush toward Albany / local industrial parks
  if (hour >= 6.5 && hour < 9.25) {
    const peak = hour >= 7.25 && hour <= 8.5 ? 1.38 : 1.22;
    return { mult: peak, note: "Morning rush · heavier traffic" };
  }
  if (hour >= 15.5 && hour < 18.5) {
    const peak = hour >= 16.5 && hour <= 17.75 ? 1.32 : 1.18;
    return { mult: peak, note: "Evening rush · heavier traffic" };
  }
  if (hour >= 11.5 && hour < 13.5) {
    return { mult: 1.08, note: "Midday traffic moderate" };
  }
  if (hour >= 22 || hour < 5.5) {
    return { mult: 0.95, note: "Overnight · lighter traffic" };
  }
  return { mult: 1.1, note: "Typical daytime traffic" };
}

function weatherMultiplier(code: number | null, precip: number | null): {
  mult: number;
  note: string | null;
} {
  if (code == null) return { mult: 1, note: null };
  // Open-Meteo WMO codes
  if (code >= 95) return { mult: 1.35, note: "Thunderstorm · drive carefully" };
  if (code >= 85) return { mult: 1.28, note: "Snow showers · slower roads" };
  if (code >= 71) return { mult: 1.3, note: "Snow · expect delays" };
  if (code >= 66) return { mult: 1.25, note: "Freezing rain risk" };
  if (code >= 61) return { mult: 1.18, note: "Rain · reduced speeds" };
  if (code >= 51) return { mult: 1.1, note: "Drizzle · slightly slower" };
  if (code >= 45) return { mult: 1.15, note: "Fog · reduced visibility" };
  if (precip != null && precip > 0.05)
    return { mult: 1.12, note: "Wet roads" };
  return { mult: 1, note: null };
}

function leaveByFrom(
  workStart: string | undefined,
  durationSec: number,
  bufferMinutes: number
): { text: string; iso: string } | null {
  if (!workStart || !durationSec) return null;
  const dow = new Date().getDay();
  if (dow === 0 || dow === 6) return null;
  const [hh, mm] = workStart.split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const leave = new Date();
  leave.setHours(hh, mm, 0, 0);
  leave.setSeconds(leave.getSeconds() - durationSec - bufferMinutes * 60);
  return {
    text: leave.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    iso: leave.toISOString(),
  };
}

async function routeOsrm(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url, {
    headers: { "User-Agent": "DashboardOS/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("OSRM error");
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("No route");
  const coords: [number, number][] = (route.geometry?.coordinates ?? []).map(
    (c: [number, number]) => [c[1], c[0]] as [number, number]
  );
  return {
    durationSec: route.duration as number,
    distanceM: route.distance as number,
    geometry: coords,
  };
}

async function fetchHomeWeather(lat: number, lon: number) {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set(
      "current",
      "temperature_2m,weather_code,precipitation"
    );
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("precipitation_unit", "inch");
    url.searchParams.set("timezone", "auto");
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "DashboardOS/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const raw = await res.json();
    return {
      code: raw.current?.weather_code as number,
      precip: raw.current?.precipitation as number,
      temp: raw.current?.temperature_2m as number,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const home = {
      lat: Number(body.homeLat),
      lon: Number(body.homeLon),
      label: String(body.homeLabel || "Home"),
    };
    const people = (body.people ?? []) as CommutePerson[];

    if (
      Number.isNaN(home.lat) ||
      Number.isNaN(home.lon) ||
      !Array.isArray(people) ||
      people.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid commute config" },
        { status: 400 }
      );
    }

    // 2-minute cache so leave-by stays responsive but not hammering OSRM
    const cacheKey = `commute:v3:${JSON.stringify({ home, people })}`;
    const cached = getCache<CommutePayload>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const [wx, traffic] = await Promise.all([
      fetchHomeWeather(home.lat, home.lon),
      Promise.resolve(trafficMultiplierNow()),
    ]);
    const weather = weatherMultiplier(wx?.code ?? null, wx?.precip ?? null);

    const colors = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24"];
    const routes: CommuteResult[] = [];

    for (let i = 0; i < people.length; i++) {
      const p = people[i];
      try {
        const r = await routeOsrm(home, {
          lat: Number(p.destLat),
          lon: Number(p.destLon),
        });
        const adjusted = Math.round(
          r.durationSec * traffic.mult * weather.mult
        );
        const buffer = p.bufferMinutes ?? 10;
        const leave = leaveByFrom(p.workStart, adjusted, buffer);
        routes.push({
          id: p.id || String(i),
          name: p.name,
          destLabel: p.destLabel,
          baseDurationSec: r.durationSec,
          durationSec: adjusted,
          distanceM: r.distanceM,
          durationText: formatDuration(adjusted),
          baseDurationText: formatDuration(r.durationSec),
          distanceText: formatDistance(r.distanceM),
          geometry: r.geometry,
          color: p.color || colors[i % colors.length],
          leaveBy: leave?.text ?? null,
          leaveByIso: leave?.iso ?? null,
          factors: {
            trafficMultiplier: traffic.mult,
            weatherMultiplier: weather.mult,
            weatherNote: weather.note,
            trafficNote: traffic.note,
          },
        });
      } catch {
        routes.push({
          id: p.id || String(i),
          name: p.name,
          destLabel: p.destLabel,
          baseDurationSec: 0,
          durationSec: 0,
          distanceM: 0,
          durationText: "—",
          baseDurationText: "—",
          distanceText: "—",
          geometry: [],
          color: p.color || colors[i % colors.length],
          leaveBy: null,
          leaveByIso: null,
          factors: {
            trafficMultiplier: traffic.mult,
            weatherMultiplier: weather.mult,
            weatherNote: weather.note,
            trafficNote: traffic.note,
          },
        });
      }
    }

    const wxSummary = weather.note || traffic.note || "Live route estimate";

    const payload: CommutePayload = {
      home,
      routes,
      weather: {
        code: wx?.code ?? null,
        precip: wx?.precip ?? null,
        temp: wx?.temp ?? null,
        summary: wxSummary,
      },
      updatedAt: new Date().toISOString(),
      note: "Drive times: OSM route + live traffic model + local weather delay. Not a paid traffic feed.",
      source: "osrm+open-meteo+traffic-model",
    };
    setCache(cacheKey, payload, 2 * 60 * 1000);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Commute failed" }, { status: 500 });
  }
}
