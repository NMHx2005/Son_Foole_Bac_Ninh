import type { PartCategory } from "@/lib/db";
import { compactKey, displayText, normalizeText } from "@/lib/text";
import type { ImportablePart, RowIssue } from "@/lib/import/types";

type HeaderMap = Partial<Record<keyof ImportablePart, number>>;

const modelSignals = ["型号", "model", "mã máy", "ma may", "kiểu", "kieu", "适用于", "ap dung"];

export function detectCategory(filename: string): PartCategory {
  const normalized = normalizeText(filename);

  if (filename.includes("屏幕") || normalized.includes("man")) return "screen";
  if (filename.includes("电芯") || normalized.includes("cell")) return "cell";
  if (filename.includes("电池") || normalized.includes("pin")) return "battery";
  if (normalized.includes("bao hanh")) return "warranty";

  return "other";
}

export function rowsToParts(args: {
  rows: unknown[][];
  filename: string;
  sheetName: string;
  category: PartCategory;
}): { parts: ImportablePart[]; issues: RowIssue[] } {
  const { rows, filename, sheetName, category } = args;
  const issues: RowIssue[] = [];
  const headerIndex = findHeaderIndex(rows, category);

  if (headerIndex < 0) {
    return {
      parts: [],
      issues: [
        {
          rowNumber: null,
          sheetName,
          level: "warning",
          message: "Không tìm thấy hàng tiêu đề phù hợp trong sheet.",
        },
      ],
    };
  }

  const headers = rows[headerIndex].map((cell) => cleanCell(cell));
  const map = buildHeaderMap(headers, category);
  const parts: ImportablePart[] = [];

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const rowNumber = headerIndex + offset + 2;
    if (!row.some((cell) => cleanCell(cell))) return;

    const raw = headers.reduce<Record<string, unknown>>((acc, header, index) => {
      if (header) acc[header] = row[index] ?? null;
      return acc;
    }, {});

    const model = pick(row, map.model) || pick(row, map.variant);
    const partCode = pick(row, map.partCode);
    const brand = pick(row, map.brand) || inferBrand(sheetName);
    const variant = displayText(pick(row, map.variant), pick(row, map.color));
    const note = pick(row, map.note);
    const warrantyInfo = category === "warranty" ? buildWarrantyInfo(raw) : null;

    if (!model && !partCode) {
      issues.push({
        rowNumber,
        sheetName,
        level: "warning",
        message: "Bỏ qua dòng không có model/mã máy.",
        raw,
      });
      return;
    }

    const normalizedModel = model || partCode || "Không rõ model";
    const priceVnd = parseMoney(pick(row, map.priceVnd));
    const paperBoxPriceVnd = parseMoney(pick(row, map.paperBoxPriceVnd));
    const ironBoxPriceVnd = parseMoney(pick(row, map.ironBoxPriceVnd));

    parts.push({
      category,
      brand,
      model: normalizedModel,
      variant,
      partCode,
      color: pick(row, map.color),
      size: pick(row, map.size),
      resolution: pick(row, map.resolution),
      capacity: pick(row, map.capacity),
      priceRmb: parseDecimal(pick(row, map.priceRmb)),
      priceVnd: choosePrimaryVnd(category, priceVnd, paperBoxPriceVnd, ironBoxPriceVnd),
      paperBoxPriceVnd,
      ironBoxPriceVnd,
      warrantyInfo,
      note,
      sourceFile: filename,
      sourceSheet: sheetName,
      sourceRow: rowNumber,
      raw,
    });
  });

  return { parts, issues };
}

export function buildLookupKey(part: ImportablePart): string {
  const pieces = [
    part.category,
    part.brand,
    part.sourceSheet,
    part.model,
    part.partCode,
    part.color,
    part.capacity,
    part.size,
    part.resolution,
    part.variant,
  ];

  return pieces.map((piece) => compactKey(piece)).filter(Boolean).join("|");
}

export function buildFingerprint(part: ImportablePart): string {
  return JSON.stringify({
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
  });
}

export function buildSearchText(part: ImportablePart): string {
  return normalizeText(
    [
      part.category,
      part.brand,
      part.sourceSheet,
      part.model,
      part.variant,
      part.partCode,
      part.color,
      part.size,
      part.resolution,
      part.capacity,
      part.note,
      part.warrantyInfo,
    ].join(" "),
  );
}

