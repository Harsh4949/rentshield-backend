import { prisma } from '../../config/database';
import { permissionService } from '../../core/permissions/permission.service';
import { UserRole, KycStatus } from '@prisma/client';

const ALL_ROLES: UserRole[] = ['TENANT', 'LANDLORD', 'SERVICE_PROVIDER', 'SOCIETY_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT'];

const DEFAULT_MODULES = [
  { name: 'property', label: 'Properties', features: ['VIEW_PROPERTIES', 'CREATE_PROPERTY', 'MANAGE_LISTINGS'] },
  { name: 'tenancies', label: 'Tenancies', features: ['VIEW_TENANCIES', 'MANAGE_TENANCY', 'LEASE_RENEWAL'] },
  { name: 'agreements', label: 'Agreements', features: ['DRAFT_AGREEMENT', 'SIGN_AGREEMENT', 'STAMP_AGREEMENT'] },
  { name: 'experts', label: 'Experts', features: ['BROWSE_EXPERTS', 'BOOK_EXPERT', 'LIST_AS_EXPERT'] },
  { name: 'maintenance', label: 'Maintenance', features: ['RAISE_REQUEST', 'ASSIGN_TASK', 'COMPLETE_TASK'] },
  { name: 'finance', label: 'Payments', features: ['VIEW_LEDGER', 'MAKE_PAYMENT', 'GENERATE_INVOICE'] },
  { name: 'chat', label: 'Chat', features: ['SEND_MESSAGE', 'CREATE_SESSION'] },
  { name: 'dispute', label: 'Disputes', features: ['OPEN_DISPUTE', 'MEDIATION', 'CLOSE_DISPUTE'] },
  { name: 'support', label: 'Support', features: ['CREATE_TICKET', 'SEARCH_KB', 'TICKET_CHAT'] },
  { name: 'notices', label: 'Notices', features: ['VIEW_NOTICES', 'POST_NOTICE'] },
  { name: 'notifications', label: 'Notifications', features: ['RECEIVE_ALERTS', 'PUSH_CONFIG'] },
  { name: 'kyc', label: 'KYC', features: ['SUBMIT_KYC', 'VIEW_KYC_STATUS'] },
  { name: 'exit', label: 'Exit Management', features: ['INITIATE_EXIT', 'SETTLEMENT_REVIEW'] },
  { name: 'society', label: 'Society', features: ['SOCIETY_FEED', 'CONTACT_ADMIN', 'SOCIETY_DOCS'] },
  { name: 'admin', label: 'Admin Panel', features: ['MANAGE_PLATFORM', 'USER_AUDIT', 'CONFIG_SETTINGS'] },
  { name: 'profile', label: 'Profile', features: ['EDIT_PROFILE', 'SECURITY_SETTINGS'] },
  { name: 'documents', label: 'Documents', features: ['UPLOAD_DOCS', 'VAULT_ACCESS'] },
];

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
    // Guard: verify module exists before updating to avoid Prisma P2025
    const existing = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!existing) {
      throw new Error(`Module with id "${moduleId}" not found.`);
    }

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

  async updateFeature(featureId: string, data: { name?: string; description?: string }) {
    const feature = await prisma.feature.update({
      where: { id: featureId },
      data,
    });
    await permissionService.clearAllCapabilitiesCache();
    return feature;
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

  async updateUser(userId: string, data: { firstName?: string; lastName?: string; email?: string; role?: UserRole }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    if (data.role) {
      await permissionService.invalidateUserCapabilities(userId);
    }
    return user;
  },

  async deleteUser(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
    return { message: 'User deleted successfully' };
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

  async updateProperty(id: string, data: any) {
    return prisma.property.update({
      where: { id },
      data,
    });
  },

  async deleteProperty(id: string) {
    await prisma.property.delete({ where: { id } });
    return { message: 'Property deleted successfully' };
  },

  // System Stats
  async getSystemStats() {
    const [userCount, propertyCount, kycPendingCount, totalRevenue, moduleCount, activeModuleCount] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.kyc.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.module.count(),
      prisma.module.count({ where: { isActive: true } }),
    ]);

    return {
      users: userCount,
      properties: propertyCount,
      pendingKyc: kycPendingCount,
      revenue: totalRevenue._sum.amount || 0,
      modules: moduleCount,
      activeModules: activeModuleCount,
    };
  },

  // Role Permissions Matrix
  async getRolePermissionsMatrix() {
    const allModules = await prisma.module.findMany({
      include: { features: true },
      orderBy: { name: 'asc' },
    });

    const allRoleFeatures = await prisma.roleFeature.findMany({
      include: { feature: { include: { module: true } } },
    });

    const matrix: Record<string, string[]> = {};
    for (const role of ALL_ROLES) {
      matrix[role] = allRoleFeatures
        .filter(rf => rf.role === role)
        .map(rf => rf.featureId);
    }

    return {
      roles: ALL_ROLES,
      modules: allModules,
      matrix,
    };
  },

  // Seed default modules if DB is empty
  async seedDefaultModules() {
    let seededCount = 0;
    for (const mod of DEFAULT_MODULES) {
      const createdMod = await prisma.module.upsert({
        where: { name: mod.name },
        update: { label: mod.label },
        create: { name: mod.name, label: mod.label, isActive: true },
      });
      seededCount++;

      for (const featName of mod.features) {
        const feature = await prisma.feature.upsert({
          where: { name: featName },
          update: { moduleId: createdMod.id },
          create: { name: featName, moduleId: createdMod.id },
        });

        // Auto-assign to PLATFORM_ADMIN
        await prisma.roleFeature.upsert({
          where: {
            role_featureId: { role: 'PLATFORM_ADMIN', featureId: feature.id }
          },
          update: {},
          create: { role: 'PLATFORM_ADMIN', featureId: feature.id }
        });
      }
    }

    await permissionService.clearAllCapabilitiesCache();
    return { seeded: seededCount };
  },
};
