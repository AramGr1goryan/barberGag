import React from "react";
import { getDictionary } from "@/i18n/get-dictionary";
import { Locale } from "@/i18n/config";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Sparkles,
  ShieldCheck,
  Car,
  Navigation,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const localizedContent = {
    hy: {
      cardTitle: "Սրահի Կոնտակտներ",
      statusOpen: "Բաց է այցելությունների համար",
      parkingTitle: "Կայանատեղի և Ընդունելություն",
      parkingText:
        "Մեր սրահի հյուրերի համար գործում է ստորգետնյա կայանատեղի Հյուսիսային պողոտայում: Այցելությունները կազմակերպվում են բացառապես նախնական գրանցմամբ՝ ապահովելով ձեր անձնական ժամանակն ու հարմարավետությունը:",
      getDirections: "Բացել Քարտեզում",
    },
    ru: {
      cardTitle: "Контакты Студии",
      statusOpen: "Открыто по предварительной записи",
      parkingTitle: "Парковка и Приватный Прием",
      parkingText:
        "Для гостей нашего барбершопа доступен подземный паркинг на Северном проспекте. Прием ведется строго по предварительной записи для сохранения приватности и безупречного комфорта.",
      getDirections: "Открыть в Картах",
    },
    en: {
      cardTitle: "Studio Contacts",
      statusOpen: "Open strictly by appointment",
      parkingTitle: "Private Reception & Valet",
      parkingText:
        "Complimentary underground parking on Northern Avenue is available for all studio guests. All appointments are strictly scheduled in advance to guarantee absolute privacy and dedicated artisan attention.",
      getDirections: "Open Navigation",
    },
  };

  const loc =
    locale === "ru"
      ? localizedContent.ru
      : locale === "en"
      ? localizedContent.en
      : localizedContent.hy;

  return (
    <div className="py-16 sm:py-24 bg-background min-h-screen relative overflow-hidden">
      {/* Ambient Liquid Glass Glows */}
      <div className="absolute top-12 left-1/4 w-[600px] h-[350px] bg-accent/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-16 right-1/4 w-[500px] h-[400px] bg-accent/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181b26]/80 border border-white/[0.1] backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.25em] text-accent uppercase font-semibold">
              Get in Touch
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground uppercase">
            {dict.contact.title}
          </h1>

          <p className="text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
            {dict.contact.subtitle}
          </p>
        </div>

        {/* Contact Info & Map Grid with Liquid Glass Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Details Liquid Glass Bento Card */}
          <div className="lg:col-span-5 bg-[#181b26]/80 border border-white/[0.12] rounded-3xl p-6 sm:p-8 space-y-8 shadow-[0_16px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl relative overflow-hidden">
            {/* Specular Liquid highlight */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
              <h2 className="font-display text-lg sm:text-xl font-bold text-foreground uppercase tracking-wide">
                {loc.cardTitle}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {loc.statusOpen}
              </span>
            </div>

            <div className="space-y-6">
              {/* Address */}
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300 shadow-md">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-muted block">
                    {dict.contact.address}
                  </span>
                  <p className="text-sm text-foreground font-medium mt-1 leading-snug">
                    {dict.contact.addressVal}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300 shadow-md">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-muted block">
                    {dict.contact.phone}
                  </span>
                  <a
                    href={`tel:${dict.contact.phoneVal}`}
                    className="text-sm text-accent hover:text-accent-hover font-mono font-semibold mt-1 block tracking-wide transition-colors"
                  >
                    {dict.contact.phoneVal}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300 shadow-md">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-muted block">
                    {dict.contact.email}
                  </span>
                  <a
                    href={`mailto:${dict.contact.emailVal}`}
                    className="text-sm text-foreground hover:text-accent mt-1 block font-mono transition-colors"
                  >
                    {dict.contact.emailVal}
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300 shadow-md">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-muted block">
                    {dict.contact.hours}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    {dict.contact.hoursVal}
                  </p>
                </div>
              </div>
            </div>

            {/* Book Now Button */}
            <div className="pt-4 border-t border-white/[0.08]">
              <Link href={`/${locale}/booking`} className="block">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full rounded-full py-4 gap-2.5 shadow-[0_4px_25px_rgba(197,168,128,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all font-mono uppercase tracking-wider"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{dict.hero.bookNow}</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive Map & Concierge Card */}
          <div className="lg:col-span-7 space-y-6">
            {/* Map Frame */}
            <div className="rounded-3xl p-3 sm:p-4 bg-[#181b26]/80 border border-white/[0.12] backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.4)] relative overflow-hidden group">
              {/* Map Container */}
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black/50 border border-white/5">
                <iframe
                  title="Barbershop Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.2435478663884!2d44.51268157648356!3d40.18137337147822!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x406abcf87b282719%3A0x60b73dfad08f8832!2sNorthern%20Ave%2C%20Yerevan!5e0!3m2!1sen!2sam!4v1700000000000!5m2!1sen!2sam"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) contrast(1.2)" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />

                {/* Floating Directions Action */}
                <div className="absolute bottom-4 right-4 z-10">
                  <a
                    href="https://maps.google.com/?q=Northern+Avenue+Yerevan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/75 hover:bg-accent hover:text-accent-foreground border border-white/20 text-xs font-mono font-semibold text-white backdrop-blur-xl shadow-xl transition-all duration-300"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{loc.getDirections}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Reception & Parking Concierge Note */}
            <div className="p-6 rounded-3xl bg-[#161924]/75 border border-white/[0.08] backdrop-blur-xl shadow-lg space-y-2.5">
              <div className="flex items-center gap-2 text-accent">
                <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <h3 className="font-mono text-xs uppercase tracking-wider font-semibold">
                  {loc.parkingTitle}
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed pl-9">
                {loc.parkingText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
