import { prisma } from "@/lib/prisma";

export class ProfileService {
  /**
   * Get user profile details
   */
  async getUserProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });
  }

  /**
   * Update user profile preferences
   */
  async updateProfile(userId: string, data: {
    name?: string;
    preferredHaircut?: string;
    hairColor?: string;
    preferences?: string;
    photoUrl?: string;
  }) {
    const { name, ...profileData } = data;

    if (name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    return prisma.profile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData,
      },
    });
  }

  /**
   * Get customer appointment history
   */
  async getUserBookings(userId: string) {
    return prisma.booking.findMany({
      where: { userId },
      include: {
        items: true,
        slot: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const profileService = new ProfileService();
