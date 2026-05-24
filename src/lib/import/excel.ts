import * as XLSX from "xlsx";
import { detectCategory, rowsToParts } from "@/lib/import/normalizers";
import type { ParsedWorkbook } from "@/lib/import/types";

export function parseWorkbook(buffer: Buffer, filename: string): ParsedWorkbook {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: false,
    cellText: false,
  });
  const category = detectCategory(filename);
  const fileType = filename.split(".").pop()?.toLowerCase() || "unknown";
  const parsed: ParsedWorkbook = {
    filename,
    fileType,
    parts: [],
    issues: [],
  };

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      blankrows: false,
      defval: "",
    });

    const result = rowsToParts({
      rows,
      filename,
      sheetName,
      category,
    });

    parsed.parts.push(...result.parts);
    parsed.issues.push(...result.issues);
  });

  return parsed;
}
