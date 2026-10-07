import React from "react";
import { getDictionary } from "@/i18n/get-dictionary";
import { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { unstable_cache } from "next/cache";
import { HeroSection } from "@/components/home/HeroSection";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  // Fetch admin barber photo
  let barberPhotoUrl = "/images/gagik-barber.jpg";
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      include: { profile: true },
    });
    if (adminUser?.profile?.photoUrl) {
      barberPhotoUrl = adminUser.profile.photoUrl;
    }
  } catch (err) {
    console.error("Error fetching admin user photo:", err);
  }

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
  let currentUser = session
    ? { name: session.name, phone: session.phone, email: "" }
    : null;

  let userPreferredServiceId: string | undefined = undefined;
  if (session?.userId) {
    try {
      const userProfile = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { profile: true },
      });
      if (userProfile?.email && currentUser) {
        currentUser.email = userProfile.email;
      }
      if (userProfile?.profile?.preferredHaircut) {
        const matched = services.find(
          (s) =>
            s.id === userProfile.profile!.preferredHaircut ||
            s.nameHy === userProfile.profile!.preferredHaircut ||
            s.nameRu === userProfile.profile!.preferredHaircut ||
            s.nameEn === userProfile.profile!.preferredHaircut
        );
        if (matched) {
          userPreferredServiceId = matched.id;
        }
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Cinematic Parallax Hero */}
      <HeroSection
        locale={locale as Locale}
        barberPhotoUrl={barberPhotoUrl}
        dict={dict.hero}
        bookingDict={dict.booking}
        services={services}
        addons={addons}
        currentUser={currentUser}
        initialServiceId={userPreferredServiceId}
      />
    </div>
  );
}
