import { getDb, type ImportBatch, type ImportIssue, type PartCategory, type PartRecord } from "@/lib/db";
import { normalizeText } from "@/lib/text";

export type SearchFilters = {
  query?: string;
  category?: PartCategory | "all";
  limit?: number;
};

export type DashboardStats = {
  totalParts: number;
  totalBatches: number;
  latestBatch: ImportBatch | null;
  byCategory: Array<{ category: PartCategory; count: number }>;
};

export function searchParts({ query = "", category = "all", limit = 80 }: SearchFilters) {
  const db = getDb();
  const normalized = normalizeText(query);
  const tokens = normalized ? normalized.split(" ").filter(Boolean).slice(0, 6) : [];

  const where: string[] = [];
  const params: Record<string, string | number> = { limit };

  if (category !== "all") {
    where.push("category = @category");
    params.category = category;
  }

  tokens.forEach((token, index) => {
    where.push(`search_text LIKE @token${index}`);
    params[`token${index}`] = `%${token}%`;
  });

  const sql = `
    SELECT *
    FROM parts
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY
      CASE WHEN @query != '' AND search_text LIKE @prefix THEN 0 ELSE 1 END,
      updated_at DESC,
      model ASC
    LIMIT @limit
  `;

  return db
    .prepare(sql)
    .all({ ...params, query: normalized, prefix: `${normalized}%` }) as PartRecord[];
}

export function getDashboardStats(): DashboardStats {
  const db = getDb();

  const totalParts = db.prepare("SELECT COUNT(*) AS count FROM parts").get() as { count: number };
  const totalBatches = db.prepare("SELECT COUNT(*) AS count FROM import_batches").get() as { count: number };
  const latestBatch = db
    .prepare("SELECT * FROM import_batches ORDER BY created_at DESC, id DESC LIMIT 1")
    .get() as ImportBatch | undefined;
  const byCategory = db
    .prepare("SELECT category, COUNT(*) AS count FROM parts GROUP BY category ORDER BY count DESC")
    .all() as Array<{ category: PartCategory; count: number }>;

  return {
    totalParts: totalParts.count,
    totalBatches: totalBatches.count,
    latestBatch: latestBatch ?? null,
    byCategory,
  };
}

export function getRecentParts(limit = 50) {
  return getDb()
    .prepare("SELECT * FROM parts ORDER BY updated_at DESC, id DESC LIMIT ?")
    .all(limit) as PartRecord[];
}

export function getRecentBatches(limit = 10) {
  return getDb()
    .prepare("SELECT * FROM import_batches ORDER BY created_at DESC, id DESC LIMIT ?")
    .all(limit) as ImportBatch[];
}

export function getBatchIssues(batchId: number) {
  return getDb()
    .prepare("SELECT * FROM import_issues WHERE batch_id = ? ORDER BY id DESC LIMIT 100")
    .all(batchId) as ImportIssue[];
}
