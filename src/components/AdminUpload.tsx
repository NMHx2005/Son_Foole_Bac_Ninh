"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ToastViewport, type ToastMessage } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Summary = {
  batchId?: number;
  filename: string;
  created: number;
  updated: number;
  unchanged: number;
  duplicates: number;
  errors: number;
  issues: Array<{ level: "warning" | "error"; message: string; rowNumber?: number | null; sheetName?: string | null }>;
};

export function AdminUpload() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function showToast(nextToast: Omit<ToastMessage, "id">) {
    const id = Date.now();
    setToast({ id, ...nextToast });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3500);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files?.length) {
      setError("Vui lòng chọn file Excel hoặc CSV.");
      showToast({ title: "Chưa chọn file", description: "Vui lòng chọn file .xlsx hoặc .csv trước khi tải lên.", variant: "error" });
      return;
    }

    setIsLoading(true);
    setError("");
    setSummaries([]);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    const response = await fetch("/api/admin/import", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as { summaries?: Summary[]; error?: string };

    if (!response.ok) {
      setError(data.error || "Upload thất bại.");
      setIsLoading(false);
      showToast({ title: "Upload thất bại", description: data.error || "Không thể xử lý file đã chọn.", variant: "error" });
      return;
    }

    setSummaries(data.summaries || []);
    setIsLoading(false);
    showToast({ title: "Upload thành công", description: "Dữ liệu giá đã được xử lý và cập nhật.", variant: "success" });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Upload className="h-5 w-5" />
            Upload file giá
          </CardTitle>
          <CardDescription>Upload file mới để tạo mới, cập nhật hoặc bỏ qua dòng không đổi.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <label
              className={cn(
                "flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-10 text-center transition-colors hover:border-blue-600 hover:bg-blue-50/30",
                isDragging && "border-blue-600 bg-blue-50/60",
              )}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                setFiles(event.dataTransfer.files);
              }}
            >
              <Upload className="h-10 w-10 text-blue-600" />
              <div className="mt-4 text-base font-medium text-gray-950">Kéo thả file vào đây hoặc click để chọn</div>
              <div className="mt-2 text-sm text-gray-600">Hỗ trợ .xlsx, .csv</div>
              <input
                type="file"
                multiple
                accept=".xlsx,.csv,.xls"
                className="sr-only"
                onChange={(event) => setFiles(event.target.files)}
              />
            </label>

            {files?.length ? (
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                {Array.from(files).map((file) => (
                  <div key={`${file.name}-${file.size}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 shrink-0 text-blue-600" />
                      <span className="truncate font-medium text-gray-900">{file.name}</span>
                    </div>
                    <span className="text-gray-600">{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
            {isLoading ? <Progress value={65} /> : null}

            <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto">
              <Upload className="h-4 w-4" />
              {isLoading ? "Đang xử lý..." : "Xác nhận tải lên"}
            </Button>
          </form>

          {summaries.length ? (
            <div className="mt-5 space-y-3">
              {summaries.map((summary) => (
                <div key={`${summary.filename}-${summary.batchId ?? summary.errors}`} className="rounded-lg border border-gray-200 p-4">
                  <div className="font-medium text-gray-950">{summary.filename}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <Metric label="Tạo mới" value={summary.created} />
                    <Metric label="Cập nhật" value={summary.updated} />
                    <Metric label="Không đổi" value={summary.unchanged} />
                    <Metric label="Trùng" value={summary.duplicates} />
                    <Metric label="Lỗi" value={summary.errors} />
                  </div>
                  {summary.issues?.length ? <IssueList summary={summary} /> : null}
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <ToastViewport toast={toast} />
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
      <div className="text-sm font-medium text-gray-600">{label}</div>
      <div className="text-lg font-semibold text-gray-950">{value}</div>
    </div>
  );
}

function IssueList({ summary }: { summary: Summary }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-medium text-blue-600">Xem cảnh báo/lỗi</summary>
      <div className="mt-2 max-h-64 space-y-2 overflow-auto">
        {summary.issues.slice(0, 80).map((issue, index) => (
          <div
            key={`${issue.message}-${index}`}
            className={cn(
              "rounded-md border px-3 py-2",
              issue.level === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-orange-200 bg-orange-50 text-orange-800",
            )}
          >
            {issue.sheetName ? `${issue.sheetName} ` : ""}
            {issue.rowNumber ? `dòng ${issue.rowNumber}: ` : ""}
            {issue.message}
          </div>
        ))}
      </div>
    </details>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
