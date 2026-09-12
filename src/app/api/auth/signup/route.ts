import { NextRequest, NextResponse } from "next/server";
import { authService, AUTH_COOKIE_NAME } from "@/services/auth.service";
import { signupSchema } from "@/validators/auth.schema";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`auth:signup:${ip}`, 5, 15 * 60 * 1000); // 5 per 15 min
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many signup attempts. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const validated = signupSchema.parse(body);

    const { user, token } = await authService.register(validated);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "PHONE_ALREADY_REGISTERED") {
      return NextResponse.json({ error: "A user with this phone number already exists." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED") {
      return NextResponse.json({ error: "A user with this email address already exists." }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
