import React from "react";
import { getDictionary } from "@/i18n/get-dictionary";
import { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
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

  return (
    <div className="flex flex-col">
      {/* Cinematic Parallax Hero */}
      <HeroSection
        locale={locale as Locale}
        barberPhotoUrl={barberPhotoUrl}
        dict={dict.hero}
        callbackDict={dict.callback}
      />
    </div>
  );
}
