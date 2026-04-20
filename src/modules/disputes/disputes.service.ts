import { prisma } from '../../config/database';
import { DisputeCategory, DisputeStatus, DisputeEventType } from '@prisma/client';

export const disputesService = {
  async createDispute(data: {
    tenantId: string;
    tenancyId: string;
    categoryId: DisputeCategory;
    description: string;
    evidenceUrls?: string[];
    paymentId?: string;
    maintenanceRequestId?: string;
  }) {
    // Validate tenancy to fetch landlord
    const tenancy = await prisma.tenancy.findUnique({
      where: { id: data.tenancyId },
      include: { property: true }
    });

    if (!tenancy || tenancy.tenantId !== data.tenantId) {
      throw new Error('Invalid tenancy or permission denied');
    }

    const landlordId = tenancy.property.ownerId;

    return prisma.dispute.create({
      data: {
        tenantId: data.tenantId,
        landlordId,
        tenancyId: data.tenancyId,
        categoryId: data.categoryId,
        description: data.description,
        evidenceUrls: data.evidenceUrls || [],
        paymentId: data.paymentId,
        maintenanceRequestId: data.maintenanceRequestId,
        status: 'OPEN',
        events: {
          create: [{
            actorId: data.tenantId,
            eventType: 'CREATED',
            details: { message: 'Dispute opened by tenant' }
          }]
        }
      },
      include: { events: true }
    });
  },

  async listUserDisputes(userId: string) {
    return prisma.dispute.findMany({
      where: {
        OR: [
          { tenantId: userId },
          { landlordId: userId }
        ]
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true } },
        landlord: { select: { id: true, firstName: true, lastName: true } },
        tenancy: { include: { property: true } }
      }
    });
  },

  async getDisputeDetails(userId: string, disputeId: string, isSupportAgent: boolean = false) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true } },
        landlord: { select: { id: true, firstName: true, lastName: true } },
        tenancy: { include: { property: true } },
        events: {
          orderBy: { createdAt: 'asc' },
          include: { actor: { select: { id: true, firstName: true, lastName: true, role: true } } }
        }
      }
    });

    if (!dispute) throw new Error('Dispute not found');

    if (!isSupportAgent && dispute.tenantId !== userId && dispute.landlordId !== userId) {
      throw new Error('Permission denied');
    }

    return dispute;
  },

  async addEvent(userId: string, disputeId: string, eventType: DisputeEventType, details: any, isSupportAgent: boolean = false) {
    const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw new Error('Dispute not found');

    if (!isSupportAgent && dispute.tenantId !== userId && dispute.landlordId !== userId) {
      throw new Error('Permission denied');
    }

    // Update dispute updatedAt
    await prisma.dispute.update({
      where: { id: disputeId },
      data: { updatedAt: new Date() }
    });

    return prisma.disputeEvent.create({
      data: {
        disputeId,
        actorId: userId,
        eventType,
        details
      },
      include: {
        actor: { select: { id: true, firstName: true, lastName: true, role: true } }
      }
    });
  },

  async updateStatus(disputeId: string, status: DisputeStatus) {
    return prisma.dispute.update({
      where: { id: disputeId },
      data: { status }
    });
  }
};
