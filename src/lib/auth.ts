import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

const cookieName = "foole_admin";
const maxAgeSeconds = 60 * 60 * 24 * 7;

function sessionSecret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "foole-local-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function verifyPassword(password: string) {
  const configured = process.env.ADMIN_PASSWORD || "admin123";
  const input = Buffer.from(password);
  const expected = Buffer.from(configured);

  return input.length === expected.length && crypto.timingSafeEqual(input, expected);
}

export function createSessionValue() {
  const payload = Buffer.from(
    JSON.stringify({
      role: "admin",
      iat: Date.now(),
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function isValidSession(value?: string | null) {
  if (!value) return false;

  const [payload, signature] = value.split(".");
  if (!payload || !signature || sign(payload) !== signature) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { iat?: number };
    if (!decoded.iat || Date.now() - decoded.iat > maxAgeSeconds * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export async function isAdminRequest(request: NextRequest) {
  return isValidSession(request.cookies.get(cookieName)?.value);
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  if (!isValidSession(cookieStore.get(cookieName)?.value)) {
    redirect("/admin/login");
  }
}

export function getSessionCookieOptions() {
  return {
    name: cookieName,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function getCookieName() {
  return cookieName;
}
