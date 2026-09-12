import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { financialAnalyticsService } from "@/services/financial-analytics.service";
import { DateRangeType } from "@/types/financial-analytics";

export async function GET(req: NextRequest) {
  try {
    // 1. Enforce strict Admin-only authorization
    await authService.requireAdmin();

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as DateRangeType) || "30days";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const isExport = searchParams.get("export") === "csv";

    // 3. Retrieve deterministic financial analytics
    const analytics = await financialAnalyticsService.getFullAnalytics({
      rangeType: range,
      startDate,
      endDate,
    });

    // 4. Handle CSV export if requested
    if (isExport) {
      const csvRows = [
        ["Date", "Realized Revenue (AMD)", "Completed Bookings", "Cancelled Bookings", "Average Transaction Value (AMD)"],
        ...analytics.trend.points.map((p) => [
          p.date,
          p.realizedRevenue.toString(),
          p.completedAppointments.toString(),
          p.cancelledAppointments.toString(),
          p.averageTransactionValue.toString(),
        ]),
      ];

      const csvContent = csvRows.map((e) => e.join(",")).join("\n");
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="financial_analytics_${range}.csv"`,
        },
      });
    }

    // 5. Return typed JSON payload
    return NextResponse.json(analytics);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized or server error";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
