import { prisma } from '../../config/database';
import { ExitStatus } from '@prisma/client';

export const exitService = {
  // ─── Tenant: Request Exit ──────────────────────────────────────
  async requestExit(tenantId: string, data: { tenancyId: string; desiredMoveOutDate: Date; reason: string; comments?: string }) {
    const tenancy = await prisma.tenancy.findFirst({
      where: { id: data.tenancyId, tenantId, status: 'ACTIVE' },
    });
    if (!tenancy) throw new Error('Active tenancy not found or permission denied');

    const existing = await prisma.exitRequest.findUnique({ where: { tenancyId: data.tenancyId } });
    if (existing) throw new Error('Exit request already exists for this tenancy');

    return prisma.exitRequest.create({
      data: {
        tenancyId: data.tenancyId,
        desiredMoveOutDate: data.desiredMoveOutDate,
        reason: data.reason,
        comments: data.comments,
        status: 'REQUESTED',
      },
      include: { inspectionItems: true, settlement: true },
    });
  },

  async getExitRequest(tenancyId: string) {
    const exit = await prisma.exitRequest.findUnique({
      where: { tenancyId },
      include: {
        inspectionItems: { orderBy: { createdAt: 'asc' } },
        settlement: true,
        tenancy: {
          include: {
            property: true,
            tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
    if (!exit) throw new Error('Exit request not found');
    return exit;
  },

  // ─── Landlord: Review exit request ─────────────────────────────
  async reviewExitRequest(landlordId: string, exitRequestId: string, decision: {
    status: 'APPROVED' | 'REJECTED' | 'DATE_PROPOSED';
    landlordNotes?: string;
    alternateDate?: Date;
  }) {
    const exitReq = await prisma.exitRequest.findUnique({
      where: { id: exitRequestId },
      include: { tenancy: { include: { property: true } } },
    });
    if (!exitReq) throw new Error('Exit request not found');
    if (exitReq.tenancy.property.ownerId !== landlordId) throw new Error('Permission denied');

    return prisma.exitRequest.update({
      where: { id: exitRequestId },
      data: {
        status: decision.status,
        landlordNotes: decision.landlordNotes,
        alternateDate: decision.alternateDate,
      },
    });
  },

  // ─── Exit Inspection ──────────────────────────────────────────
  async addInspectionItem(exitRequestId: string, data: {
    room: string;
    itemName: string;
    moveInCondition: string;
    moveOutCondition: string;
    proposedCharge?: number;
    notes?: string;
    photoUrls?: string[];
  }) {
    return prisma.exitInspectionItem.create({
      data: {
        exitRequestId,
        room: data.room,
        itemName: data.itemName,
        moveInCondition: data.moveInCondition,
        moveOutCondition: data.moveOutCondition,
        proposedCharge: data.proposedCharge || 0,
        notes: data.notes,
        photoUrls: data.photoUrls || [],
      },
    });
  },

  // ─── Settlement ───────────────────────────────────────────────
  async generateSettlement(exitRequestId: string) {
    const exitReq = await prisma.exitRequest.findUnique({
      where: { id: exitRequestId },
      include: {
        inspectionItems: true,
        tenancy: true,
      },
    });
    if (!exitReq) throw new Error('Exit request not found');

    const damageCharges = exitReq.inspectionItems.reduce((sum, i) => sum + i.proposedCharge, 0);
    const depositAmount = exitReq.tenancy.depositAmount;
    const refundAmount = Math.max(0, depositAmount - damageCharges);

    const settlement = await prisma.exitSettlement.upsert({
      where: { exitRequestId },
      create: {
        exitRequestId,
        rentOutstanding: 0,
        utilityCharges: 0,
        damageCharges,
        depositAmount,
        refundAmount,
      },
      update: { damageCharges, depositAmount, refundAmount },
    });

    await prisma.exitRequest.update({
      where: { id: exitRequestId },
      data: { status: 'SETTLEMENT_PENDING' },
    });

    return settlement;
  },

  async acceptSettlement(userId: string, exitRequestId: string, role: 'tenant' | 'landlord') {
    const settlement = await prisma.exitSettlement.findUnique({ where: { exitRequestId } });
    if (!settlement) throw new Error('Settlement not found');

    const data = role === 'tenant'
      ? { tenantAccepted: true }
      : { landlordAccepted: true };

    const updated = await prisma.exitSettlement.update({ where: { exitRequestId }, data });

    // Close tenancy if both accepted
    if (updated.tenantAccepted && updated.landlordAccepted) {
      await prisma.exitSettlement.update({ where: { exitRequestId }, data: { acceptedAt: new Date() } });
      await prisma.exitRequest.update({ where: { id: exitRequestId }, data: { status: 'CLOSED' } });

      // Mark tenancy as terminated
      const exitReq = await prisma.exitRequest.findUnique({ where: { id: exitRequestId } });
      if (exitReq) {
        await prisma.tenancy.update({
          where: { id: exitReq.tenancyId },
          data: { status: 'TERMINATED', endDate: exitReq.desiredMoveOutDate },
        });
      }
    }

    return updated;
  },
};
