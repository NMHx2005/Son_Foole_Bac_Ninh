import fs from "node:fs/promises";
import path from "node:path";
import { parseWorkbook } from "@/lib/import/excel";
import { importParsedWorkbook } from "@/lib/import/upsert";
import type { ImportSummary } from "@/lib/import/types";

const supportedExtensions = new Set([".xls", ".xlsx", ".csv"]);

export async function importFileBuffer(buffer: Buffer, filename: string): Promise<ImportSummary> {
  const parsed = parseWorkbook(buffer, filename);
  return importParsedWorkbook(parsed);
}

export async function importDirectory(directory: string): Promise<ImportSummary[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const summaries: ImportSummary[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const filePath = path.join(directory, entry.name);
    const extension = path.extname(entry.name).toLowerCase();
    if (!supportedExtensions.has(extension)) continue;

    const buffer = await fs.readFile(filePath);
    summaries.push(await importFileBuffer(buffer, entry.name));
  }

  return summaries;
}
