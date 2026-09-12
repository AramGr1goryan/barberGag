import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/services/auth.service";

export async function POST() {
  const response = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
