import React from "react";
import { getDictionary } from "@/i18n/get-dictionary";
import { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { unstable_cache } from "next/cache";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  // Fetch active services and addons from PostgreSQL with cache
  const getCachedServices = unstable_cache(
    async () => prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    ["active-services"],
    { revalidate: 60 }
  );

  const getCachedAddons = unstable_cache(
    async () => prisma.addon.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    ["active-addons"],
    { revalidate: 60 }
  );

  let services: Awaited<ReturnType<typeof prisma.service.findMany>> = [];
  let addons: Awaited<ReturnType<typeof prisma.addon.findMany>> = [];
  try {
    [services, addons] = await Promise.all([getCachedServices(), getCachedAddons()]);
  } catch (err) {
    console.error("Error fetching services/addons:", err);
  }

  // Check if user is logged in for Fast Booking and preferred service auto-selection
  const session = await authService.getSession();
  const currentUser = session
    ? { name: session.name, phone: session.phone }
    : null;

  let userPreferredServiceId: string | undefined = undefined;
  if (session?.userId) {
    try {
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
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  }

  const effectiveInitialServiceId = serviceId || userPreferredServiceId;

  return (
    <div className="-mt-20 min-h-screen bg-[#0e0f13] text-foreground relative overflow-x-clip selection:bg-accent selection:text-black">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/5 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-950/20 rounded-full blur-[180px] pointer-events-none -z-10" />

      <BookingWizard
        locale={locale as Locale}
        services={services}
        addons={addons}
        initialServiceId={effectiveInitialServiceId}
        dict={dict.booking}
        currentUser={currentUser}
      />
    </div>
  );
}
