import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({ className, value = 0, ...props }: React.HTMLAttributes<HTMLDivElement> & { value?: number }) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-md bg-gray-100", className)} {...props}>
      <div
        className="h-full bg-blue-600 transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
