export function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\u3400-\u9fff]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function compactKey(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, "");
}

export function displayText(...values: unknown[]): string | null {
  const text = values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ");

  return text || null;
}
