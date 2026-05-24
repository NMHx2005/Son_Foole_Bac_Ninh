"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastMessage = {
  id: number;
  title: string;
  description?: string;
  variant?: "success" | "error";
};

export function ToastViewport({ toast }: { toast: ToastMessage | null }) {
  if (!toast) return null;

  const Icon = toast.variant === "error" ? XCircle : CheckCircle2;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div
        className={cn(
          "flex gap-3 rounded-md border bg-white p-4 text-sm shadow-sm",
          toast.variant === "error" ? "border-red-200 text-red-900" : "border-green-200 text-green-900",
        )}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <div className="font-medium">{toast.title}</div>
          {toast.description ? <div className="mt-1 text-gray-600">{toast.description}</div> : null}
        </div>
      </div>
    </div>
  );
}
