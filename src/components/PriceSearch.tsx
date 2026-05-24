"use client";

import { Battery, MonitorSmartphone, Search, SearchX, ShieldCheck, Smartphone, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PartRecord } from "@/lib/db";

const categories = [
  { id: "all", label: "Tất cả", icon: Search },
  { id: "screen", label: "Màn hình", icon: MonitorSmartphone },
  { id: "battery", label: "Pin", icon: Battery },
  { id: "cell", label: "Cell pin", icon: Smartphone },
  { id: "warranty", label: "Bảo hành", icon: ShieldCheck },
];

const categoryLabels: Record<string, string> = {
  screen: "Màn hình",
  battery: "Pin",
  cell: "Cell pin",
  warranty: "Bảo hành",
  other: "Khác",
};

const quickSearches = ["iPhone 15", "Samsung S24", "iPhone 14", "OPPO Reno", "Redmi Note"];

export function PriceSearch({ initialResults }: { initialResults: PartRecord[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [results, setResults] = useState(initialResults);
  const [isLoading, setIsLoading] = useState(false);

  const runSearch = useCallback(async (nextQuery: string, nextCategory: string, signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ q: nextQuery, category: nextCategory });
      const response = await fetch(`/api/search?${params.toString()}`, { signal });
      const data = (await response.json()) as { results: PartRecord[] };
      setResults(data.results);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error(error);
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      await runSearch(query, category, controller.signal);
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, category, runSearch]);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-600">Tra cứu báo giá</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex w-full flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void runSearch(query, category);
              }}
            >
              <div className="relative min-w-0 flex-1">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nhập mã máy... VD: iPhone 15, Samsung S24"
                  className="h-12 w-full pr-11 text-base"
                />
                {hasQuery ? (
                  <button
                    type="button"
                    aria-label="Xóa tìm kiếm"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <Button type="submit" size="lg" className="w-full shrink-0 sm:w-auto">
                <Search className="h-4 w-4" />
                Tra cứu
              </Button>
            </form>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {quickSearches.map((item) => (
                  <button key={item} type="button" onClick={() => setQuery(item)}>
                    <Badge variant="secondary" className="cursor-pointer rounded-full px-3 py-1 text-sm hover:bg-blue-50 hover:text-blue-700">
                      {item}
                    </Badge>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((item) => {
                  const Icon = item.icon;
                  const active = category === item.id;

                  return (
                    <Button
                      key={item.id}
                      type="button"
                      variant={active ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategory(item.id)}
                      className="h-10"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-blue-600">Bảng kết quả</CardTitle>
              <p className="mt-1 text-sm text-gray-600">
                {isLoading ? "Đang tìm kiếm..." : `${results.length} kết quả${hasQuery ? " phù hợp" : " mới nhất"}`}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {results.length ? (
              <div className="overflow-x-auto">
                <Table className="min-w-[640px] border-collapse">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Loại linh kiện</TableHead>
                      <TableHead>Chất lượng</TableHead>
                      <TableHead>Đơn giá</TableHead>
                      <TableHead className="hidden sm:table-cell">Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((part) => {
                      const quality = inferQuality(part);

                      return (
                        <TableRow key={part.id}>
                          <TableCell>
                            <div className="font-medium text-gray-950">{part.model}</div>
                            <div className="mt-1 text-sm text-gray-600">
                              {categoryLabels[part.category] || part.category}
                              {part.brand ? ` | ${part.brand}` : ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <QualityBadge quality={quality} />
                          </TableCell>
                          <TableCell className="font-semibold text-gray-950">{formatPrice(part.price_vnd)}</TableCell>
                          <TableCell className="hidden max-w-[360px] text-gray-600 sm:table-cell">
                            {buildNote(part)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                <SearchX className="h-10 w-10 text-gray-400" />
                <h3 className="mt-4 text-base font-semibold text-gray-950">Không tìm thấy kết quả</h3>
                <p className="mt-2 max-w-md text-sm text-gray-600">
                  Hãy thử nhập mã máy ngắn hơn, bỏ dấu hoặc kiểm tra lại file giá trong trang admin.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatPrice(value: number | null) {
  if (!value) return "-";
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function inferQuality(part: PartRecord): "Zin" | "Lô" | "Copy" {
  const text = [part.model, part.variant, part.note, part.warranty_info, part.source_sheet].join(" ").toLowerCase();
  if (text.includes("zin")) return "Zin";
  if (text.includes("copy")) return "Copy";
  return "Lô";
}

function QualityBadge({ quality }: { quality: "Zin" | "Lô" | "Copy" }) {
  const variant = quality === "Zin" ? "green" : quality === "Copy" ? "orange" : "blue";
  return <Badge variant={variant}>{quality}</Badge>;
}

function buildNote(part: PartRecord) {
  return (
    [
      part.part_code ? `Mã: ${part.part_code}` : null,
      part.variant,
      part.color,
      part.capacity,
      part.resolution,
      part.paper_box_price_vnd ? `Hộp giấy: ${formatPrice(part.paper_box_price_vnd)}` : null,
      part.iron_box_price_vnd ? `Hộp sắt: ${formatPrice(part.iron_box_price_vnd)}` : null,
      part.price_rmb ? `RMB: ${part.price_rmb}` : null,
      part.warranty_info || part.note,
    ]
      .filter(Boolean)
      .join(" | ") || "-"
  );
}
