import { prisma } from '../../config/database';
import { MaintenanceStatus } from '@prisma/client';

export const maintenanceService = {
  // Tenant operations
  async createMaintenanceRequest(tenantId: string, data: { tenancyId: string; title: string; description: string; priority?: string }) {
    const tenancy = await prisma.tenancy.findFirst({
      where: { id: data.tenancyId, tenantId },
    });

    if (!tenancy) {
      throw new Error('Tenancy not found or you do not have permission');
    }

    return prisma.maintenanceRequest.create({
      data: {
        tenancyId: data.tenancyId,
        tenantId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'NORMAL',
      },
    });
  },

  async listMaintenanceRequestsForTenant(tenantId: string, tenancyId?: string) {
    return prisma.maintenanceRequest.findMany({
      where: {
        tenantId,
        ...(tenancyId ? { tenancyId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tenancy: {
          include: {
            property: true
          }
        }
      }
    });
  },

  // Landlord operations
  async listMaintenanceRequestsForLandlord(landlordId: string, propertyId?: string) {
    return prisma.maintenanceRequest.findMany({
      where: {
        tenancy: {
          property: {
            ownerId: landlordId,
            ...(propertyId ? { id: propertyId } : {})
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        tenancy: {
          include: {
            property: true
          }
        }
      }
    });
  },

  async updateMaintenanceStatus(userId: string, requestId: string, data: { status: MaintenanceStatus; priority?: string }, isSupportAgent: boolean = false) {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        tenancy: {
          include: {
            property: true
          }
        }
      }
    });

    if (!request) {
      throw new Error('Maintenance request not found');
    }

    // Check permissions: Owner or Support Agent
    if (!isSupportAgent && request.tenancy.property.ownerId !== userId) {
      throw new Error('You do not have permission to update this request');
    }

    return prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: data.status,
        ...(data.priority ? { priority: data.priority } : {})
      }
    });
  }
};
