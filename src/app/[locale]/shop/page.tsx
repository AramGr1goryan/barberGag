import React from "react";
import { ShopComingSoon } from "@/components/home/ShopComingSoon";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <ShopComingSoon locale={locale} />;
}
