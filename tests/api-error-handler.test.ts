import { describe, it, expect } from "vitest";
import { handleApiError, ApiError, apiSuccess } from "@/lib/api-response";
import { z } from "zod";
import { Prisma } from "@prisma/client";

describe("API Error Handler & Response System", () => {
  it("should handle custom ApiError with status and code", async () => {
    const error = new ApiError("Resource not found", 404, "NOT_FOUND", { id: "123" });
    const response = handleApiError(error);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Resource not found");
    expect(body.code).toBe("NOT_FOUND");
    expect(body.details).toEqual({ id: "123" });
  });

  it("should format Zod validation errors cleanly without leaking internal schemas", async () => {
    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 chars"),
      price: z.number().positive("Price must be positive"),
    });

    let zodError: z.ZodError | null = null;
    try {
      schema.parse({ name: "A", price: -10 });
    } catch (e) {
      if (e instanceof z.ZodError) zodError = e;
    }

    expect(zodError).not.toBeNull();
    const response = handleApiError(zodError!);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.error).toContain("name: Name must be at least 2 chars");
    expect(body.error).toContain("price: Price must be positive");
  });

  it("should handle Prisma P2002 unique constraint without leaking SQL syntax", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`date`)",
      {
        code: "P2002",
        clientVersion: "6.4.1",
        meta: { target: ["date"] },
      }
    );

    const response = handleApiError(prismaError);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe("UNIQUE_CONSTRAINT");
    expect(body.error).toBe("A record with this date already exists.");
  });

  it("should handle Prisma P2025 record not found", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "An operation failed because it depends on one or more records that were required but not found.",
      {
        code: "P2025",
        clientVersion: "6.4.1",
      }
    );

    const response = handleApiError(prismaError);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe("NOT_FOUND");
    expect(body.error).toBe("Requested record was not found.");
  });

  it("should sanitize raw internal Prisma validation/invocation errors", async () => {
    const rawError = new Error(
      `Invalid \`prisma.service.update()\` invocation:\n{\n  where: { id: "123" },\n  data: { active: undefined, + sortOrder: Int }\n}\nArgument \`sortOrder\` is missing.`
    );

    const response = handleApiError(rawError, "Failed to update service item", 400);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    // Should NOT contain technical Prisma invocation details
    expect(body.error).not.toContain("Invalid `prisma.service.update()` invocation");
    expect(body.error).toBe("Failed to update service item");
  });

  it("should handle UNAUTHORIZED_ADMIN_ACCESS error with 403 status", async () => {
    const authError = new Error("UNAUTHORIZED_ADMIN_ACCESS");
    const response = handleApiError(authError);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.error).toBe("Admin authorization required");
  });

  it("should format apiSuccess responses consistently", async () => {
    const response = apiSuccess({ service: { id: "srv-1", name: "Haircut" } }, 201);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.service.id).toBe("srv-1");
  });
});
