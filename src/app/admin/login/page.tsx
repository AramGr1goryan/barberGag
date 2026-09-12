"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { AdminLanguageSwitcher } from "@/components/admin/AdminLanguageSwitcher";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const { t, locale } = useAdminI18n();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t.login.errorMessage);
      }

      if (data.user?.role !== "ADMIN") {
        throw new Error(t.login.errorMessage);
      }

      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.login.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#14161f] px-4 relative overflow-hidden">
      {/* Soft Ambient Glows */}
      <div className="fixed top-1/4 -left-32 w-96 h-96 bg-accent/[0.05] rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      <div className="absolute top-6 right-6 z-10">
        <AdminLanguageSwitcher />
      </div>

      <div className="w-full max-w-md bg-[#1d202c]/85 backdrop-blur-2xl border border-white/[0.1] p-8 sm:p-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative space-y-8 z-10">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mx-auto shadow-[0_0_20px_rgba(197,168,128,0.2)]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              {t.login.portalTitle}
            </h1>
            <p className="text-xs font-mono text-muted mt-1">
              {t.login.subheading}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t.login.emailOrPhone}
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="admin@barbershop.am"
            className="rounded-2xl bg-black/40 border-white/10"
          />

          <Input
            label={t.login.password}
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="rounded-2xl bg-black/40 border-white/10"
          />

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl text-xs text-red-300 backdrop-blur-md font-mono">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5 text-xs mt-3 font-mono tracking-widest uppercase rounded-full shadow-[0_4px_25px_rgba(197,168,128,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            isLoading={isLoading}
          >
            {t.login.signInButton}
          </Button>
        </form>

        <div className="text-center pt-2 flex flex-col items-center space-y-3">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center space-x-1.5 text-xs font-mono text-muted hover:text-accent px-3 py-1.5 rounded-full hover:bg-white/[0.04] transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.login.backToWebsite}</span>
          </Link>
          <span className="text-[10px] font-mono text-muted/60 uppercase tracking-widest">
            Protected Server Boundary • TLS 1.3
          </span>
        </div>
      </div>
    </div>
  );
}

