"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Locale } from "@/i18n/config";
import { formatCurrency } from "@/lib/timezone";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  Camera,
  Calendar,
  Clock,
  LogOut,
  CheckCircle2,
  Scissors,
  DollarSign,
  TrendingUp,
  Receipt,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export interface ProfileUserProps {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  profile: {
    photoUrl: string | null;
    preferredHaircut: string | null;
    hairColor: string | null;
    preferences: string | null;
  } | null;
}

export interface ProfileBookingProps {
  id: string;
  bookingNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPriceMinorUnits: number;
  status: string;
  items: {
    nameSnapshot: string;
  }[];
}

export interface ProfileServiceItem {
  id: string;
  nameHy: string;
  nameRu: string;
  nameEn: string;
  durationMinutes: number;
  priceMinorUnits: number;
}

export interface ProfileEditorProps {
  locale: Locale;
  user: ProfileUserProps;
  bookings: ProfileBookingProps[];
  services?: ProfileServiceItem[];
  dict: {
    title: string;
    subtitle: string;
    haircutStyle: string;
    hairColor: string;
    preferences: string;
    photoUpload: string;
    saveChanges: string;
    history: string;
    noHistory: string;
  };
}

export function ProfileEditor({
  locale,
  user,
  bookings,
  services = [],
  dict,
}: ProfileEditorProps) {
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [preferredHaircut, setPreferredHaircut] = useState(user.profile?.preferredHaircut || "");
  const [hairColor, setHairColor] = useState(user.profile?.hairColor || "");
  const [preferences, setPreferences] = useState(user.profile?.preferences || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(user.profile?.photoUrl || null);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // Calculate Client Financial Analytics (strictly based on COMPLETED appointments)
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const thisMonthBookings = completedBookings.filter((b) => b.date.startsWith(currentYearMonth));

  const thisMonthSpent = thisMonthBookings.reduce((sum, b) => sum + (b.totalPriceMinorUnits || 0), 0);
  const totalLifetimeSpent = completedBookings.reduce((sum, b) => sum + (b.totalPriceMinorUnits || 0), 0);
  const completedVisitsCount = completedBookings.length;
  const averageSpendPerVisit = completedVisitsCount > 0 ? Math.round(totalLifetimeSpent / completedVisitsCount) : 0;

  // Find if preferred haircut matches an active service
  const matchedService = services.find(
    (s) =>
      s.id === preferredHaircut ||
      s.nameHy === preferredHaircut ||
      s.nameRu === preferredHaircut ||
      s.nameEn === preferredHaircut
  );

  const directBookingUrl = matchedService
    ? `/${locale}/booking?serviceId=${matchedService.id}`
    : `/${locale}/booking`;

  const getServiceName = (s: ProfileServiceItem) => {
    if (locale === "ru") return s.nameRu;
    if (locale === "en") return s.nameEn;
    return s.nameHy;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload photo");
      }

      setPhotoUrl(data.url);

      // Save photo to profile immediately
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: data.url }),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          preferredHaircut,
          hairColor,
          preferences,
          photoUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccessMessage(
        locale === "ru"
          ? "Профиль успешно обновлен! Предпочитаемая услуга будет выбрана автоматически."
          : locale === "en"
          ? "Profile saved! Preferred service will be automatically selected for booking."
          : "Պրոֆիլը հաջողությամբ պահպանվեց: Նախընտրած ծառայությունն ավտոմատ կընտրվի ամրագրելիս:"
      );
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Direct 1-Click Booking Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-accent uppercase font-semibold">
            Gentlemen&apos;s Lounge
          </span>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground mt-1">
            {dict.title}
          </h1>
          <p className="text-xs text-muted mt-1">{dict.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Direct 1-Click Booking Button from Cabinet */}
          <Link href={directBookingUrl}>
            <Button
              variant="primary"
              size="md"
              className="gap-2.5 px-5 py-3 shadow-[0_4px_25px_rgba(197,168,128,0.25)] hover:shadow-[0_6px_30px_rgba(197,168,128,0.4)]"
            >
              <Scissors className="w-4 h-4 transform -rotate-45" />
              <span className="font-semibold tracking-wider">
                {locale === "ru" ? "Записаться онлайн" : locale === "en" ? "Book Online" : "Ամրագրել հիմա"}
              </span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/10 py-3"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">
              {locale === "ru" ? "Выйти" : locale === "en" ? "Log out" : "Ելք"}
            </span>
          </Button>
        </div>
      </div>

      {/* Customer Financial Analytics Banner (Monthly Spending Report) */}
      <div className="bg-[#191c26]/85 backdrop-blur-2xl border border-white/[0.09] rounded-3xl p-6 sm:p-8 shadow-[0_12px_45px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.06)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shadow-[0_0_15px_rgba(197,168,128,0.15)]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                {locale === "ru"
                  ? "Ваша финансовая аналитика и визиты"
                  : locale === "en"
                  ? "Personal Spending Analytics & Visits"
                  : "Ձեր ֆինանսական հաշվետվությունը և այցերը"}
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {locale === "ru"
                  ? "Точный расчет расходов на основе завершенных визитов в барбершоп"
                  : locale === "en"
                  ? "Verified expenses calculated strictly from completed visits"
                  : "Ծախսերի հստակ հաշվարկ՝ հիմնված կատարված այցելությունների վրա"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-semibold bg-accent/15 text-accent border border-accent/30">
              LOYAL CLIENT
            </span>
          </div>
        </div>

        {/* 4 Financial Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Stat 1: This Month Spent */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted">
                {locale === "ru" ? "В этом месяце" : locale === "en" ? "This Month" : "Այս ամիս"}
              </span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-400">
              {formatCurrency(thisMonthSpent, locale)}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              {thisMonthBookings.length} {locale === "ru" ? "визита(ов)" : locale === "en" ? "visit(s)" : "այց"}
            </span>
          </div>

          {/* Stat 2: Total Lifetime Spent */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted">
                {locale === "ru" ? "Всего за все время" : locale === "en" ? "Total Spent" : "Ընդհանուր ծախս"}
              </span>
              <Receipt className="w-4 h-4 text-accent" />
            </div>
            <div className="text-lg sm:text-2xl font-bold font-mono text-accent">
              {formatCurrency(totalLifetimeSpent, locale)}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              {completedVisitsCount} {locale === "ru" ? "завершенных визитов" : locale === "en" ? "completed visits" : "կատարված այց"}
            </span>
          </div>

          {/* Stat 3: Completed Visits */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted">
                {locale === "ru" ? "Визитов в салон" : locale === "en" ? "Visits Count" : "Այցերի քանակ"}
              </span>
              <Calendar className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold font-mono text-foreground">
              {completedVisitsCount}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              {locale === "ru" ? "Выполненные стрижки" : locale === "en" ? "Completed bookings" : "Հաջողված գրանցումներ"}
            </span>
          </div>

          {/* Stat 4: Average Spend */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted">
                {locale === "ru" ? "Средний чек" : locale === "en" ? "Average Ticket" : "Միջին չեկ"}
              </span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold font-mono text-amber-300">
              {formatCurrency(averageSpendPerVisit, locale)}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              {locale === "ru" ? "За одну запись" : locale === "en" ? "Per appointment" : "Մեկ այցի համար"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Card & Photo Column */}
        <div className="lg:col-span-4 bg-[#191c26]/85 backdrop-blur-2xl border border-white/[0.09] rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-lg">
          <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden border-2 border-accent bg-surface-elevated group shadow-[0_0_25px_rgba(197,168,128,0.2)]">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">
                <User className="w-12 h-12" />
              </div>
            )}

            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-accent text-[10px] font-mono uppercase tracking-wider">
              <Camera className="w-5 h-5 mb-1" />
              <span>{isUploading ? "..." : "Change"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{name}</h3>
            <p className="text-xs font-mono text-accent mt-0.5">{user.phone}</p>
            {user.email && <p className="text-xs font-mono text-muted mt-0.5">{user.email}</p>}
          </div>

          {/* Quick Direct Booking Button on Mobile Card */}
          <Link href={directBookingUrl} className="block w-full">
            <Button
              variant="primary"
              className="w-full py-3.5 gap-2 rounded-2xl shadow-[0_4px_20px_rgba(197,168,128,0.25)]"
            >
              <Scissors className="w-4 h-4 transform -rotate-45" />
              <span>
                {locale === "ru" ? "Записаться к барберу" : locale === "en" ? "Book Barber" : "Գրանցվել վարպետին"}
              </span>
            </Button>
          </Link>

          <div className="p-4 bg-black/30 border border-white/[0.06] rounded-2xl text-left text-xs font-mono space-y-2">
            <div className="flex items-center space-x-1.5 text-accent text-[11px] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Fast Booking Active</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {locale === "ru"
                ? "Ваше имя, номер и предпочитаемый стиль автоматически подставляются при записи."
                : locale === "en"
                ? "Your name, phone and preferred cut are automatically prefilled during booking."
                : "Ձեր տվյալներն ու նախընտրած կտրվածքն ավտոմատ լրացվում են ամրագրելիս:"}
            </p>
          </div>
        </div>

        {/* Profile Settings Form Column */}
        <div className="lg:col-span-8 bg-[#191c26]/85 backdrop-blur-2xl border border-white/[0.09] rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="font-display text-lg font-bold text-foreground">
              {locale === "ru"
                ? "Настройки стиля и стрижки"
                : locale === "en"
                ? "Style & Haircut Preferences"
                : "Ոճային Նախասիրություններ"}
            </h3>
            <span className="text-[10px] font-mono text-accent">AUTO-SYNC WITH BOOKING</span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <Input
              label={locale === "ru" ? "Имя Фамилия" : locale === "en" ? "Full Name" : "Անուն Ազգանուն"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {/* Preferred Haircut Service Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {dict.haircutStyle}
                </label>
                <span className="text-[10px] font-mono text-accent">
                  {locale === "ru"
                    ? "★ Автовыбор при онлайн-записи"
                    : locale === "en"
                    ? "★ Auto-selected on booking"
                    : "★ Ավտոընտրություն ամրագրելիս"}
                </span>
              </div>

              {/* Service Selection Dropdown */}
              <div className="relative">
                <select
                  value={preferredHaircut}
                  onChange={(e) => setPreferredHaircut(e.target.value)}
                  className="w-full bg-[#12141c] border border-white/[0.12] rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
                >
                  <option value="">
                    {locale === "ru"
                      ? "-- Выберите услугу из каталога --"
                      : locale === "en"
                      ? "-- Choose preferred service from catalog --"
                      : "-- Ընտրեք ծառայությունների ցանկից --"}
                  </option>
                  {services.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {getServiceName(svc)} — {formatCurrency(svc.priceMinorUnits, locale)} ({svc.durationMinutes} min)
                    </option>
                  ))}
                </select>
                <ChevronRight className="w-4 h-4 text-muted absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
              </div>

              {/* Quick Chip Pickers for Top Services */}
              {services.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {services.slice(0, 4).map((svc) => {
                    const isSelected = preferredHaircut === svc.id || preferredHaircut === svc.nameHy || preferredHaircut === svc.nameRu;
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => setPreferredHaircut(svc.id)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          isSelected
                            ? "bg-accent text-black font-semibold border-accent shadow-[0_0_15px_rgba(197,168,128,0.4)]"
                            : "bg-white/[0.03] text-muted-foreground border-white/[0.08] hover:border-accent/40 hover:text-foreground"
                        }`}
                      >
                        {getServiceName(svc)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={dict.hairColor}
                value={hairColor}
                onChange={(e) => setHairColor(e.target.value)}
                placeholder="Dark Brown / Black / Natural"
              />

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  {locale === "ru" ? "Прямой переход" : locale === "en" ? "Fast Link" : "Արագ հղում"}
                </label>
                <Link href={directBookingUrl} className="block">
                  <div className="w-full bg-[#12141c] border border-accent/30 hover:border-accent rounded-xl px-4 py-3 text-xs font-mono text-accent flex items-center justify-between transition-colors">
                    <span>{locale === "ru" ? "Перейти к записи с этой услугой" : "Ամրագրել այս ծառայությամբ"}</span>
                    <Scissors className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {dict.preferences}
              </label>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                rows={3}
                className="w-full bg-[#12141c] border border-white/[0.12] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
                placeholder={
                  locale === "ru"
                    ? "Дополнительные пожелания мастеру (чувствительность кожи, форма укладки, предпочтительный воск)..."
                    : "Հավելյալ նշումներ վարպետի համար..."
                }
              />
            </div>

            {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
            {successMessage && (
              <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              className="py-3 px-8 rounded-xl font-semibold tracking-wider"
            >
              {dict.saveChanges}
            </Button>
          </form>
        </div>
      </div>

      {/* Appointment History Table */}
      <div className="bg-[#191c26]/85 backdrop-blur-2xl border border-white/[0.09] rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <h3 className="font-display text-lg font-bold text-foreground">
            {dict.history}
          </h3>
          <span className="text-xs font-mono text-muted">
            {bookings.length} {locale === "ru" ? "записей" : locale === "en" ? "bookings" : "գրանցում"}
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-xs text-muted font-mono">{dict.noHistory}</p>
            <Link href={directBookingUrl}>
              <Button size="sm" variant="outline" className="border-accent/40 text-accent">
                {locale === "ru" ? "Сделать первую запись" : locale === "en" ? "Book First Cut" : "Կատարել առաջին գրանցումը"}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] text-muted uppercase text-[10px]">
                  <th className="py-3 px-4">Համար / Ref</th>
                  <th className="py-3 px-4">Ամսաթիվ / Date</th>
                  <th className="py-3 px-4">Ժամ / Time</th>
                  <th className="py-3 px-4">Ծառայություն</th>
                  <th className="py-3 px-4">Գումար</th>
                  <th className="py-3 px-4">Կարգավիճակ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-accent">{b.bookingNumber}</td>
                    <td className="py-3.5 px-4 text-foreground">{b.date}</td>
                    <td className="py-3.5 px-4 text-muted">
                      {b.startTime} - {b.endTime}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-foreground">
                      {b.items.map((i) => i.nameSnapshot).join(", ")}
                    </td>
                    <td className="py-3.5 px-4 text-accent font-bold">
                      {formatCurrency(b.totalPriceMinorUnits, locale)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          b.status === "CONFIRMED"
                            ? "gold"
                            : b.status === "COMPLETED"
                            ? "green"
                            : b.status === "CANCELLED"
                            ? "red"
                            : "gray"
                        }
                      >
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
