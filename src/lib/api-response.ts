import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode: number = 400, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Standardized API error handler for Next.js App Router route handlers.
 * Ensures consistent response format { success: false, error: string, message: string, code?: string }
 * and never leaks raw Prisma/SQL/system traces to the client.
 */
export function handleApiError(
  error: unknown,
  fallbackMessage: string = "An unexpected error occurred",
  defaultStatus: number = 400
): NextResponse {
  // If it's our custom ApiError
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: error.message,
        code: error.code || "API_ERROR",
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // If it's a Zod validation error
  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    const message = `Validation error: ${formattedErrors.join(", ")}`;
    return NextResponse.json(
      {
        success: false,
        error: message,
        message,
        code: "VALIDATION_ERROR",
        details: error.issues,
      },
      { status: 400 }
    );
  }

  // Handle Prisma Known Request Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`[Prisma Known Error ${error.code}]:`, error.message);
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[])?.join(", ") || "field";
      const message = `A record with this ${target} already exists.`;
      return NextResponse.json(
        { success: false, error: message, message, code: "UNIQUE_CONSTRAINT" },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Requested record was not found.", message: "Requested record was not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        { success: false, error: "Cannot complete operation due to linked records.", message: "Cannot complete operation due to linked records.", code: "FOREIGN_KEY_CONSTRAINT" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Database operation error. Please try again.", message: "Database operation error. Please try again.", code: error.code },
      { status: 400 }
    );
  }

  // Handle Prisma Validation Errors (e.g., NaN passed to Int, missing required schema args)
  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error("[Prisma Validation Error]:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: "Invalid data format or missing required field.",
        message: "Invalid data format or missing required field.",
        code: "INVALID_DATA_ERROR",
      },
      { status: 400 }
    );
  }

  // Handle standard Error
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED_ADMIN_ACCESS") {
      return NextResponse.json(
        { success: false, error: "Admin authorization required", message: "Admin authorization required", code: "UNAUTHORIZED" },
        { status: 403 }
      );
    }

    if (error.message === "ACTIVE_BOOKING_EXISTS" || error.message === "THREE_HOUR_RESTRICTION") {
      const conflictingBooking = (error as unknown as { conflictingBooking?: unknown }).conflictingBooking;
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          message:
            error.message === "ACTIVE_BOOKING_EXISTS"
              ? "Դուք արդեն ունեք ակտիվ ամրագրում:"
              : "One person cannot book more than one appointment within a 3-hour period.",
          code: error.message,
          conflictingBooking,
        },
        { status: 409 }
      );
    }

    if (error.message === "SLOT_ALREADY_RESERVED") {
      return NextResponse.json(
        { success: false, error: "SLOT_ALREADY_RESERVED", message: "This time slot is no longer available.", code: "SLOT_ALREADY_RESERVED" },
        { status: 409 }
      );
    }

    // Check if error message contains internal code leaks (Prisma invocation, SQL queries, etc.)
    const isInternalTechnical =
      error.message.includes("invocation:") ||
      error.message.includes("prisma.") ||
      error.message.includes("SELECT ") ||
      error.message.includes("INSERT INTO") ||
      error.message.includes("at PrismaClient");

    console.error("[API Route Error]:", error);

    const message = isInternalTechnical ? fallbackMessage : error.message;
    return NextResponse.json(
      { success: false, error: message, message, code: "APP_ERROR" },
      { status: defaultStatus }
    );
  }

  console.error("[Unknown API Error]:", error);
  return NextResponse.json(
    { success: false, error: fallbackMessage, message: fallbackMessage, code: "UNKNOWN_ERROR" },
    { status: defaultStatus }
  );
}

export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    { success: true, ...(typeof data === "object" && data !== null ? data : { data }) },
    { status }
  );
}
