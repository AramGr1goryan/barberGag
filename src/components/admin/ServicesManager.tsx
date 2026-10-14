"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/timezone";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Plus, Trash2, Scissors, Sparkles, CheckCircle2, Pencil } from "lucide-react";

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
  const toast = useToast();
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
  const [duration, setDuration] = useState<string>("45");
  const [price, setPrice] = useState<string>("7000");
  const [sortOrder, setSortOrder] = useState<string>("0");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (res.ok) {
        if (data.services) setServices(data.services);
        if (data.addons) setAddons(data.addons);
      } else {
        toast.error(data.error || "Не удалось загрузить услуги");
      }
    } catch {
      toast.error(locale === "ru" ? "Ошибка сети при загрузке" : "Network error loading services");
    } finally {
      setIsLoading(false);
    }
  }, [toast, locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = (type: "service" | "addon") => {
    setItemType(type);
    setEditingId(null);
    setNameHy(""); setNameRu(""); setNameEn("");
    setDescHy(""); setDescRu(""); setDescEn("");
    setDuration("45"); setPrice("");
    const maxSort = (type === "service" ? services : addons).reduce(
      (max, item) => Math.max(max, item.sortOrder || 0),
      0
    );
    setSortOrder(String(maxSort + 1));
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleEdit = (type: "service" | "addon", item: ServiceItem | AddonItem) => {
    setItemType(type);
    setEditingId(item.id);
    setNameHy(item.nameHy || "");
    setNameRu(item.nameRu || "");
    setNameEn(item.nameEn || "");
    if ("descriptionHy" in item) {
      setDescHy(item.descriptionHy || "");
      setDescRu(item.descriptionRu || "");
      setDescEn(item.descriptionEn || "");
    } else {
      setDescHy(""); setDescRu(""); setDescEn("");
    }
    setDuration(String(item.durationMinutes ?? 45));
    setPrice(String(item.priceMinorUnits ?? 0));
    setSortOrder(String(item.sortOrder ?? 0));
    setIsActive(item.active !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        nameHy: nameHy.trim(),
        nameRu: nameRu.trim(),
        nameEn: nameEn.trim(),
        descriptionHy: descHy.trim(),
        descriptionRu: descRu.trim(),
        descriptionEn: descEn.trim(),
        durationMinutes: Math.max(0, Number(duration) || 0),
        priceMinorUnits: Math.max(0, Number(price) || 0),
        sortOrder: Number(sortOrder) || 0,
        active: isActive,
        category: "HAIRCUT",
      };

      let res: Response;
      if (editingId) {
        res = await fetch("/api/admin/services", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: itemType, id: editingId, data: payload }),
        });
      } else {
        res = await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: itemType, data: payload }),
        });
      }

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = resData.error || resData.message || "Failed to save item";
        toast.error(errorMsg);
        return;
      }

      toast.success(editingId ? (locale === "ru" ? "Услуга обновлена" : "Service updated") : (locale === "ru" ? "Услуга добавлена" : "Service created"));
      setNotification(t.common.success);
      setTimeout(() => setNotification(""), 3500);
      setIsModalOpen(false);
      setEditingId(null);
      setNameHy(""); setNameRu(""); setNameEn("");
      setDescHy(""); setDescRu(""); setDescEn("");
      fetchData();
    } catch {
      toast.error(locale === "ru" ? "Ошибка сети при сохранении" : "Network error saving item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (type: "service" | "addon", id: string) => {
    if (!window.confirm(t.services.confirmDeleteService)) return;
    try {
      const res = await fetch(`/api/admin/services?id=${id}&type=${type}`, { method: "DELETE" });
      const resData = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(t.common.success);
        setNotification(t.common.success);
        setTimeout(() => setNotification(""), 3500);
        fetchData();
      } else {
        toast.error(resData.error || "Failed to delete item");
      }
    } catch {
      toast.error(locale === "ru" ? "Ошибка сети при удалении" : "Network error deleting item");
    }
  };

  const getName = (item: { nameHy: string; nameRu: string; nameEn: string }) => {
    if (locale === "ru") return item.nameRu || item.nameHy;
    if (locale === "en") return item.nameEn || item.nameHy;
    return item.nameHy;
  };

  const modalTitle = editingId
    ? (itemType === "service" ? t.services.editService : t.services.editAddon)
    : (itemType === "service" ? t.services.addNewService : t.services.addNewAddon);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-blue-200 uppercase font-semibold">
            {t.dashboard.executiveOverview}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1 uppercase">
            {t.services.title}
          </h1>
        </div>

        <div className="flex space-x-3">
          <Button
            size="sm"
            variant="ghost"
            className="gap-2 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all font-medium"
            onClick={() => openCreateModal("service")}
          >
            <Plus className="w-3.5 h-3.5 text-blue-200" />
            <span className="text-white/80">{t.services.addNewService}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="gap-2 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/5 hover:border-white/10 transition-all font-medium"
            onClick={() => openCreateModal("addon")}
          >
            <Plus className="w-3.5 h-3.5 text-blue-200" />
            <span className="text-white/80">{t.services.addNewAddon}</span>
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
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-200">
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
                <th className="py-3 px-4">Порядок</th>
                <th className="py-3 px-4">Статус</th>
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
                  <td className="py-4 px-4 text-zinc-400">#{s.sortOrder}</td>
                  <td className="py-4 px-4">
                    <Badge variant={s.active ? "green" : "gray"} size="sm">
                      {s.active ? (locale === "ru" ? "Активна" : "Active") : (locale === "ru" ? "Скрыта" : "Hidden")}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-zinc-300">{s.durationMinutes} min</td>
                  <td className="py-4 px-4 text-white font-bold">
                    {formatCurrency(s.priceMinorUnits, locale)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit("service", s)}
                        className="p-2 rounded-xl text-blue-300 hover:text-blue-100 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all"
                        title={t.common.edit || "Edit"}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete("service", s.id)}
                        className="p-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-200">
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
                <th className="py-3 px-4">Порядок</th>
                <th className="py-3 px-4">Статус</th>
                <th className="py-3 px-4">{t.services.durationMinutes}</th>
                <th className="py-3 px-4">{t.services.priceAmd}</th>
                <th className="py-3 px-4 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {addons.map((a) => (
                <tr key={a.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-sans font-bold text-foreground block">{getName(a)}</span>
                    <span className="text-[11px] text-muted">{a.nameHy} • {a.nameEn}</span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400">#{a.sortOrder}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={a.active ? "green" : "gray"} size="sm">
                      {a.active ? (locale === "ru" ? "Активна" : "Active") : (locale === "ru" ? "Скрыта" : "Hidden")}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-muted">{a.durationMinutes} min</td>
                  <td className="py-3.5 px-4 text-white font-bold">
                    {formatCurrency(a.priceMinorUnits, locale)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit("addon", a)}
                        className="p-1.5 rounded-xl text-blue-300 hover:text-blue-100 hover:bg-blue-500/10 transition-colors"
                        title={t.common.edit || "Edit"}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete("addon", a.id)}
                        className="p-1.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-rose-500/10 transition-colors"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        description={t.services.subtitle}
      >
        <form onSubmit={handleSave} className="space-y-4 py-2">
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

          {itemType === "service" && (
            <div className="space-y-4 border-t border-white/10 pt-4 mt-4">
              <h4 className="text-xs font-bold text-blue-200">ОПИСАНИЕ (НЕОБЯЗАТЕЛЬНО)</h4>
              <Input
                label="Описание (HY)"
                value={descHy}
                onChange={(e) => setDescHy(e.target.value)}
                placeholder="Пр: Լավագույն կտրվածքը..."
              />
              <Input
                label="Описание (RU)"
                value={descRu}
                onChange={(e) => setDescRu(e.target.value)}
                placeholder="Пр: Отличная стрижка..."
              />
              <Input
                label="Описание (EN)"
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Ex: Great haircut..."
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.services.durationMinutes}
              type="number"
              required
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />

            <Input
              label={t.services.priceAmd}
              type="number"
              required
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-center pt-2">
            <Input
              label={locale === "ru" ? "Порядок показа" : "Sort Order"}
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="0"
            />

            <div className="flex items-center gap-3 pt-5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-3 text-xs font-medium text-white/80">
                  {t.services.active || "Активно"}
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} className="rounded-2xl hover:bg-white/5 text-white/60">
              {t.common.cancel}
            </Button>
            <Button variant="ghost" type="submit" isLoading={isSaving} className="rounded-2xl bg-white/10 border border-white/5 hover:bg-white/15 hover:border-white/10 text-white font-medium transition-all">
              {t.common.save}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
