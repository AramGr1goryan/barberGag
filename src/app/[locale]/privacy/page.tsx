import React from "react";
import { getDictionary } from "@/i18n/get-dictionary";
import { ShieldCheck } from "lucide-react";

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const title =
    locale === "ru"
      ? "Политика конфиденциальности"
      : locale === "en"
      ? "Privacy Policy"
      : "Գաղտնիության քաղաքականություն";

  const content =
    locale === "ru" ? (
      <>
        <p>
          Мы уважаем вашу конфиденциальность и стремимся защищать ваши личные данные. В этой Политике конфиденциальности объясняется, как мы собираем, используем и защищаем вашу информацию.
        </p>
        <h3 className="text-xl text-foreground font-bold mt-6 mb-3">Сбор информации</h3>
        <p>
          При записи на услуги мы собираем следующие данные:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Ваше имя — чтобы знать, как к вам обращаться.</li>
          <li>Номер телефона — для связи с вами и отправки SMS-уведомлений (коды подтверждения и напоминания о визите).</li>
        </ul>
        <h3 className="text-xl text-foreground font-bold mt-6 mb-3">Использование информации</h3>
        <p>
          Мы используем предоставленную вами информацию исключительно для следующих целей:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Создание и управление вашей записью.</li>
          <li>Отправка сервисных SMS-сообщений для подтверждения записи.</li>
          <li>Улучшение качества обслуживания и связи с вами.</li>
        </ul>
        <h3 className="text-xl text-foreground font-bold mt-6 mb-3">Защита данных</h3>
        <p>
          Мы не передаем, не продаем и не раскрываем ваши личные данные третьим лицам. Доступ к вашим данным имеет только персонал барбершопа в целях оказания услуг.
        </p>
      </>
    ) : locale === "en" ? (
      <>
        <p>
          We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information.
        </p>
        <h3 className="text-xl text-foreground font-bold mt-6 mb-3">Information Collection</h3>
        <p>
          When you book an appointment, we collect the following data:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Your name — so we know how to address you.</li>
          <li>Phone number — to contact you and send SMS notifications (verification codes and appointment reminders).</li>
        </ul>
        <h3 className="text-xl text-foreground font-bold mt-6 mb-3">Use of Information</h3>
        <p>
          We use the information you provide exclusively for the following purposes:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Creating and managing your appointments.</li>
          <li>Sending service SMS messages to confirm your booking.</li>
          <li>Improving service quality and communication.</li>
        </ul>
        <h3 className="text-xl text-foreground font-bold mt-6 mb-3">Data Protection</h3>
        <p>
          We do not share, sell, or disclose your personal data to third parties. Access to your data is restricted strictly to the barbershop staff for the purpose of providing services.
        </p>
      </>
    ) : (
      <>
        <p>
          Մենք հարգում ենք ձեր գաղտնիությունը և պարտավորվում ենք պաշտպանել ձեր անձնական տվյալները: Այս Գաղտնիության քաղաքականությունը բացատրում է, թե ինչպես ենք մենք հավաքում, օգտագործում և պաշտպանում ձեր տեղեկությունները:
        </p>
        <h3 className="text-xl text-foreground font-bold mt-6 mb-3">Տեղեկատվության հավաքագրում</h3>
        <p>
          Ծառայությունների համար գրանցվելիս մենք հավաքում ենք հետևյալ տվյալները՝
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Ձեր անունը — իմանալու համար, թե ինչպես դիմել ձեզ:</li>
          <li>Հեռախոսահամարը — ձեզ հետ կապվելու և SMS ծանուցումներ ուղարկելու համար (հաստատման կոդեր և հիշեցումներ):</li>
        </ul>
        <h3 className="text-xl text-foreground font-bold mt-6 mb-3">Տեղեկատվության օգտագործում</h3>
        <p>
          Մենք օգտագործում ենք ձեր տրամադրած տեղեկությունները բացառապես հետևյալ նպատակներով՝
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Ձեր ամրագրման ստեղծում և կառավարում:</li>
          <li>SMS հաղորդագրությունների ուղարկում՝ գրանցումը հաստատելու համար:</li>
          <li>Սպասարկման որակի և կապի բարելավում:</li>
        </ul>
        <h3 className="text-xl text-foreground font-bold mt-6 mb-3">Տվյալների պաշտպանություն</h3>
        <p>
          Մենք չենք փոխանցում, չենք վաճառում և չենք տրամադրում ձեր անձնական տվյալները երրորդ կողմի: Ձեր տվյալներին հասանելիություն ունեն միայն վարսավիրանոցի աշխատակիցները՝ ծառայություններ մատուցելու նպատակով:
        </p>
      </>
    );

  return (
    <div className="py-16 sm:py-24 bg-background min-h-screen relative overflow-hidden">
      <div className="absolute top-20 left-10 w-[600px] h-[400px] bg-accent/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181b26]/80 border border-white/[0.1] backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-mono tracking-[0.25em] text-accent uppercase font-semibold">
              Legal & Privacy
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground uppercase">
            {title}
          </h1>
        </div>

        <div className="rounded-3xl p-6 sm:p-10 bg-[#181b26]/80 border border-white/[0.1] backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] space-y-5 relative overflow-hidden">
          <div className="prose prose-invert max-w-none text-muted-foreground text-sm sm:text-base leading-relaxed font-light">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
