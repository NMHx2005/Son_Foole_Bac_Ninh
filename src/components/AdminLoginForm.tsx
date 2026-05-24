"use client";

import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("password", password);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Không thể đăng nhập.");
      setIsLoading(false);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-blue-600 text-white">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <CardTitle className="text-blue-600">Đăng nhập admin</CardTitle>
        <CardDescription>Nhập mật khẩu để upload Excel/CSV và cập nhật bảng giá.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mật khẩu admin"
              autoFocus
              className="h-12"
            />
          </div>

          {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

          <Button type="submit" disabled={isLoading} size="lg" className="w-full">
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
