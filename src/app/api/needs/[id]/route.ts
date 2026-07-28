import { NextRequest, NextResponse } from "next/server";
import { deleteNeed, updateNeed } from "@/lib/needs-store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await req.json();
    const need = updateNeed(id, {
      title: body.title,
      category: body.category,
      completed:
        typeof body.completed === "boolean" ? body.completed : undefined,
    });
    if (!need) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ need });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!deleteNeed(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
