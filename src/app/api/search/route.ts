import { NextResponse } from "next/server";
import { searchPublicParts } from "@/lib/publicSearch";
import type { PartCategory } from "@/lib/db";

export const runtime = "nodejs";

const categories = new Set(["all", "screen", "battery", "cell", "warranty", "other"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const categoryParam = url.searchParams.get("category") || "all";
  const category = categories.has(categoryParam) ? (categoryParam as PartCategory | "all") : "all";

  return NextResponse.json({
    results: searchPublicParts({ query, category, limit: 120 }),
  });
}
