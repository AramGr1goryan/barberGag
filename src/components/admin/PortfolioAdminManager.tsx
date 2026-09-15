"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { MediaGridSkeleton } from "@/components/ui/Skeleton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export interface AdminPortfolioItem {
  id: string;
  url: string;
  titleHy: string;
  titleRu: string;
  titleEn: string;
  category: string;
  active: boolean;
}

export function PortfolioAdminManager() {
  const { t, locale } = useAdminI18n();
  const [items, setItems] = useState<AdminPortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [imageUrl, setImageUrl] = useState("");
  const [titleHy, setTitleHy] = useState("");
  const [titleRu, setTitleRu] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [category, setCategory] = useState("classic");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState("");

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/portfolio");
      const data = await res.json();
      if (data.items) setItems(data.items);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
      }
    } catch {
      // ignore
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          titleHy,
          titleRu,
          titleEn,
          category,
        }),
      });

      if (res.ok) {
        setNotification(t.common.success);
        setTimeout(() => setNotification(""), 3500);
        setIsModalOpen(false);
        setImageUrl("");
        setTitleHy("");
        setTitleRu("");
        setTitleEn("");
        fetchItems();
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.portfolio.confirmDeleteImage)) return;

    try {
      const res = await fetch(`/api/admin/portfolio?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotification(t.common.success);
        setTimeout(() => setNotification(""), 3500);
        fetchItems();
      }
    } catch {
      // ignore
    }
  };

  const getTitle = (item: AdminPortfolioItem) => {
    if (locale === "ru") return item.titleRu || item.titleHy;
    if (locale === "en") return item.titleEn || item.titleHy;
    return item.titleHy;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#c5a880]" />
            <span className="text-[11px] font-mono tracking-widest text-accent uppercase font-semibold">
              {t.dashboard.executiveOverview}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-tight">
            {t.portfolio.title}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(197,168,128,0.25)] border border-accent/40"
        >
          <Plus className="w-4 h-4" />
          <span>{t.portfolio.uploadNew}</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs font-mono text-emerald-300 flex items-center space-x-2.5 shadow-[0_4px_20px_rgba(16,185,129,0.12)] backdrop-blur-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <MediaGridSkeleton count={6} />
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-[#1d202c]/65 backdrop-blur-xl border border-white/[0.09] p-12 text-center space-y-3 shadow-xl">
          <ImageIcon className="w-12 h-12 text-muted/30 mx-auto" />
          <p className="text-sm font-display font-semibold text-foreground">
            {locale === "ru" ? "Галерея пуста" : locale === "hy" ? "Պատկերասրահը դատարկ է" : "Gallery is empty"}
          </p>
          <p className="text-xs text-muted font-mono max-w-sm mx-auto">
            {locale === "ru" ? "Загрузите первые работы барбера" : locale === "hy" ? "Ավելացրեք առաջին աշխատանքները" : "Upload the first haircut photos"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl overflow-hidden flex flex-col justify-between group hover:border-accent/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25),0_0_25px_rgba(197,168,128,0.15)] transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Image Frame with Liquid Zoom */}
              <div className="m-3 relative aspect-[4/5] rounded-2xl overflow-hidden bg-black/40 border border-white/[0.05]">
                <Image
                  src={item.url}
                  alt={item.titleEn || "Portfolio"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-accent border border-accent/30">
                  {item.category}
                </span>
              </div>

              <div className="p-4 pt-1 space-y-2">
                <h4 className="font-display font-bold text-sm text-foreground truncate group-hover:text-accent transition-colors">
                  {getTitle(item)}
                </h4>
                <p className="text-[11px] text-muted font-mono truncate">{item.titleHy} • {item.titleEn}</p>

                <div className="pt-2 flex justify-end border-t border-white/[0.05]">
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 flex items-center justify-center text-red-400 hover:text-red-300 transition-all hover:scale-105"
                    title={t.common.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t.portfolio.uploadNew}
        description={t.portfolio.subtitle}
      >
        <form onSubmit={handleCreate} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-mono text-muted uppercase mb-2">
              {t.portfolio.imageUrl}
            </label>
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] p-4 transition-all text-center">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border file:border-white/10 file:text-xs file:font-mono file:bg-white/[0.06] file:text-foreground hover:file:bg-accent/20 hover:file:border-accent/40 file:transition-all cursor-pointer"
              />
            </div>
            {isUploading && (
              <div className="mt-4 flex justify-center">
                <LoadingSpinner size="sm" label={t.common.loading} />
              </div>
            )}
            {imageUrl && (
              <p className="text-xs text-emerald-400 mt-2 font-mono truncate">
                ✓ {t.common.saved}: {imageUrl}
              </p>
            )}
          </div>

          <Input
            label={t.services.nameHy}
            required
            value={titleHy}
            onChange={(e) => setTitleHy(e.target.value)}
            placeholder="օրինակ՝ Կլասիկ Փոմպադուր"
            className="rounded-2xl"
          />

          <Input
            label={t.services.nameRu}
            required
            value={titleRu}
            onChange={(e) => setTitleRu(e.target.value)}
            placeholder="Классический Помпадур"
            className="rounded-2xl"
          />

          <Input
            label={t.services.nameEn}
            required
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Classic Pompadour"
            className="rounded-2xl"
          />

          <div>
            <label className="block text-xs font-mono text-muted uppercase mb-1.5">
              {t.portfolio.category}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#16161a] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent transition-all"
            >
              <option value="classic">{t.portfolio.categories.classic}</option>
              <option value="fade">{t.portfolio.categories.fade}</option>
              <option value="beard">{t.portfolio.categories.beard}</option>
              <option value="styling">{t.portfolio.categories.styling}</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} className="rounded-full">
              {t.common.cancel}
            </Button>
            <Button variant="primary" type="submit" disabled={!imageUrl} isLoading={isSaving} className="rounded-full shadow-[0_4px_20px_rgba(197,168,128,0.2)]">
              {t.common.save}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
