import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/i18n/get-dictionary";
import { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import {
  Award,
  Compass,
  ShieldCheck,
  Scissors,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  // Fetch bio and barber name from database
  let bioContent = null;
  let nameContent = null;
  try {
    [bioContent, nameContent] = await Promise.all([
      prisma.siteContent.findUnique({ where: { key: "barber_bio" } }),
      prisma.siteContent.findUnique({ where: { key: "barber_name" } }),
    ]);
  } catch (err) {
    console.error("Error fetching about page content:", err);
  }

  const barberName =
    locale === "ru"
      ? nameContent?.valueRu || "Гагик Гамбарян"
      : locale === "en"
      ? nameContent?.valueEn || "Gagik Ghambaryan"
      : nameContent?.valueHy || "Գագիկ Ղամբարյան";

  const barberBio =
    locale === "ru"
      ? bioContent?.valueRu || dict.about.story
      : locale === "en"
      ? bioContent?.valueEn || dict.about.story
      : bioContent?.valueHy || dict.about.story;

  const coreValues = {
    hy: [
      {
        icon: Scissors,
        title: "Ճշգրտություն և Ոճ",
        desc: "Գլխի անատոմիական կառուցվածքին և դիմագծերին համապատասխանեցված անհատական ձևավորում:",
      },
      {
        icon: ShieldCheck,
        title: "Անթերի Հիգիենա",
        desc: "Գործիքների բժշկական մակարդակի ստերիլիզացում և մեկանգամյա օգտագործման պարագաներ:",
      },
      {
        icon: Compass,
        title: "Բացառիկ Փորձառություն",
        desc: "Հարմարավետ կաշվե բազկաթոռներ, պրեմիում ըմպելիքներ և անաղմուկ հանգիստ միջավայր:",
      },
      {
        icon: Award,
        title: "Միջազգային Կարգավիճակ",
        desc: "Պարբերական մասնակցություն եվրոպական վարպետաց դասերին և նորաձևության միտումներին:",
      },
    ],
    ru: [
      {
        icon: Scissors,
        title: "Точность и Стиль",
        desc: "Стрижка с учетом формы лица, плотности волос и индивидуальных анатомических пропорций.",
      },
      {
        icon: ShieldCheck,
        title: "Медицинская Стерильность",
        desc: "Многоступенчатая обработка инструментов, ультразвуковая чистка и одноразовые материалы.",
      },
      {
        icon: Compass,
        title: "Клубная Атмосфера",
        desc: "Итальянские кресла ручной работы, селективные напитки и приватная спокойная обстановка.",
      },
      {
        icon: Award,
        title: "Признанный Мастер",
        desc: "Многолетняя практика, европейские сертификаты и постоянное совершенствование техник.",
      },
    ],
    en: [
      {
        icon: Scissors,
        title: "Precision & Geometry",
        desc: "Architectural tailoring tailored precisely to head structure and individual aesthetic profile.",
      },
      {
        icon: ShieldCheck,
        title: "Clinical Hygiene",
        desc: "Medical-grade sterilization, ultrasonic sanitation, and premium disposable accessories.",
      },
      {
        icon: Compass,
        title: "Private Sanctuary",
        desc: "Bespoke leather recliners, curated refreshments, and an unhurried, serene atmosphere.",
      },
      {
        icon: Award,
        title: "Master Certification",
        desc: "Over a decade of master-level expertise adhering to elite European grooming traditions.",
      },
    ],
  };

  const activeValues =
    locale === "ru"
      ? coreValues.ru
      : locale === "en"
      ? coreValues.en
      : coreValues.hy;

  return (
    <div className="py-16 sm:py-24 bg-background min-h-screen relative overflow-hidden">
      {/* Ambient Liquid Glow Spots */}
      <div className="absolute top-20 left-10 w-[600px] h-[400px] bg-accent/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-10 w-[550px] h-[450px] bg-accent/5 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Header */}
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181b26]/80 border border-white/[0.1] backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.25em] text-accent uppercase font-semibold">
              The Craftsman
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground uppercase">
            {barberName}
          </h1>

          <p className="text-lg sm:text-2xl text-accent font-serif italic">
            «{dict.about.subtitle}»
          </p>
        </div>

        {/* Narrative & Portrait Two-Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Main Portrait Card in Liquid Glass Container */}
          <div className="lg:col-span-5 space-y-5">
            <div className="relative rounded-3xl p-3 sm:p-4 bg-[#181b26]/80 border border-white/[0.12] backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.4)] group overflow-hidden">
              {/* Specular Liquid sheen */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none rounded-3xl" />

              <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-black/40">
                <Image
                  src="/images/gagik-barber.jpg"
                  alt={barberName}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-center filter contrast-[1.05] group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* Floating Experience Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-xl text-xs font-mono text-accent font-semibold shadow-lg">
                    <Award className="w-3.5 h-3.5" />
                    {dict.about.experience}
                  </span>
                </div>

                {/* Bottom Barber Credentials */}
                <div className="absolute bottom-5 left-5 right-5 z-10">
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-1">
                    <div className="text-xs font-mono text-accent uppercase tracking-widest font-semibold">
                      Founder & Master Barber
                    </div>
                    <div className="font-display text-base font-bold text-foreground">
                      {barberName}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Pill Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#161924]/75 border border-white/[0.08] backdrop-blur-xl text-center space-y-1 shadow-lg">
                <div className="font-display text-xl sm:text-2xl font-bold text-accent">
                  12+
                </div>
                <div className="text-[11px] font-mono text-muted uppercase tracking-wider">
                  Years of Mastery
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#161924]/75 border border-white/[0.08] backdrop-blur-xl text-center space-y-1 shadow-lg">
                <div className="font-display text-xl sm:text-2xl font-bold text-accent">
                  5,000+
                </div>
                <div className="text-[11px] font-mono text-muted uppercase tracking-wider">
                  Satisfied Clients
                </div>
              </div>
            </div>
          </div>

          {/* Biography & Principles */}
          <div className="lg:col-span-7 space-y-8">
            {/* Story Card */}
            <div className="rounded-3xl p-6 sm:p-8 bg-[#181b26]/80 border border-white/[0.1] backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase tracking-widest font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Philosophical Approach</span>
              </div>

              <div className="prose prose-invert max-w-none text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4 font-light">
                <p>{barberBio}</p>
                <p>
                  {locale === "ru"
                    ? "Каждый визит в наше приватное пространство — это не просто процедура ухода, а возможность расслабиться, перезагрузиться и подчеркнуть свой статус. Мы работаем исключительно с натуральной косметикой премиум-сегмента и японскими прецизионными инструментами ручной заточки."
                    : locale === "en"
                    ? "Every appointment in our private lounge is an elevated ritual of grooming, confidence, and restoration. We utilize exclusively bespoke organic grooming essentials and surgical Japanese steel instruments calibrated for ultimate precision."
                    : "Յուրաքանչյուր այցելություն մեր սրահ ոչ միայն սովորական խնամքի գործընթաց է, այլև հանգստի, վստահության և բարձրակարգ շփման փորձառություն: Մենք օգտագործում ենք բացառապես պրեմիում դասի բնական կոսմետիկա և ճշգրիտ ճապոնական պողպատից պատրաստված գործիքներ:"}
                </p>
              </div>
            </div>

            {/* Core Values Bento Grid */}
            <div className="space-y-4">
              <div className="text-xs font-mono text-muted uppercase tracking-wider pl-1">
                Foundational Values & Standards
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeValues.map((val, idx) => {
                  const Icon = val.icon;
                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[#161924]/75 border border-white/[0.08] backdrop-blur-xl space-y-3 hover:border-accent/40 hover:bg-[#1c202e]/90 hover:scale-[1.01] transition-all duration-300 shadow-md group"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-display text-sm font-bold text-foreground uppercase tracking-wide">
                        {val.title}
                      </h4>
                      <p className="text-xs text-muted leading-relaxed">
                        {val.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Call To Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href={`/${locale}/booking`}>
                <Button
                  size="lg"
                  variant="primary"
                  className="rounded-full px-8 py-3.5 gap-2 shadow-[0_4px_25px_rgba(197,168,128,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{dict.hero.bookNow}</span>
                </Button>
              </Link>

              <Link href={`/${locale}/portfolio`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 py-3.5 gap-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-accent backdrop-blur-xl transition-all"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{dict.about.viewPortfolio}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