function findHeaderIndex(rows: unknown[][], category: PartCategory) {
  let bestIndex = -1;
  let bestScore = 0;

  rows.slice(0, 25).forEach((row, index) => {
    const headers = row.map((cell) => cleanCell(cell));
    const score = headers.reduce((sum, header) => sum + scoreHeader(header, category), 0);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestScore >= 2 ? bestIndex : -1;
}

function scoreHeader(header: string, category: PartCategory) {
  const normalized = normalizeText(header);
  let score = 0;

  if (modelSignals.some((signal) => header.includes(signal) || normalized.includes(normalizeText(signal)))) score += 2;
  if (header.includes("品牌") || normalized.includes("thuong hieu")) score += 1;
  if (header.includes("容量") || normalized.includes("dung luong")) score += 1;
  if (header.includes("颜色") || normalized.includes("mau sac")) score += 1;
  if (header.includes("RMB") || normalized.includes("vn dong") || normalized.includes("vnd")) score += 1;
  if (category === "warranty" && normalized.includes("bao hanh")) score += 1;

  return score;
}

function buildHeaderMap(headers: string[], category: PartCategory): HeaderMap {
  const map: HeaderMap = {};

  headers.forEach((header, index) => {
    const normalized = normalizeText(header);
    const compact = compactKey(header);

    if (!map.brand && (header.includes("品牌") || normalized.includes("thuong hieu"))) map.brand = index;
    if (!map.partCode && (header.includes("电池代码") || normalized.includes("ma pin") || compact.includes("code"))) {
      map.partCode = index;
    }
    if (!map.color && (header.includes("颜色") || normalized.includes("mau sac") || normalized === "mau")) map.color = index;
    if (!map.capacity && (header.includes("容量") || normalized.includes("dung luong"))) map.capacity = index;
    if (!map.size && (header.includes("尺寸") || normalized.includes("kich thuoc"))) map.size = index;
    if (!map.resolution && (header.includes("分辨") || normalized.includes("do phan giai"))) map.resolution = index;
    if (!map.paperBoxPriceVnd && (header.includes("纸盒") || normalized.includes("hop giay"))) map.paperBoxPriceVnd = index;
    if (!map.ironBoxPriceVnd && (header.includes("铁盒") || normalized.includes("hop sat"))) map.ironBoxPriceVnd = index;
    if (!map.note && (header.includes("备注") || normalized.includes("ghi chu") || normalized.includes("note"))) map.note = index;

    if (!map.priceRmb && (header.includes("RMB") || header.includes("代理价") || header.includes("单价"))) {
      map.priceRmb = index;
    }
    if (!map.priceVnd && (normalized.includes("vn dong") || normalized.includes("vnd"))) {
      map.priceVnd = index;
    }
    if (!map.model && isModelHeader(header, normalized, category)) map.model = index;
    if (!map.variant && (header.includes("通用型号") || normalized.includes("kieu chung") || normalized.includes("ap dung"))) {
      map.variant = index;
    }
  });

  return map;
}

function isModelHeader(header: string, normalized: string, category: PartCategory) {
  if (header.includes("通用型号") || normalized.includes("kieu chung")) return false;
  if (category === "warranty" && normalized.includes("ma may")) return true;

  return modelSignals.some((signal) => header.includes(signal) || normalized.includes(normalizeText(signal)));
}

function cleanCell(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function pick(row: unknown[], index: number | undefined) {
  if (index === undefined) return null;
  const value = cleanCell(row[index]);
  return value || null;
}

function parseDecimal(value: string | null) {
  if (!value) return null;
  const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMoney(value: string | null) {
  if (!value) return null;
  const normalized = value.replace(/[^\d,.-]/g, "").trim();
  if (!normalized) return null;

  const decimalLike = normalized.includes(".") && /\.\d{1,2}$/.test(normalized);
  const clean = decimalLike ? normalized.replace(/,/g, "") : normalized.replace(/[.,]/g, "");
  const parsed = Number.parseInt(clean, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function choosePrimaryVnd(
  category: PartCategory,
  priceVnd: number | null,
  paperBoxPriceVnd: number | null,
  ironBoxPriceVnd: number | null,
) {
  if (category === "screen" && (paperBoxPriceVnd || ironBoxPriceVnd)) {
    return paperBoxPriceVnd ?? ironBoxPriceVnd;
  }

  return priceVnd ?? paperBoxPriceVnd ?? ironBoxPriceVnd;
}

function inferBrand(sheetName: string) {
  const normalized = normalizeText(sheetName);
  if (normalized.includes("ip")) return "iPhone";
  if (normalized.includes("sam")) return "Samsung";
  if (normalized.includes("redmi") || normalized.includes("xm") || normalized.includes("xiaomi")) return "Xiaomi/Redmi";
  if (normalized.includes("op")) return "Oppo";
  if (normalized.includes("vo")) return "Vivo";
  if (normalized.includes("pad")) return "iPad/Tablet";

  return sheetName.trim() || null;
}

function buildWarrantyInfo(raw: Record<string, unknown>) {
  const text = Object.entries(raw)
    .filter(([key]) => {
      const normalized = normalizeText(key);
      return !normalized.includes("thuong hieu") && !normalized.includes("loai") && !normalized.includes("ma may");
    })
    .map(([key, value]) => {
      const cleanValue = cleanCell(value);
      return cleanValue ? `${key}: ${cleanValue}` : "";
    })
    .filter(Boolean)
    .join(" | ");

  return text || null;
}
