import { NextResponse } from "next/server";
import { searchParts } from "@/lib/parts";
import type { PartCategory } from "@/lib/db";

export const runtime = "nodejs";

const categories = new Set(["all", "screen", "battery", "cell", "warranty", "other"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const categoryParam = url.searchParams.get("category") || "all";
  const category = categories.has(categoryParam) ? (categoryParam as PartCategory | "all") : "all";

  return NextResponse.json({
    results: searchParts({ query, category, limit: 120 }),
  });
}
