import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    include: { profile: true },
  });

  if (admin && admin.profile) {
    await prisma.profile.update({
      where: { userId: admin.id },
      data: { photoUrl: "/images/gagik-barber.jpg" },
    });
    console.log("Successfully updated admin profile photoUrl to /images/gagik-barber.jpg");
  } else {
    console.log("Admin or profile not found");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
