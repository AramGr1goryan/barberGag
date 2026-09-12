"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Scissors } from "lucide-react";

export default function LoginPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "hy";

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
        throw new Error(data.error || "Login failed");
      }

      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push(`/${locale}/profile`);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error");
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
            {t("auth.loginTitle")}
          </h1>
          <p className="text-xs text-muted">
            Մուտք գործեք Ձեր հաշիվ կամ կառավարեք ամրագրումները
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t("auth.emailOrPhone")}
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="+374 91 000000 կամ email"
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
            {t("auth.loginBtn")}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-border/60">
          <span className="text-xs text-muted">{t("auth.noAccount")} </span>
          <Link
            href={`/${locale}/signup`}
            className="text-xs text-accent font-semibold hover:underline"
          >
            {t("auth.signupBtn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
