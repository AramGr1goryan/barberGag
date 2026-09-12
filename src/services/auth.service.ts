import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAuthToken, verifyAuthToken, UserSessionPayload } from "@/lib/crypto";
import { Role } from "@prisma/client";
import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "barber_auth_token";

export class AuthService {
  /**
   * Register a new customer
   */
  async register(params: {
    name: string;
    phone: string;
    email?: string;
    password: string;
  }) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: params.phone },
          ...(params.email ? [{ email: params.email }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.phone === params.phone) {
        throw new Error("PHONE_ALREADY_REGISTERED");
      }
      throw new Error("EMAIL_ALREADY_REGISTERED");
    }

    const passwordHash = await bcrypt.hash(params.password, 10);

    const user = await prisma.user.create({
      data: {
        name: params.name,
        phone: params.phone,
        email: params.email || null,
        passwordHash,
        role: Role.USER,
        profile: {
          create: {},
        },
      },
      include: { profile: true },
    });

    const token = await createAuthToken({
      userId: user.id,
      role: user.role,
      phone: user.phone,
      name: user.name,
    });

    return { user, token };
  }

  /**
   * Authenticate user with email or phone + password
   */
  async login(identifier: string, password: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
      include: { profile: true },
    });

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const token = await createAuthToken({
      userId: user.id,
      role: user.role,
      phone: user.phone,
      name: user.name,
    });

    return { user, token };
  }

  /**
   * Retrieve current authenticated session from cookies (Server Components / Actions)
   */
  async getSession(): Promise<UserSessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyAuthToken(token);
  }

  /**
   * Require admin privileges or throw error
   */
  async requireAdmin(): Promise<UserSessionPayload> {
    const session = await this.getSession();
    if (!session || session.role !== Role.ADMIN) {
      throw new Error("UNAUTHORIZED_ADMIN_ACCESS");
    }
    return session;
  }
}

export const authService = new AuthService();
