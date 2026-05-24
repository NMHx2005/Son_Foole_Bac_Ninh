import Link from "next/link";
import { MonitorSmartphone, Settings } from "lucide-react";
import { PriceSearch } from "@/components/PriceSearch";
import { Button } from "@/components/ui/button";
import { searchParts } from "@/lib/parts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Home() {
  const initialResults = searchParts({ limit: 60 });

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
              <MonitorSmartphone className="h-5 w-5" />
            </div>
            <div className="truncate text-xl font-semibold text-gray-950">FOOLE Bắc Ninh</div>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="h-10">
              <Settings className="h-4 w-4" />
              Admin
            </Button>
          </Link>
        </div>
      </header>
      <PriceSearch initialResults={initialResults} />
    </main>
  );
}
