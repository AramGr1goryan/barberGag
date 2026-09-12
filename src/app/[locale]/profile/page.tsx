import React from "react";
import { redirect } from "next/navigation";
import { authService } from "@/services/auth.service";
import { profileService } from "@/services/profile.service";
import { getDictionary } from "@/i18n/get-dictionary";
import { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { ProfileEditor } from "@/components/profile/ProfileEditor";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await authService.getSession();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  let user = null;
  let bookings: Awaited<ReturnType<typeof profileService.getUserBookings>> = [];
  let services: Awaited<ReturnType<typeof prisma.service.findMany>> = [];
  try {
    [user, bookings, services] = await Promise.all([
      profileService.getUserProfile(session.userId),
      profileService.getUserBookings(session.userId),
      prisma.service.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
  } catch (err) {
    console.error("Error fetching profile data:", err);
  }
  const dict = await getDictionary(locale);

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="py-16 sm:py-24 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileEditor
          locale={locale as Locale}
          user={user}
          bookings={bookings}
          services={services}
          dict={dict.profile}
        />
      </div>
    </div>
  );
}
