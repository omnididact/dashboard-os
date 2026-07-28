import { NextResponse } from "next/server";
import { getModuleMeta } from "@/modules/registry";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ modules: getModuleMeta() });
}
