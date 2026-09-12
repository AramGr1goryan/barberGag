import { PrismaClient, Role, SlotStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with luxury barbershop initial state...");

  // 1. Admin User
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { phone: "+37491000001" },
    update: { name: "Գագիկ Ղամբարյան" },
    create: {
      email: "admin@barbershop.am",
      phone: "+37491000001",
      name: "Գագիկ Ղամբարյան",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      profile: {
        create: {
          photoUrl: "/images/gagik-barber.jpg",
          preferredHaircut: "Signature Classic & Scissor Fade",
          preferences: "Master Barber & Founder",
        },
      },
    },
  });
  console.log("Admin created:", admin.email);

  // 2. Demo Customer User
  const clientPasswordHash = await bcrypt.hash("Client123!", 10);
  const client = await prisma.user.upsert({
    where: { phone: "+37491000002" },
    update: {},
    create: {
      email: "client@barbershop.am",
      phone: "+37491000002",
      name: "Արամ Սարգսյան",
      passwordHash: clientPasswordHash,
      role: Role.USER,
      profile: {
        create: {
          preferredHaircut: "Low Taper Fade",
          hairColor: "Dark Brown",
          preferences: "Sensitive scalp, prefers scissor trim on top",
        },
      },
    },
  });
  console.log("Customer created:", client.phone);

  // 3. Services (Prices stored as AMD integers: 7000 = 7,000 AMD)
  const services = [
    {
      nameHy: "Դասական Կտրվածք",
      nameRu: "Классическая Стрижка",
      nameEn: "Classic Master Haircut",
      descriptionHy: "Ավանդական դասական կտրվածք մկրատով և մեքենայով, գլխի լվացում և պրեմիում ոճավորում:",
      descriptionRu: "Традиционная классическая стрижка ножницами и машинкой, мытье головы и премиальная укладка.",
      descriptionEn: "Bespoke scissor and clipper haircut, invigorating wash, and artisan finishing.",
      durationMinutes: 45,
      priceMinorUnits: 7000,
      sortOrder: 1,
    },
    {
      nameHy: "Պրեմիում Ֆեյդ (Skin Fade)",
      nameRu: "Премиальный Фейд (Skin Fade)",
      nameEn: "Precision Skin Fade",
      descriptionHy: "Կատարյալ սահուն անցումներ (Fade), եզրագծերի ճշգրիտ ընդգծում և ոճավորում:",
      descriptionRu: "Идеально плавный переход, четкая окантовка и премиальный стайлинг.",
      descriptionEn: "Flawless gradient skin taper with razor contouring and matte pomade styling.",
      durationMinutes: 50,
      priceMinorUnits: 8000,
      sortOrder: 2,
    },
    {
      nameHy: "Մորուքի Ձևավորում և Տաք Սրբիչ",
      nameRu: "Моделирование Бороды с Горячим Полотенцем",
      nameEn: "Royal Beard Sculpting & Hot Towel",
      descriptionHy: "Մորուքի ձևավորում, տաք գոլորշիով սրբիչ, սափրում ածելիով և սնուցող յուղեր:",
      descriptionRu: "Моделирование бороды, горячее распаривающее полотенце, опасная бритва и уходовые масла.",
      descriptionEn: "Sculpting, aromatic hot towel treatment, straight razor lining, and conditioning elixir.",
      durationMinutes: 35,
      priceMinorUnits: 5000,
      sortOrder: 3,
    },
    {
      nameHy: "Համալիր՝ Կտրվածք + Մորուք",
      nameRu: "Комплекс: Стрижка + Борода",
      nameEn: "Signature Hair + Beard Package",
      descriptionHy: "Ամբողջական պրեմիում փաթեթ՝ մազերի կտրվածք, մորուքի խնամք, տաք սրբիչ և ոճավորում:",
      descriptionRu: "Полный премиум-комплекс: стрижка, уход за бородой, горячее полотенце и стайлинг.",
      descriptionEn: "The ultimate gentlemen's treatment: bespoke haircut, tailored beard shaping, and head spa.",
      durationMinutes: 75,
      priceMinorUnits: 11000,
      sortOrder: 4,
    },
    {
      nameHy: "Հայր և Որդի Փաթեթ",
      nameRu: "Пакет «Отец и Сын»",
      nameEn: "Father & Son Combo",
      descriptionHy: "Միասնական այցելություն հոր և որդու համար՝ բարձրակարգ սպասարկում և հարմարավետ մթնոլորտ:",
      descriptionRu: "Совместный визит для отца и сына в атмосфере настоящего мужского клуба.",
      descriptionEn: "Shared gentlemen's bonding experience with master haircuts for father and son.",
      durationMinutes: 90,
      priceMinorUnits: 13000,
      sortOrder: 5,
    },
    {
      nameHy: "Մազերի Կամուֆլյաժ (Grey Blending)",
      nameRu: "Камуфляж Седины",
      nameEn: "Grey Blending & Camouflage",
      descriptionHy: "Սպիտակ մազերի բնական քողարկում հատուկ տղամարդկանց պիգմենտներով՝ 15 րոպեում:",
      descriptionRu: "Естественная маскировка седины специальными мужскими тонерами без эффекта окрашивания.",
      descriptionEn: "Subtle, natural gray reduction formula applied discreetly at the wash station.",
      durationMinutes: 30,
      priceMinorUnits: 6000,
      sortOrder: 6,
    },
  ];

  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { nameEn: s.nameEn } });
    if (!existing) {
      await prisma.service.create({ data: s });
    }
  }
  console.log("Services seeded successfully.");

  // 4. Addons
  const addons = [
    {
      nameHy: "Գլխամաշկի Թերապևտիկ Մերսում և Լվացում",
      nameRu: "Массаж Головы и Мытье",
      nameEn: "Scalp Massage & Treatment Wash",
      durationMinutes: 15,
      priceMinorUnits: 2000,
      sortOrder: 1,
    },
    {
      nameHy: "Սև Դիմակ Դետոքս (Black Mask)",
      nameRu: "Черная Маска Детокс",
      nameEn: "Black Mask Detox Facial",
      durationMinutes: 20,
      priceMinorUnits: 3000,
      sortOrder: 2,
    },
    {
      nameHy: "Մոմային Դեպիլյացիա (Քիթ և Ականջներ)",
      nameRu: "Восковая Депиляция (Нос и Уши)",
      nameEn: "Wax Detailing (Ears & Nose)",
      durationMinutes: 10,
      priceMinorUnits: 1500,
      sortOrder: 3,
    },
    {
      nameHy: "Կերատինային Վերականգնող Տոնիկ",
      nameRu: "Кератиновый Восстанавливающий Тоник",
      nameEn: "Keratin Revitalizing Tonic",
      durationMinutes: 15,
      priceMinorUnits: 2500,
      sortOrder: 4,
    },
  ];

  for (const a of addons) {
    const existing = await prisma.addon.findFirst({ where: { nameEn: a.nameEn } });
    if (!existing) {
      await prisma.addon.create({ data: a });
    }
  }
  console.log("Addons seeded successfully.");

  // 5. Portfolio Images
  const portfolioItems = [
    {
      url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80",
      titleHy: "Կլասիկ Փոմպադուր և Կոկիկ Ֆեյդ",
      titleRu: "Классический Помпадур и Фейд",
      titleEn: "Classic Pompadour with Mid Fade",
      altHy: "Տղամարդու դասական կտրվածք",
      altRu: "Мужская стрижка помпадур",
      altEn: "Classic pompadour hairstyle",
      category: "classic",
      sortOrder: 1,
      isFeatured: true,
    },
    {
      url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
      titleHy: "Ճշգրիտ Տեքստուրային Կրոպ",
      titleRu: "Текстурный Кроп",
      titleEn: "Textured Crop with Low Taper",
      altHy: "Տեքստուրային կրոպ կտրվածք",
      altRu: "Текстурная стрижка кроп",
      altEn: "Textured crop haircut",
      category: "fade",
      sortOrder: 2,
      isFeatured: true,
    },
    {
      url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80",
      titleHy: "Մորուքի Քանդակային Ուրվագիծ",
      titleRu: "Скульптурная Форма Бороды",
      titleEn: "Sculpted Full Beard with Razor Lining",
      altHy: "Մորուքի պրոֆեսիոնալ ձևավորում",
      altRu: "Оформление бороды",
      altEn: "Beard sculpting and trimming",
      category: "beard",
      sortOrder: 3,
      isFeatured: true,
    },
    {
      url: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=1200&q=80",
      titleHy: "Դասական Սայդ Փարթ",
      titleRu: "Классический Пробор (Side Part)",
      titleEn: "Executive Side Part with Natural Sheen",
      altHy: "Դասական գծային կտրվածք",
      altRu: "Стрижка с пробором",
      altEn: "Executive side part haircut",
      category: "classic",
      sortOrder: 4,
    },
    {
      url: "https://images.unsplash.com/photo-1517832606589-7629c339590a?auto=format&fit=crop&w=1200&q=80",
      titleHy: "Բարձր Կոնտրաստային Սքին Ֆեյդ",
      titleRu: "Высокий Контрастный Фейд",
      titleEn: "High Skin Fade with Textured Top",
      altHy: "Սքին ֆեյդ կտրվածք",
      altRu: "Стрижка скин фейд",
      altEn: "High skin fade cut",
      category: "fade",
      sortOrder: 5,
    },
    {
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
      titleHy: "Ոճավորում և Կերատինային Խնամք",
      titleRu: "Стайлинг и Кератиновый Уход",
      titleEn: "Matte Clay Sculpting & Hair Care",
      altHy: "Մազերի պրոֆեսիոնալ ոճավորում",
      altRu: "Укладка волос глиной",
      altEn: "Grooming styling session",
      category: "styling",
      sortOrder: 6,
    },
  ];

  for (const item of portfolioItems) {
    const existing = await prisma.portfolioImage.findFirst({ where: { url: item.url } });
    if (!existing) {
      await prisma.portfolioImage.create({ data: item });
    }
  }
  console.log("Portfolio seeded.");

  // 6. Theme Settings
  await prisma.themeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      background: "#0d0d0f",
      foreground: "#f4f4f6",
      surface: "#16161a",
      surfaceElevated: "#1f1f24",
      border: "#2a2a32",
      muted: "#8e8e9c",
      accent: "#c5a880",
      accentForeground: "#000000",
      buttonStyle: "sharp",
      hoverEffect: "glow",
    },
  });
  console.log("Theme settings initialized.");

  // 7. Site Content
  const siteContents = [
    {
      key: "hero_title",
      section: "hero",
      valueHy: "ՃՇԳՐՏՈՒԹՅՈՒՆ ԵՎ ԱՆՀԱՏԱԿԱՆ ՈՃ",
      valueRu: "ТОЧНОСТЬ И ИНДИВИДУАЛЬНЫЙ СТИЛЬ",
      valueEn: "PRECISION & BESPOKE CRAFTSMANSHIP",
    },
    {
      key: "hero_subtitle",
      section: "hero",
      valueHy: "Բարձրակարգ սպասարկում, դասական և ժամանակակից կտրվածքներ, մորուքի պրոֆեսիոնալ խնամք՝ Երևանի սրտում:",
      valueRu: "Первоклассный сервис, классические и современные стрижки, профессиональный уход за бородой в центре Еревана.",
      valueEn: "World-class grooming, master haircuts, and royal beard care in the heart of Yerevan.",
    },
    {
      key: "barber_name",
      section: "about",
      valueHy: "Գագիկ Ղամբարյան",
      valueRu: "Гагик Гамбарян",
      valueEn: "Gagik Ghambaryan",
    },
    {
      key: "barber_bio",
      section: "about",
      valueHy: "Ավելի քան 12 տարի ես ստեղծում եմ կերպարներ, որոնք ընդգծում են տղամարդու բնավորությունն ու առնականությունը: Սովորելով Լոնդոնի և Միլանի առաջատար ակադեմիաներում՝ իմ աշխատանքում միավորում եմ դասական բրիտանական ավանդույթներն ու ժամանակակից իտալական նրբագեղությունը:",
      valueRu: "Более 12 лет я создаю образы, подчеркивающие мужской характер и индивидуальность. Пройдя обучение в академиях Лондона и Милана, в своей работе я сочетаю классические британские традиции и современную итальянскую утонченность.",
      valueEn: "For over 12 years, I have sculpted aesthetics that embody male confidence and poise. Trained in premier grooming academies in London and Milan, my work fuses time-honored British tradition with contemporary Italian refinement.",
    },
  ];

  for (const c of siteContents) {
    await prisma.siteContent.upsert({
      where: { key: c.key },
      update: c,
      create: c,
    });
  }
  console.log("Site content initialized.");

  // 8. Availability Calendar: CLOSED BY DEFAULT!
  // To demonstrate the system, we explicitly open 2 upcoming dates (tomorrow and day after tomorrow)
  // while ensuring all other days remain closed by default.
  const today = new Date();
  for (let i = 1; i <= 2; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    const dateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

    const day = await prisma.availabilityDay.upsert({
      where: { date: dateStr },
      update: { isOpen: true },
      create: {
        date: dateStr,
        isOpen: true,
        notes: `Master schedule opened for ${dateStr}`,
      },
    });

    const timeSlots = [
      { start: "10:00", end: "11:00" },
      { start: "11:00", end: "12:00" },
      { start: "12:00", end: "13:00" },
      { start: "14:00", end: "15:00" },
      { start: "15:00", end: "16:00" },
      { start: "16:00", end: "17:00" },
      { start: "17:00", end: "18:00" },
      { start: "18:00", end: "19:00" },
    ];

    for (const slot of timeSlots) {
      await prisma.availabilitySlot.upsert({
        where: {
          availabilityDayId_startTime: {
            availabilityDayId: day.id,
            startTime: slot.start,
          },
        },
        update: {},
        create: {
          availabilityDayId: day.id,
          startTime: slot.start,
          endTime: slot.end,
          status: SlotStatus.AVAILABLE,
        },
      });
    }
  }
  console.log("Sample opened availability days and slots generated.");
  console.log("Seed finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
