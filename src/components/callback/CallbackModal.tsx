"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

export interface CallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  dict: {
    title: string;
    description: string;
    name: string;
    phone: string;
    preferredTime: string;
    message: string;
    submit: string;
    sending: string;
    success: string;
    close: string;
  };
}

export function CallbackModal({ isOpen, onClose, dict }: CallbackModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/callbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, preferredTime, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit callback request");
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setName("");
    setPhone("");
    setPreferredTime("");
    setMessage("");
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={isSuccess ? undefined : dict.title}
      description={isSuccess ? undefined : dict.description}
      maxWidth="md"
    >
      {isSuccess ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent text-accent flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-foreground font-medium">{dict.success}</p>
          <Button onClick={handleReset} variant="primary" className="mt-4">
            {dict.close}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={dict.name}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Արամ Սարգսյան"
          />

          <Input
            label={dict.phone}
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+374 91 000000"
          />

          <Input
            label={dict.preferredTime}
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            placeholder="օրինակ՝ 14:00 - 18:00"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {dict.message}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 text-sm text-foreground placeholder-muted/50 transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Նշեք ձեր նախընտրած ծառայությունը կամ հարցը..."
            />
          </div>

          {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3"
              isLoading={isLoading}
            >
              {isLoading ? dict.sending : dict.submit}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
