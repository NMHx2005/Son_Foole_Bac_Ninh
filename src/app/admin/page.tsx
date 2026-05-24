import Link from "next/link";
import { BarChart3, Database, Home, LogOut, RefreshCw, Table2 } from "lucide-react";
import { AdminPriceTable } from "@/components/AdminPriceTable";
import { AdminUpload } from "@/components/AdminUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStats, getRecentBatches, getRecentParts } from "@/lib/parts";

export const runtime = "nodejs";

const categoryLabels: Record<string, string> = {
  screen: "Màn hình",
  battery: "Pin",
  cell: "Cell pin",
  warranty: "Bảo hành",
  other: "Khác",
};

export default async function AdminPage() {
  await requireAdmin();

  const stats = getDashboardStats();
  const recentParts = getRecentParts(120);
  const batches = getRecentBatches(8);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-48 shrink-0 border-r border-gray-200 bg-white p-4 lg:block">
          <div className="text-xl font-semibold text-gray-950">FOOLE Admin</div>
          <nav className="mt-6 space-y-1 text-sm">
            <a className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 font-medium text-blue-700" href="#upload">
              <Table2 className="h-4 w-4" />
              Bảng giá
            </a>
            <Link className="flex items-center gap-2 rounded-md px-3 py-2 font-medium text-gray-700 hover:bg-gray-100" href="/">
              <Home className="h-4 w-4" />
              Trang tra cứu
            </Link>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <Badge variant="blue">FOOLE Bắc Ninh</Badge>
                <h1 className="mt-2 text-2xl font-semibold text-gray-950">Admin cập nhật bảng giá</h1>
                <p className="mt-1 text-sm text-gray-600">Upload Excel/CSV để cập nhật giá, không nhân đôi dữ liệu trùng.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/">
                  <Button variant="outline">
                    <Home className="h-4 w-4" />
                    Trang tra cứu
                  </Button>
                </Link>
                <form action="/api/admin/logout" method="post">
                  <Button type="submit" variant="outline">
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </Button>
                </form>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={<Database className="h-5 w-5" />} label="Tổng dữ liệu" value={stats.totalParts} />
              <StatCard icon={<RefreshCw className="h-5 w-5" />} label="Lần import" value={stats.totalBatches} />
              <StatCard icon={<Table2 className="h-5 w-5" />} label="Tạo mới lần cuối" value={stats.latestBatch?.created_count ?? 0} />
              <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Cập nhật lần cuối" value={stats.latestBatch?.updated_count ?? 0} />
            </section>

            <section id="upload" className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <AdminUpload />
              <div className="space-y-5">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">Theo nhóm linh kiện</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stats.byCategory.length ? (
                      stats.byCategory.map((item) => (
                        <div key={item.category} className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2">
                          <span className="text-sm text-gray-700">{categoryLabels[item.category] || item.category}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">Chưa có dữ liệu. Hãy upload file mẫu trước.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">Lịch sử import</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {batches.length ? (
                      batches.map((batch) => (
                        <div key={batch.id} className="rounded-md border border-gray-200 p-3">
                          <div className="font-medium text-gray-950">{batch.filename}</div>
                          <div className="mt-1 text-sm text-gray-600">{batch.created_at}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="green">+{batch.created_count} mới</Badge>
                            <Badge variant="blue">{batch.updated_count} cập nhật</Badge>
                            <Badge variant="outline">{batch.unchanged_count} không đổi</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">Chưa có lần import nào.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>

            <AdminPriceTable parts={recentParts} />
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="text-blue-600">{icon}</div>
        <div className="mt-3 text-sm font-medium text-gray-600">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-gray-950">{value}</div>
      </CardContent>
    </Card>
  );
}
