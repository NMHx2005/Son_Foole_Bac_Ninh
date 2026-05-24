import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-8">
      <div className="flex w-full flex-col items-center gap-4">
        <AdminLoginForm />
        <Link href="/">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang tra cứu
          </Button>
        </Link>
      </div>
    </main>
  );
}
