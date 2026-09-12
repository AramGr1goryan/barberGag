import { describe, it, expect } from "vitest";

describe("Client Profile Personal Financial Analytics & Auto-Selection Tests", () => {
  it("should calculate client's monthly spending strictly from COMPLETED appointments in current month", () => {
    const currentYearMonth = "2026-09";

    const userBookings = [
      {
        id: "b1",
        date: "2026-09-05",
        status: "COMPLETED",
        totalPriceMinorUnits: 15000,
      },
      {
        id: "b2",
        date: "2026-09-11",
        status: "COMPLETED",
        totalPriceMinorUnits: 10000,
      },
      {
        id: "b3",
        date: "2026-09-12",
        status: "CANCELLED", // Must NOT be counted as realized spending
        totalPriceMinorUnits: 20000,
      },
      {
        id: "b4",
        date: "2026-09-14",
        status: "CONFIRMED", // Upcoming, not completed yet
        totalPriceMinorUnits: 15000,
      },
      {
        id: "b5",
        date: "2026-08-20", // Previous month
        status: "COMPLETED",
        totalPriceMinorUnits: 12000,
      },
    ];

    const completedBookings = userBookings.filter((b) => b.status === "COMPLETED");
    const thisMonthCompleted = completedBookings.filter((b) => b.date.startsWith(currentYearMonth));

    const thisMonthSpent = thisMonthCompleted.reduce((sum, b) => sum + b.totalPriceMinorUnits, 0);
    const totalLifetimeSpent = completedBookings.reduce((sum, b) => sum + b.totalPriceMinorUnits, 0);
    const completedVisits = completedBookings.length;
    const averageTicket = Math.round(totalLifetimeSpent / completedVisits);

    // This month: b1 (15,000) + b2 (10,000) = 25,000 AMD
    expect(thisMonthSpent).toBe(25000);
    expect(thisMonthCompleted.length).toBe(2);

    // Lifetime: b1 (15,000) + b2 (10,000) + b5 (12,000) = 37,000 AMD
    expect(totalLifetimeSpent).toBe(37000);
    expect(completedVisits).toBe(3);

    // Average spend per visit: 37,000 / 3 = 12,333 AMD
    expect(averageTicket).toBe(12333);
  });

  it("should match user preferred haircut by ID or service name for auto-selection", () => {
    const services = [
      { id: "svc-1", nameHy: "Դասական կտրվածք", nameRu: "Классическая стрижка", nameEn: "Classic Haircut" },
      { id: "svc-2", nameHy: "Մորուքի խնամք", nameRu: "Моделирование бороды", nameEn: "Beard Styling" },
      { id: "svc-3", nameHy: "Կոմպլեքս ծառայություն", nameRu: "Стрижка + Борода", nameEn: "Haircut & Beard" },
    ];

    // Case 1: Preferred haircut is service ID
    const preferredId = "svc-3";
    const matchedById = services.find((s) => s.id === preferredId || s.nameRu === preferredId || s.nameHy === preferredId);
    expect(matchedById?.id).toBe("svc-3");

    // Case 2: Preferred haircut is Russian name
    const preferredNameRu = "Классическая стрижка";
    const matchedByName = services.find((s) => s.id === preferredNameRu || s.nameRu === preferredNameRu || s.nameHy === preferredNameRu);
    expect(matchedByName?.id).toBe("svc-1");

    // Case 3: Preferred haircut is Armenian name
    const preferredNameHy = "Մորուքի խնամք";
    const matchedByNameHy = services.find((s) => s.id === preferredNameHy || s.nameRu === preferredNameHy || s.nameHy === preferredNameHy);
    expect(matchedByNameHy?.id).toBe("svc-2");
  });
});
