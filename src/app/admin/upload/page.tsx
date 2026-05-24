import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminUpload } from "@/components/AdminUpload";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export default async function AdminUploadPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
        <Link href="/admin" className="w-fit">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            Quay lại dashboard
          </Button>
        </Link>
        <AdminUpload />
      </div>
    </main>
  );
}
