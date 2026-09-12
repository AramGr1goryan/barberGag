"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, Bell, X, Mail, Phone, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ShopComingSoonProps {
  locale: string;
}

function FloatingOrb({ delay, size, x, y }: { delay: number; size: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: `radial-gradient(circle at 30% 30%, rgba(197,168,128,0.15), rgba(197,168,128,0.03) 60%, transparent 80%)`,
        filter: "blur(1px)",
      }}
      animate={{
        y: [0, -20, 0, 14, 0],
        x: [0, 10, -6, 4, 0],
        scale: [1, 1.06, 0.97, 1.03, 1],
        opacity: [0.2, 0.4, 0.28, 0.38, 0.2],
      }}
      transition={{
        duration: 7 + delay * 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

function getTexts(locale: string) {
  if (locale === "ru") {
    return {
      title: "Скоро",
      subtitle: "Премиум-товары для мужского ухода",
      notify: "Уведомить меня",
      back: "На главную",
      modalTitle: "Получить уведомление",
      modalDesc: "Оставьте контакты — мы сообщим об открытии",
      emailPlaceholder: "Email",
      phonePlaceholder: "Телефон (+374...)",
      submit: "Подписаться",
      submitting: "Отправка...",
      success: "Готово! Мы уведомим вас об открытии магазина.",
      close: "Закрыть",
    };
  }
  if (locale === "hy") {
    return {
      title: "\u0547\u0578\u0582\u057f\u0578\u057e",
      subtitle: "\u054a\u0580\u0565\u0574\u056b\u0578\u0582\u0574 \u057f\u0572\u0561\u0574\u0561\u0580\u0564\u056f\u0561\u0576\u0581 \u056d\u0576\u0561\u0574\u0564\u056b \u0561\u057a\u0580\u0561\u0576\u0584\u0576\u0565\u0580",
      notify: "\u054f\u0565\u0572\u0565\u056f\u0561\u0581\u0576\u0565\u056c \u056b\u0576\u0571",
      back: "\u0533\u056c\u056d\u0561\u057e\u0578\u0580",
      modalTitle: "\u054d\u057f\u0561\u056c \u056e\u0561\u0576\u0578\u0582\u0581\u0578\u0582\u0574",
      modalDesc: "\u0539\u0578\u0572\u0565\u0584 \u0571\u0565\u0580 \u056f\u0578\u0576\u057f\u0561\u056f\u057f\u0576\u0565\u0580\u0568",
      emailPlaceholder: "\u0537\u056c. \u0583\u0578\u057d\u057f",
      phonePlaceholder: "\u0540\u0565\u057c\u0561\u056d\u0578\u057d (+374...)",
      submit: "\u0532\u0561\u056a\u0561\u0576\u0578\u0580\u0564\u0561\u0563\u0580\u057e\u0565\u056c",
      submitting: "\u0548\u0582\u0572\u0561\u0580\u056f\u057e\u0578\u0582\u0574...",
      success: "\u054a\u0561\u057f\u0580\u0561\u057d\u057f! \u0544\u0565\u0576\u0584 \u056f\u057f\u0565\u0572\u0565\u056f\u0561\u0581\u0576\u0565\u0576\u0584 \u0571\u0565\u0566:",
      close: "\u0553\u0561\u056f\u0565\u056c",
    };
  }
  return {
    title: "Soon",
    subtitle: "Premium grooming products",
    notify: "Notify Me",
    back: "Back Home",
    modalTitle: "Get Notified",
    modalDesc: "Leave your contacts — we'll let you know when we launch",
    emailPlaceholder: "Email address",
    phonePlaceholder: "Phone (+374...)",
    submit: "Subscribe",
    submitting: "Sending...",
    success: "Done! We'll notify you when the shop opens.",
    close: "Close",
  };
}

export function ShopComingSoon({ locale }: ShopComingSoonProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showNotify, setShowNotify] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  // No scroll on this page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const t = getTexts(locale);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) return;
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <section className="relative h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-background" />

      {/* Mouse-reactive radial glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{
          background: "radial-gradient(circle, rgba(197,168,128,0.06) 0%, transparent 70%)",
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${mousePos.x}px), calc(-50% + ${mousePos.y}px))`,
        }}
      />

      {/* Floating orbs — subtle */}
      <FloatingOrb delay={0} size={90} x="8%" y="20%" />
      <FloatingOrb delay={2} size={60} x="80%" y="25%" />
      <FloatingOrb delay={3.5} size={70} x="85%" y="70%" />
      <FloatingOrb delay={1} size={50} x="6%" y="75%" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
        {/* Glass icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="liquid-glass-card w-20 h-20 rounded-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, -4, 4, -2, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ShoppingBag className="w-8 h-8 text-accent" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight uppercase mb-3"
        >
          <span className="bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent">
            {t.title}
          </span>
        </motion.h1>

        {/* Accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-accent to-transparent mb-5"
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="text-sm sm:text-base text-muted-foreground font-light tracking-wide mb-10 max-w-md"
        >
          {t.subtitle}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3"
        >
          <Button
            size="md"
            variant="primary"
            className="gap-2"
            onClick={() => setShowNotify(true)}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{t.notify}</span>
          </Button>

          <Link href={`/${locale}`}>
            <Button size="md" variant="secondary" className="gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.back}</span>
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* ── Notify Modal ── */}
      <AnimatePresence>
        {showNotify && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => { if (!isSubmitting) setShowNotify(false); }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div className="liquid-glass-card w-full max-w-sm p-8 relative">
                {/* Close button */}
                <button
                  onClick={() => { if (!isSubmitting) setShowNotify(false); }}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-foreground hover:bg-white/[0.05] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {submitted ? (
                  /* Success state */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center space-y-4 py-4"
                  >
                    <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                      <Check className="w-7 h-7 text-accent" />
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed max-w-[260px]">
                      {t.success}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => { setShowNotify(false); setSubmitted(false); setEmail(""); setPhone(""); }}
                    >
                      {t.close}
                    </Button>
                  </motion.div>
                ) : (
                  /* Form */
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="text-center space-y-2 mb-2">
                      <h3 className="font-display text-lg font-bold text-foreground uppercase tracking-wide">
                        {t.modalTitle}
                      </h3>
                      <p className="text-xs text-muted-foreground font-light">
                        {t.modalDesc}
                      </p>
                    </div>

                    {/* Email field */}
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="w-full pl-10 pr-4 py-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/40 focus:shadow-[0_0_20px_rgba(197,168,128,0.1)] transition-all duration-200 backdrop-blur-sm"
                      />
                    </div>

                    {/* Phone field */}
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.phonePlaceholder}
                        className="w-full pl-10 pr-4 py-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/40 focus:shadow-[0_0_20px_rgba(197,168,128,0.1)] transition-all duration-200 backdrop-blur-sm"
                      />
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      size="md"
                      variant="primary"
                      className="w-full gap-2"
                      isLoading={isSubmitting}
                      disabled={!email && !phone}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? t.submitting : t.submit}</span>
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
