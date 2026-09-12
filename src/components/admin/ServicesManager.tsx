"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { formatCurrency } from "@/lib/timezone";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, Scissors, Sparkles, CheckCircle2 } from "lucide-react";

export interface ServiceItem {
  id: string;
  nameHy: string;
  nameRu: string;
  nameEn: string;
  descriptionHy: string;
  descriptionRu: string;
  descriptionEn: string;
  durationMinutes: number;
  priceMinorUnits: number;
  active: boolean;
  sortOrder: number;
}

export interface AddonItem {
  id: string;
  nameHy: string;
  nameRu: string;
  nameEn: string;
  durationMinutes: number;
  priceMinorUnits: number;
  active: boolean;
  sortOrder: number;
}

export function ServicesManager() {
  const { t, locale } = useAdminI18n();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemType, setItemType] = useState<"service" | "addon">("service");

  // Form State
  const [nameHy, setNameHy] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descHy, setDescHy] = useState("");
  const [descRu, setDescRu] = useState("");
  const [descEn, setDescEn] = useState("");
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(7000);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (data.services) setServices(data.services);
      if (data.addons) setAddons(data.addons);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const endpoint = itemType === "service" ? "/api/admin/services" : "/api/admin/addons";
      const payload = {
        nameHy,
        nameRu,
        nameEn,
        descriptionHy: descHy || nameHy,
        descriptionRu: descRu || nameRu,
        descriptionEn: descEn || nameEn,
        durationMinutes: duration,
        priceMinorUnits: price,
        category: "HAIRCUT",
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNotification(t.common.success);
        setTimeout(() => setNotification(""), 3500);
        setIsModalOpen(false);
        setNameHy("");
        setNameRu("");
        setNameEn("");
        fetchData();
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (type: "service" | "addon", id: string) => {
    if (!confirm(t.services.confirmDeleteService)) return;
    try {
      const endpoint = type === "service" ? `/api/admin/services?id=${id}` : `/api/admin/addons?id=${id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        setNotification(t.common.success);
        setTimeout(() => setNotification(""), 3500);
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const getName = (item: { nameHy: string; nameRu: string; nameEn: string }) => {
    if (locale === "ru") return item.nameRu || item.nameHy;
    if (locale === "en") return item.nameEn || item.nameHy;
    return item.nameHy;
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-accent uppercase font-semibold">
            {t.dashboard.executiveOverview}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1 uppercase">
            {t.services.title}
          </h1>
        </div>

        <div className="flex space-x-3">
          <Button
            size="sm"
            variant="primary"
            className="gap-2 rounded-full shadow-[0_4px_25px_rgba(197,168,128,0.25)]"
            onClick={() => {
              setItemType("service");
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.services.addNewService}</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="gap-2 rounded-full border-white/10"
            onClick={() => {
              setItemType("addon");
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
            <span>{t.services.addNewAddon}</span>
          </Button>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs font-mono text-emerald-300 flex items-center space-x-2.5 backdrop-blur-md shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Services Table Card */}
      <div className="bg-[#1d202c]/75 border border-white/[0.09] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_12px_45px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
        <div className="flex items-center space-x-2.5 border-b border-white/[0.06] pb-4">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
            <Scissors className="w-4 h-4" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground uppercase tracking-wide">
            {t.services.servicesTab} ({services.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] text-zinc-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">{t.services.nameHy} / EN</th>
                <th className="py-3 px-4">{t.services.durationMinutes}</th>
                <th className="py-3 px-4">{t.services.priceAmd}</th>
                <th className="py-3 px-4 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.03] transition-colors rounded-2xl">
                  <td className="py-4 px-4">
                    <span className="font-sans font-bold text-foreground block">{getName(s)}</span>
                    <span className="text-[11px] text-zinc-400">{s.nameHy} • {s.nameEn}</span>
                  </td>
                  <td className="py-4 px-4 text-zinc-300">{s.durationMinutes} min</td>
                  <td className="py-4 px-4 text-accent font-bold">
                    {formatCurrency(s.priceMinorUnits, locale)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleDelete("service", s.id)}
                      className="p-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                      title={t.common.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Addons Table Card */}
      <div className="bg-[#1d202c]/75 border border-white/[0.09] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_12px_45px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
        <div className="flex items-center space-x-2.5 border-b border-white/[0.06] pb-4">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground uppercase tracking-wide">
            {t.services.addonsTab} ({addons.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] text-zinc-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">{t.services.nameHy} / EN</th>
                <th className="py-3 px-4">{t.services.durationMinutes}</th>
                <th className="py-3 px-4">{t.services.priceAmd}</th>
                <th className="py-3 px-4 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {addons.map((a) => (
                <tr key={a.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-sans font-bold text-foreground block">{getName(a)}</span>
                    <span className="text-[11px] text-muted">{a.nameHy} • {a.nameEn}</span>
                  </td>
                  <td className="py-3.5 px-4 text-muted">{a.durationMinutes} min</td>
                  <td className="py-3.5 px-4 text-accent font-bold">
                    {formatCurrency(a.priceMinorUnits, locale)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete("addon", a.id)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      title={t.common.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={itemType === "service" ? t.services.addNewService : t.services.addNewAddon}
        description={t.services.subtitle}
      >
        <form onSubmit={handleCreate} className="space-y-4 py-2">
          <Input
            label={t.services.nameHy}
            required
            value={nameHy}
            onChange={(e) => setNameHy(e.target.value)}
            placeholder="օրինակ՝ Դասական կտրվածք"
          />

          <Input
            label={t.services.nameRu}
            required
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            placeholder="Классическая стрижка"
          />

          <Input
            label={t.services.nameEn}
            required
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="Classic Haircut"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.services.durationMinutes}
              type="number"
              required
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />

            <Input
              label={t.services.priceAmd}
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              {t.common.save}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
