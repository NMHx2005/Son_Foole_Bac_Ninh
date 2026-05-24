import partsData from "@/data/parts.json";
import type { PartCategory, PartRecord } from "@/lib/db";
import { normalizeText } from "@/lib/text";

export type PublicSearchFilters = {
  query?: string;
  category?: PartCategory | "all";
  limit?: number;
};

const publicParts = partsData as PartRecord[];

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
