import React from "react";
import { getDictionary } from "@/i18n/get-dictionary";
import { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { PortfolioGallery } from "@/components/portfolio/PortfolioGallery";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  let items: Awaited<ReturnType<typeof prisma.portfolioImage.findMany>> = [];
  try {
    items = await prisma.portfolioImage.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch (err) {
    console.error("Error fetching portfolio items:", err);
  }

  return (
    <div className="py-16 sm:py-24 bg-background min-h-screen relative overflow-hidden">
      {/* Ambient Liquid Glass Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-accent/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Liquid Glass Capsule */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181b26]/80 border border-white/[0.1] backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.25em] text-accent uppercase font-semibold">
              Visual Archive
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground uppercase">
            {dict.portfolio.title}
          </h1>

          <p className="text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
            {dict.portfolio.subtitle}
          </p>
        </div>

        {/* Gallery with Liquid Glass Architecture */}
        <PortfolioGallery
          locale={locale as Locale}
          items={items}
          dict={dict.portfolio}
        />
      </div>
    </div>
  );
}
