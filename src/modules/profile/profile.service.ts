import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';

export const profileService = {

  // ─── Get full profile ────────────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kyc: { select: { status: true, reviewedAt: true } },
        userSubscriptions: {
          include: { subscription: { select: { name: true, description: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) throw new Error('User not found');

    const { password, ...userProfile } = user;

    return {
      ...userProfile,
      name: `${user.firstName} ${user.lastName}`,
      subscription: user.userSubscriptions[0]?.subscription ?? null,
    };
  },

  // ─── Update basic info ───────────────────────────────────────────────────
  async updateProfile(userId: string, data: any) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        avatar: data.avatar || null,
        phoneNumber: data.phoneNumber || null,
        address: data.address || null,
        dateOfBirth: (data.dateOfBirth && !isNaN(Date.parse(data.dateOfBirth))) 
          ? new Date(data.dateOfBirth) 
          : null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phoneNumber: true,
        address: true,
        dateOfBirth: true,
        role: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      name: `${updated.firstName} ${updated.lastName}`,
    };
  },

  // ─── Change password ────────────────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new Error('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Password changed successfully' };
  },

  // ─── Toggle 2FA ──────────────────────────────────────────────────────────
  async toggle2fa(userId: string, enabled: boolean) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { is2faEnabled: enabled },
      select: { id: true, is2faEnabled: true },
    });
    return { is2faEnabled: updated.is2faEnabled, message: `2FA ${enabled ? 'enabled' : 'disabled'}` };
  },
};
