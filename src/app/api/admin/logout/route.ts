import { NextResponse } from "next/server";
import { getCookieName } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.delete(getCookieName());
  return response;
}
