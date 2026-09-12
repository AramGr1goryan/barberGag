import React from "react";
import { getDictionary } from "@/i18n/get-dictionary";
import { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { BookingWizard } from "@/components/booking/BookingWizard";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ serviceId?: string }>;
}) {
  const { locale } = await params;
  const { serviceId } = await searchParams;
  const dict = await getDictionary(locale);

  // Fetch active services and addons from PostgreSQL
  const [services, addons] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.addon.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // Check if user is logged in for Fast Booking and preferred service auto-selection
  const session = await authService.getSession();
  const currentUser = session
    ? { name: session.name, phone: session.phone }
    : null;

  let userPreferredServiceId: string | undefined = undefined;
  if (session?.userId) {
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.userId },
    });
    if (userProfile?.preferredHaircut) {
      const matched = services.find(
        (s) =>
          s.id === userProfile.preferredHaircut ||
          s.nameHy === userProfile.preferredHaircut ||
          s.nameRu === userProfile.preferredHaircut ||
          s.nameEn === userProfile.preferredHaircut
      );
      if (matched) {
        userPreferredServiceId = matched.id;
      }
    }
  }

  const effectiveInitialServiceId = serviceId || userPreferredServiceId;

  return (
    <div className="py-12 sm:py-20 bg-background min-h-screen pb-28 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center space-x-2 border-b border-accent/60 pb-1">
            <span className="text-[11px] font-mono tracking-[0.25em] text-accent uppercase font-semibold">
              Online Reservation
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground uppercase">
            {dict.booking.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            {dict.booking.subtitle}
          </p>
        </div>

        {/* Wizard */}
        <BookingWizard
          locale={locale as Locale}
          services={services}
          addons={addons}
          initialServiceId={effectiveInitialServiceId}
          dict={dict.booking}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
