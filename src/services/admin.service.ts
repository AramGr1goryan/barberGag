import { prisma } from "@/lib/prisma";
import { BookingStatus, CallbackStatus, SlotStatus } from "@prisma/client";
import { getCurrentYerevanDateString } from "@/lib/timezone";
import { Prisma } from "@prisma/client";
import { unstable_cache, revalidateTag } from "next/cache";

export class AdminService {
  /**
   * Executive Dashboard KPIs and Summary Metrics
   */
  getDashboardMetrics = unstable_cache(
    async () => {
      const todayStr = getCurrentYerevanDateString();

    const [
      todayBookings,
      upcomingBookings,
      confirmedCount,
      pendingCount,
      cancelledCount,
      availableSlotsCount,
      newCallbacksCount,
      totalCustomersCount,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          date: todayStr,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_VERIFICATION] },
        },
      }),
      prisma.booking.count({
        where: {
          date: { gte: todayStr },
          status: BookingStatus.CONFIRMED,
        },
      }),
      prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      prisma.booking.count({ where: { status: BookingStatus.PENDING_VERIFICATION } }),
      prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
      prisma.availabilitySlot.count({
        where: {
          status: SlotStatus.AVAILABLE,
          availabilityDay: { isOpen: true, date: { gte: todayStr } },
        },
      }),
      prisma.callbackRequest.count({ where: { status: CallbackStatus.NEW } }),
      prisma.user.count({ where: { role: "USER" } }),
    ]);

    const recentBookings = await prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    return {
      todayBookings,
      upcomingBookings,
      confirmedCount,
      pendingCount,
      cancelledCount,
      availableSlotsCount,
      newCallbacksCount,
      totalCustomersCount,
      recentBookings,
    };
    },
    ["admin-dashboard-metrics"],
    { revalidate: 60 } // Cache for 60 seconds
  );

  /**
   * Log administrative audit action
   */
  async logAudit(params: {
    actorId?: string;
    actorEmail?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: (params.metadata || {}) as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Get active theme settings (or create default)
   */
  getThemeSettings = unstable_cache(
    async () => {
      let theme = await prisma.themeSettings.findUnique({
        where: { id: "default" },
      });

      if (!theme) {
        theme = await prisma.themeSettings.create({
          data: { id: "default" },
        });
      }

      return theme;
    },
    ["theme-settings"],
    { tags: ["theme-settings"], revalidate: 3600 } // Cache for 1 hour, revalidated on update
  );

  /**
   * Update theme settings with sanitization
   */
  async updateThemeSettings(data: {
    background: string;
    foreground: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    muted: string;
    accent: string;
    accentForeground: string;
    buttonStyle: string;
    hoverEffect: string;
  }) {
    const updated = await prisma.themeSettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });
    
    revalidateTag("theme-settings");
    return updated;
  }

  /**
   * Get all site content dictionary
   */
  async getSiteContent() {
    return prisma.siteContent.findMany({
      orderBy: { key: "asc" },
    });
  }

  /**
   * Update or create site content key
   */
  async upsertSiteContent(key: string, section: string, values: { hy: string; ru: string; en: string }) {
    return prisma.siteContent.upsert({
      where: { key },
      update: {
        valueHy: values.hy,
        valueRu: values.ru,
        valueEn: values.en,
        section,
      },
      create: {
        key,
        section,
        valueHy: values.hy,
        valueRu: values.ru,
        valueEn: values.en,
      },
    });
  }

  /**
   * Callback requests management
   */
  async getCallbackRequests() {
    return prisma.callbackRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async updateCallbackStatus(id: string, status: CallbackStatus) {
    return prisma.callbackRequest.update({
      where: { id },
      data: { status },
    });
  }
}

export const adminService = new AdminService();
