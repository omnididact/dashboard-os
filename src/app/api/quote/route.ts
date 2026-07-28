import { NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/dashboard-store";

export const runtime = "nodejs";

type QuotePayload = {
  text: string;
  author: string;
  source: string;
  updatedAt: string;
};

const FALLBACKS: Omit<QuotePayload, "updatedAt">[] = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    source: "local",
  },
  {
    text: "Be kind, for everyone you meet is fighting a harder battle.",
    author: "Plato",
    source: "local",
  },
  {
    text: "Home is not a place, it's a feeling.",
    author: "Cecelia Ahern",
    source: "local",
  },
  {
    text: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
    source: "local",
  },
];

export async function GET() {
  const cacheKey = "quote:today";
  const cached = getCache<QuotePayload>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const res = await fetch("https://zenquotes.io/api/today", {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "DashboardOS/1.0" },
    });
    if (res.ok) {
      const data = (await res.json()) as Array<{ q: string; a: string }>;
      if (data?.[0]?.q) {
        const payload: QuotePayload = {
          text: data[0].q,
          author: data[0].a || "Unknown",
          source: "zenquotes",
          updatedAt: new Date().toISOString(),
        };
        // Cache until end of local day-ish (12h)
        setCache(cacheKey, payload, 12 * 60 * 60 * 1000);
        return NextResponse.json(payload);
      }
    }
  } catch {
    // fall through
  }

  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const pick = FALLBACKS[dayIndex % FALLBACKS.length];
  const payload: QuotePayload = {
    ...pick,
    updatedAt: new Date().toISOString(),
  };
  setCache(cacheKey, payload, 6 * 60 * 60 * 1000);
  return NextResponse.json(payload);
}
