import { prisma } from "@/lib/prisma";

export interface FontSettings {
  fontHy: string;
  fontRu: string;
  fontEn: string;
  customFontName?: string;
  customFontUrl?: string;
}

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  fontHy: "Noto Sans Armenian",
  fontRu: "Montserrat",
  fontEn: "Cinzel",
  customFontName: "",
  customFontUrl: "",
};

export class FontService {
  /**
   * Retrieves active site-wide font configuration for all languages.
   */
  async getFontSettings(): Promise<FontSettings> {
    try {
      const record = await prisma.siteContent.findUnique({
        where: { key: "site_fonts" },
      });

      if (!record || !record.valueEn) {
        return DEFAULT_FONT_SETTINGS;
      }

      const parsed = JSON.parse(record.valueEn);
      return {
        fontHy: parsed.fontHy || DEFAULT_FONT_SETTINGS.fontHy,
        fontRu: parsed.fontRu || DEFAULT_FONT_SETTINGS.fontRu,
        fontEn: parsed.fontEn || DEFAULT_FONT_SETTINGS.fontEn,
        customFontName: parsed.customFontName || "",
        customFontUrl: parsed.customFontUrl || "",
      };
    } catch {
      return DEFAULT_FONT_SETTINGS;
    }
  }

  /**
   * Updates font configuration for all languages and custom font settings.
   */
  async updateFontSettings(settings: Partial<FontSettings>): Promise<FontSettings> {
    const current = await this.getFontSettings();
    const updated: FontSettings = {
      ...current,
      ...settings,
    };

    const serialized = JSON.stringify(updated);

    await prisma.siteContent.upsert({
      where: { key: "site_fonts" },
      update: {
        valueHy: serialized,
        valueRu: serialized,
        valueEn: serialized,
        section: "appearance",
      },
      create: {
        key: "site_fonts",
        valueHy: serialized,
        valueRu: serialized,
        valueEn: serialized,
        section: "appearance",
      },
    });

    return updated;
  }
}

export const fontService = new FontService();
