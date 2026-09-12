import { describe, it, expect, vi, beforeEach } from "vitest";
import { FontService, DEFAULT_FONT_SETTINGS } from "../src/services/font.service";
import { prisma } from "../src/lib/prisma";

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    siteContent: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("Multi-Language Font Service", () => {
  let service: FontService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FontService();
  });

  it("should return default font configuration when no database record exists", async () => {
    vi.mocked(prisma.siteContent.findUnique).mockResolvedValueOnce(null);

    const result = await service.getFontSettings();
    expect(result).toEqual(DEFAULT_FONT_SETTINGS);
    expect(result.fontHy).toBe("Noto Sans Armenian");
    expect(result.fontRu).toBe("Montserrat");
    expect(result.fontEn).toBe("Cinzel");
  });

  it("should parse stored JSON font configuration correctly", async () => {
    const mockData = {
      fontHy: "Noto Sans Armenian",
      fontRu: "Playfair Display",
      fontEn: "Syne",
      customFontName: "Great Vibes",
      customFontUrl: "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap",
    };

    vi.mocked(prisma.siteContent.findUnique).mockResolvedValueOnce({
      id: "test",
      key: "site_fonts",
      section: "appearance",
      valueHy: JSON.stringify(mockData),
      valueRu: JSON.stringify(mockData),
      valueEn: JSON.stringify(mockData),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await service.getFontSettings();
    expect(result.fontHy).toBe("Noto Sans Armenian");
    expect(result.fontRu).toBe("Playfair Display");
    expect(result.fontEn).toBe("Syne");
    expect(result.customFontName).toBe("Great Vibes");
    expect(result.customFontUrl).toContain("Great+Vibes");
  });

  it("should update font settings and persist to database", async () => {
    vi.mocked(prisma.siteContent.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.siteContent.upsert).mockResolvedValueOnce({} as any);

    const updated = await service.updateFontSettings({
      fontHy: "Noto Sans Armenian",
      fontRu: "Cormorant Garamond",
      fontEn: "Outfit",
    });

    expect(updated.fontRu).toBe("Cormorant Garamond");
    expect(updated.fontEn).toBe("Outfit");
    expect(prisma.siteContent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "site_fonts" },
      })
    );
  });
});
