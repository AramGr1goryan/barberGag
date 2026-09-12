"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Scissors } from "lucide-react";

export default function SignupPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "hy";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email: email || undefined, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      router.push(`/${locale}/profile`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-md bg-surface border border-border p-8 sm:p-10 shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border border-accent bg-accent/10 flex items-center justify-center text-accent mx-auto">
            <Scissors className="w-5 h-5 transform -rotate-45" />
          </div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            {t("auth.signupTitle")}
          </h1>
          <p className="text-xs text-muted">
            Ստեղծեք Ձեր անձնական հաշիվը արագ ամրագրումների համար
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t("auth.name")}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Արամ Սարգսյան"
          />

          <Input
            label={t("auth.phone")}
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+374 91 000000"
          />

          <Input
            label="Էլ. հասցե (Email - ոչ պարտադիր)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@example.com"
          />

          <Input
            label={t("auth.password")}
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && (
            <div className="p-3 bg-red-950/30 border border-red-900/60 text-xs text-red-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 text-sm mt-2"
            isLoading={isLoading}
          >
            {t("auth.signupBtn")}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-border/60">
          <span className="text-xs text-muted">{t("auth.hasAccount")} </span>
          <Link
            href={`/${locale}/login`}
            className="text-xs text-accent font-semibold hover:underline"
          >
            {t("auth.loginBtn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
