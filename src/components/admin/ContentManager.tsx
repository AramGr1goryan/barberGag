"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, FileText } from "lucide-react";

export interface ContentItem {
  id: string;
  key: string;
  section: string;
  valueHy: string;
  valueRu: string;
  valueEn: string;
}

export function ContentManager() {
  const { t } = useAdminI18n();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string>("");
  const [notification, setNotification] = useState("");

  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/content");
      const data = await res.json();
      if (data.contents) setContents(data.contents);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleUpdate = async (item: ContentItem) => {
    setSavingKey(item.key);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: item.key,
          section: item.section,
          valueHy: item.valueHy,
          valueRu: item.valueRu,
          valueEn: item.valueEn,
        }),
      });

      if (res.ok) {
        setNotification(`${t.content.contentSavedSuccess} (${item.key})`);
        setTimeout(() => setNotification(""), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSavingKey("");
    }
  };

  const handleValueChange = (key: string, lang: "valueHy" | "valueRu" | "valueEn", value: string) => {
    setContents((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [lang]: value } : item))
    );
  };

  return (
    <div className="space-y-10 max-w-5xl">
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#c5a880]" />
          <span className="text-[11px] font-mono tracking-widest text-accent uppercase font-semibold">
            {t.dashboard.executiveOverview}
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-tight">
          {t.content.title}
        </h1>
        <p className="text-xs text-muted font-mono mt-1">
          {t.content.subtitle}
        </p>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs font-mono text-emerald-300 flex items-center space-x-2.5 shadow-[0_4px_20px_rgba(16,185,129,0.12)] backdrop-blur-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-xs font-mono text-muted flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>{t.common.loading}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {contents.map((item) => (
            <div
              key={item.key}
              className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] hover:border-white/[0.16] transition-all"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider">
                    {item.key}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-muted uppercase bg-white/[0.04] border border-white/[0.06]">
                    {item.section}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  isLoading={savingKey === item.key}
                  onClick={() => handleUpdate(item)}
                  className="rounded-full shadow-[0_4px_15px_rgba(197,168,128,0.2)]"
                >
                  {t.common.save}
                </Button>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-[11px] font-mono text-muted mb-1.5 uppercase tracking-wide">
                    {t.services.nameHy}
                  </label>
                  <textarea
                    rows={2}
                    value={item.valueHy}
                    onChange={(e) => handleValueChange(item.key, "valueHy", e.target.value)}
                    className="w-full bg-[#141620]/70 border border-white/10 rounded-2xl p-3.5 text-xs text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-sans leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-muted mb-1.5 uppercase tracking-wide">
                    {t.services.nameRu}
                  </label>
                  <textarea
                    rows={2}
                    value={item.valueRu}
                    onChange={(e) => handleValueChange(item.key, "valueRu", e.target.value)}
                    className="w-full bg-[#141620]/70 border border-white/10 rounded-2xl p-3.5 text-xs text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-sans leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-muted mb-1.5 uppercase tracking-wide">
                    {t.services.nameEn}
                  </label>
                  <textarea
                    rows={2}
                    value={item.valueEn}
                    onChange={(e) => handleValueChange(item.key, "valueEn", e.target.value)}
                    className="w-full bg-[#141620]/70 border border-white/10 rounded-2xl p-3.5 text-xs text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-sans leading-relaxed"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

