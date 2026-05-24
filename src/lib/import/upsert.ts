import { getDb } from "@/lib/db";
import {
  buildFingerprint,
  buildLookupKey,
  buildSearchText,
} from "@/lib/import/normalizers";
import type { ImportSummary, ImportablePart, ParsedWorkbook, RowIssue } from "@/lib/import/types";

type ExistingPart = {
  id: number;
  fingerprint: string;
};

export function importParsedWorkbook(parsed: ParsedWorkbook): ImportSummary {
  const db = getDb();
  const issues = [...parsed.issues];
  const seenKeys = new Map<string, string>();
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let duplicates = 0;
  let errors = 0;

  const transaction = db.transaction(() => {
    const batch = db
      .prepare("INSERT INTO import_batches (filename, file_type) VALUES (?, ?)")
      .run(parsed.filename, parsed.fileType);
    const batchId = Number(batch.lastInsertRowid);

    const existingStmt = db.prepare("SELECT id, fingerprint FROM parts WHERE lookup_key = ?");
    const insertStmt = db.prepare(`
      INSERT INTO parts (
        lookup_key, fingerprint, category, brand, model, variant, part_code, color, size,
        resolution, capacity, price_rmb, price_vnd, paper_box_price_vnd,
        iron_box_price_vnd, warranty_info, note, source_file, source_sheet,
        search_text, raw_json, import_batch_id
      )
      VALUES (
        @lookupKey, @fingerprint, @category, @brand, @model, @variant, @partCode, @color, @size,
        @resolution, @capacity, @priceRmb, @priceVnd, @paperBoxPriceVnd,
        @ironBoxPriceVnd, @warrantyInfo, @note, @sourceFile, @sourceSheet,
        @searchText, @rawJson, @batchId
      )
    `);
    const updateStmt = db.prepare(`
      UPDATE parts SET
        fingerprint = @fingerprint,
        category = @category,
        brand = @brand,
        model = @model,
        variant = @variant,
        part_code = @partCode,
        color = @color,
        size = @size,
        resolution = @resolution,
        capacity = @capacity,
        price_rmb = @priceRmb,
        price_vnd = @priceVnd,
        paper_box_price_vnd = @paperBoxPriceVnd,
        iron_box_price_vnd = @ironBoxPriceVnd,
        warranty_info = @warrantyInfo,
        note = @note,
        source_file = @sourceFile,
        source_sheet = @sourceSheet,
        search_text = @searchText,
        raw_json = @rawJson,
        import_batch_id = @batchId,
        updated_at = datetime('now')
      WHERE lookup_key = @lookupKey
    `);
    const issueStmt = db.prepare(`
      INSERT INTO import_issues (batch_id, row_number, sheet_name, level, message, raw_json)
      VALUES (@batchId, @rowNumber, @sheetName, @level, @message, @rawJson)
    `);

    parsed.parts.forEach((part) => {
      const lookupKey = buildLookupKey(part);
      const fingerprint = buildFingerprint(part);
      const duplicateFingerprint = seenKeys.get(lookupKey);

      if (duplicateFingerprint) {
        duplicates += 1;
        if (duplicateFingerprint !== fingerprint) {
          issues.push({
            rowNumber: part.sourceRow,
            sheetName: part.sourceSheet,
            level: "warning",
            message: "Dòng trùng khóa với dữ liệu khác trong cùng file upload; hệ thống giữ dòng đầu tiên.",
            raw: part.raw,
          });
        }
        return;
      }

      seenKeys.set(lookupKey, fingerprint);
      const payload = toDbPayload(part, batchId, lookupKey, fingerprint);
      const existing = existingStmt.get(lookupKey) as ExistingPart | undefined;

      if (!existing) {
        insertStmt.run(payload);
        created += 1;
        return;
      }

      if (existing.fingerprint === fingerprint) {
        unchanged += 1;
        return;
      }

      updateStmt.run(payload);
      updated += 1;
    });

    issues.forEach((issue) => {
      if (issue.level === "error") errors += 1;
      issueStmt.run({
        batchId,
        rowNumber: issue.rowNumber,
        sheetName: issue.sheetName,
        level: issue.level,
        message: issue.message,
        rawJson: issue.raw ? JSON.stringify(issue.raw) : null,
      });
    });

    db.prepare(`
      UPDATE import_batches SET
        created_count = @created,
        updated_count = @updated,
        unchanged_count = @unchanged,
        duplicate_count = @duplicates,
        error_count = @errors
      WHERE id = @batchId
    `).run({ batchId, created, updated, unchanged, duplicates, errors });

    return batchId;
  });

  const batchId = transaction();

  return {
    batchId,
    filename: parsed.filename,
    created,
    updated,
    unchanged,
    duplicates,
    errors,
    issues,
  };
}

function toDbPayload(part: ImportablePart, batchId: number, lookupKey: string, fingerprint: string) {
  return {
    batchId,
    lookupKey,
    fingerprint,
    category: part.category,
    brand: part.brand,
    model: part.model,
    variant: part.variant,
    partCode: part.partCode,
    color: part.color,
    size: part.size,
    resolution: part.resolution,
    capacity: part.capacity,
    priceRmb: part.priceRmb,
    priceVnd: part.priceVnd,
    paperBoxPriceVnd: part.paperBoxPriceVnd,
    ironBoxPriceVnd: part.ironBoxPriceVnd,
    warrantyInfo: part.warrantyInfo,
    note: part.note,
    sourceFile: part.sourceFile,
    sourceSheet: part.sourceSheet,
    searchText: buildSearchText(part),
    rawJson: JSON.stringify(part.raw),
  };
}
