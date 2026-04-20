import { prisma } from '../../config/database';
import { MoveInStatus, ChecklistItemStatus } from '@prisma/client';

const DEFAULT_CHECKLIST_ITEMS = [
  'Keys handed over',
  'ID verification completed',
  'Property condition photos taken',
  'Inventory list reviewed',
  'Meter readings recorded',
  'Utility connections confirmed',
  'Tenant signed move-in agreement',
];

export const moveInService = {
  // ─── Schedule ─────────────────────────────────────────────────
  async scheduleMoveIn(tenantId: string, tenancyId: string, scheduledAt: Date, notes?: string) {
    const tenancy = await prisma.tenancy.findFirst({ where: { id: tenancyId, tenantId } });
    if (!tenancy) throw new Error('Tenancy not found or permission denied');

    const existing = await prisma.moveIn.findUnique({ where: { tenancyId } });
    if (existing) throw new Error('Move-in already scheduled for this tenancy');

    return prisma.moveIn.create({
      data: {
        tenancyId,
        scheduledAt,
        notes,
        checklist: {
          create: DEFAULT_CHECKLIST_ITEMS.map(label => ({ label })),
        },
      },
      include: { checklist: true, inspections: true },
    });
  },

  async getMoveIn(tenancyId: string) {
    const moveIn = await prisma.moveIn.findUnique({
      where: { tenancyId },
      include: {
        checklist: { orderBy: { createdAt: 'asc' } },
        inspections: { orderBy: { createdAt: 'asc' } },
        tenancy: { include: { property: true, tenant: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    if (!moveIn) throw new Error('Move-in not found');
    return moveIn;
  },

  // ─── Checklist ────────────────────────────────────────────────
  async updateChecklistItem(moveInId: string, itemId: string, data: { status: ChecklistItemStatus; notes?: string }) {
    return prisma.moveInChecklistItem.update({
      where: { id: itemId, moveInId },
      data: {
        status: data.status,
        notes: data.notes,
        completedAt: data.status === 'COMPLETED' ? new Date() : null,
      },
    });
  },

  // ─── Inspection ───────────────────────────────────────────────
  async addInspectionItem(moveInId: string, data: { room: string; itemName: string; condition: string; notes?: string; photoUrls?: string[] }) {
    return prisma.moveInInspection.create({
      data: {
        moveInId,
        room: data.room,
        itemName: data.itemName,
        condition: data.condition,
        notes: data.notes,
        photoUrls: data.photoUrls || [],
      },
    });
  },

  // ─── Status updates ───────────────────────────────────────────
  async updateMoveInStatus(moveInId: string, status: MoveInStatus) {
    return prisma.moveIn.update({
      where: { id: moveInId },
      data: { status },
    });
  },

  // ─── Sign-off ─────────────────────────────────────────────────
  async completeMoveIn(moveInId: string) {
    const moveIn = await prisma.moveIn.findUnique({
      where: { id: moveInId },
      include: { checklist: true },
    });
    if (!moveIn) throw new Error('Move-in not found');

    const pendingItems = moveIn.checklist.filter(i => i.status === 'PENDING');
    if (pendingItems.length > 0) {
      throw new Error(`${pendingItems.length} checklist item(s) still pending. Complete all items before sign-off.`);
    }

    return prisma.moveIn.update({
      where: { id: moveInId },
      data: { status: 'COMPLETED' },
      include: { checklist: true, inspections: true },
    });
  },
};
