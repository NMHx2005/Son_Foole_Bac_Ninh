import partsData from "@/data/parts.json";
import type { PartCategory, PartRecord } from "@/lib/db";
import { normalizeText } from "@/lib/text";

export type PublicSearchFilters = {
  query?: string;
  category?: PartCategory | "all";
  limit?: number;
};

const publicParts = partsData as PartRecord[];
const categoryOrder: PartCategory[] = ["screen", "battery", "cell", "warranty", "other"];

export function searchPublicParts({ query = "", category = "all", limit = 80 }: PublicSearchFilters) {
  const normalized = normalizeText(query);
  const tokens = normalized ? normalized.split(" ").filter(Boolean).slice(0, 6) : [];

  return publicParts
    .filter((part) => {
      if (category !== "all" && part.category !== category) return false;
      return tokens.every((token) => part.search_text.includes(token));
    })
    .sort((a, b) => {
      if (normalized) {
        const aPrefix = a.search_text.startsWith(normalized) ? 0 : 1;
        const bPrefix = b.search_text.startsWith(normalized) ? 0 : 1;
        if (aPrefix !== bPrefix) return aPrefix - bPrefix;
      }

      return b.updated_at.localeCompare(a.updated_at) || a.model.localeCompare(b.model);
    })
    .slice(0, limit);
}

export function getPublicCategoryCounts() {
  const counts = publicParts.reduce<Record<string, number>>(
    (acc, part) => {
      acc.all += 1;
      acc[part.category] = (acc[part.category] || 0) + 1;
      return acc;
    },
    { all: 0 },
  );

  categoryOrder.forEach((category) => {
    counts[category] = counts[category] || 0;
  });

  return counts;
}
