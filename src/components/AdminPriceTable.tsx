"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { PartRecord } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationButton } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const categoryLabels: Record<string, string> = {
  screen: "Màn hình",
  battery: "Pin",
  cell: "Cell pin",
  warranty: "Bảo hành",
  other: "Khác",
};

const pageSize = 10;

export function AdminPriceTable({ parts }: { parts: PartRecord[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(parts.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return parts.slice(start, start + pageSize);
  }, [page, parts]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-blue-600">Bảng quản lý giá</CardTitle>
          <p className="mt-1 text-sm text-gray-600">Hiển thị dữ liệu hiện tại, có phân trang và action nhanh.</p>
        </div>
        <Button type="button" variant="outline" className="shrink-0">
          <Plus className="h-4 w-4" />
          Thêm mới
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Loại</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Chất lượng</TableHead>
                <TableHead>Đơn giá</TableHead>
                <TableHead>Nguồn</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((part) => {
                const quality = inferQuality(part);

                return (
                  <TableRow key={part.id}>
                    <TableCell>{categoryLabels[part.category] || part.category}</TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-950">{part.model}</div>
                      <div className="text-sm text-gray-600">{[part.part_code, part.variant, part.capacity].filter(Boolean).join(" | ") || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <QualityBadge quality={quality} />
                    </TableCell>
                    <TableCell className="font-semibold text-gray-950">{formatPrice(part.price_vnd)}</TableCell>
                    <TableCell className="text-gray-600">{part.source_sheet || part.source_file || "-"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="icon" aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" aria-label="Delete" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <Pagination className="border-t border-gray-200 px-4 py-3">
          <div className="text-sm text-gray-600">
            Trang {page}/{totalPages} | {parts.length} dòng
          </div>
          <div className="flex gap-2">
            <PaginationButton direction="previous" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Trước
            </PaginationButton>
            <PaginationButton direction="next" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              Sau
            </PaginationButton>
          </div>
        </Pagination>
      </CardContent>
    </Card>
  );
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

function formatPrice(value: number | null) {
  if (!value) return "-";
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}
