import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <nav className={cn("flex items-center justify-between gap-3", className)} {...props} />;
}

export function PaginationButton({
  direction,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { direction?: "previous" | "next" }) {
  return (
    <Button type="button" variant="outline" size="sm" {...props}>
      {direction === "previous" ? <ChevronLeft className="h-4 w-4" /> : null}
      {children}
      {direction === "next" ? <ChevronRight className="h-4 w-4" /> : null}
    </Button>
  );
}
