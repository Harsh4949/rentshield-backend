import { prisma } from '../../config/database';
import { permissionService } from '../../core/permissions/permission.service';
import { UserRole, KycStatus } from '@prisma/client';

export const adminService = {
  async listModules() {
    return prisma.module.findMany({
      include: { features: true },
      orderBy: { name: 'asc' },
    });
  },

  async createModule(data: { name: string; label?: string }) {
    const module = await prisma.module.create({ data });
    await permissionService.clearAllCapabilitiesCache();
    return module;
  },

  async updateModule(moduleId: string, data: { name?: string; label?: string; isActive?: boolean }) {
    const module = await prisma.module.update({
      where: { id: moduleId },
      data,
    });
    await permissionService.clearAllCapabilitiesCache();
    return module;
  },

  async deleteModule(moduleId: string) {
    await prisma.module.delete({ where: { id: moduleId } });
    await permissionService.clearAllCapabilitiesCache();
    return { message: 'Module and associated features deleted successfully' };
  },

  async toggleModule(moduleId: string, isActive: boolean) {
    const updatedModule = await prisma.module.update({
      where: { id: moduleId },
      data: { isActive },
    });

    await permissionService.clearAllCapabilitiesCache();
    return updatedModule;
  },

  // Feature Management
  async listFeatures(moduleId?: string) {
    return prisma.feature.findMany({
      where: moduleId ? { moduleId } : {},
      include: { module: true },
      orderBy: { name: 'asc' },
    });
  },

  async createFeature(data: { name: string; description?: string; moduleId: string }) {
    const feature = await prisma.feature.create({ data });
    await permissionService.clearAllCapabilitiesCache();
    return feature;
  },

  async deleteFeature(featureId: string) {
    await prisma.feature.delete({ where: { id: featureId } });
    await permissionService.clearAllCapabilitiesCache();
    return { message: 'Feature deleted successfully' };
  },

  // Role Management
  async listRoleFeatures(role?: UserRole) {
    return prisma.roleFeature.findMany({
      where: role ? { role } : {},
      include: {
        feature: {
          include: { module: true }
        }
      },
      orderBy: { featureId: 'asc' },
    });
  },

  async assignFeatureToRole(role: UserRole, featureId: string) {
    const roleFeature = await prisma.roleFeature.upsert({
      where: { role_featureId: { role, featureId } },
      update: {},
      create: { role, featureId },
    });
    await permissionService.clearAllCapabilitiesCache();
    return roleFeature;
  },

  async revokeFeatureFromRole(role: UserRole, featureId: string) {
    await prisma.roleFeature.delete({
      where: { role_featureId: { role, featureId } },
    });
    await permissionService.clearAllCapabilitiesCache();
    return { message: 'Feature revoked from role successfully' };
  },

  // User Management
  async listUsers(filters?: { role?: UserRole; isActive?: boolean }) {
    return prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateUserStatus(userId: string, isActive: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  },

  async updateUserRole(userId: string, role: UserRole) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    // Invalidate capabilities cache when role changes
    await permissionService.invalidateUserCapabilities(userId);
    return user;
  },

  // KYC Management
  async listKycSubmissions(status?: KycStatus) {
    return prisma.kyc.findMany({
      where: status ? { status } : {},
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        documents: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  },

  async reviewKyc(kycId: string, status: KycStatus, notes?: string, adminId?: string) {
    return prisma.kyc.update({
      where: { id: kycId },
      data: {
        status,
        notes,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });
  },

  // Property Management
  async listAllProperties() {
    return prisma.property.findMany({
      include: {
        owner: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async togglePropertyPublish(propertyId: string, isPublished: boolean) {
    return prisma.property.update({
      where: { id: propertyId },
      data: { isPublished },
    });
  },

  // System Stats
  async getSystemStats() {
    const [userCount, propertyCount, kycPendingCount, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.kyc.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      users: userCount,
      properties: propertyCount,
      pendingKyc: kycPendingCount,
      revenue: totalRevenue._sum.amount || 0,
    };
  },
};
