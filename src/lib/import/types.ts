import type { PartCategory } from "@/lib/db";

export type ImportablePart = {
  category: PartCategory;
  brand: string | null;
  model: string;
  variant: string | null;
  partCode: string | null;
  color: string | null;
  size: string | null;
  resolution: string | null;
  capacity: string | null;
  priceRmb: number | null;
  priceVnd: number | null;
  paperBoxPriceVnd: number | null;
  ironBoxPriceVnd: number | null;
  warrantyInfo: string | null;
  note: string | null;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
  raw: Record<string, unknown>;
};

export type RowIssue = {
  rowNumber: number | null;
  sheetName: string | null;
  level: "warning" | "error";
  message: string;
  raw?: Record<string, unknown>;
};

export type ParsedWorkbook = {
  filename: string;
  fileType: string;
  parts: ImportablePart[];
  issues: RowIssue[];
};

export type ImportSummary = {
  batchId: number;
  filename: string;
  created: number;
  updated: number;
  unchanged: number;
  duplicates: number;
  errors: number;
  issues: RowIssue[];
};
