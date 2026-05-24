import { NextResponse } from "next/server";
import { createSessionValue, getSessionCookieOptions, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Mật khẩu admin không đúng." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    ...getSessionCookieOptions(),
    value: createSessionValue(),
  });

  return response;
}
