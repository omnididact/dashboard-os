import { NextRequest, NextResponse } from "next/server";
import {
  createNeed,
  ensureSampleNeeds,
  listNeeds,
} from "@/lib/needs-store";

export const runtime = "nodejs";

export async function GET() {
  ensureSampleNeeds();
  return NextResponse.json({ needs: listNeeds() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const need = createNeed({
      title,
      category: body.category ? String(body.category) : "general",
    });
    return NextResponse.json({ need }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
