import { prisma } from '../../config/database';
import { NoticeType } from '@prisma/client';

export const noticeService = {
  async createNotice(data: {
    title: string;
    content: string;
    type: NoticeType;
    category?: string;
    isPinned?: boolean;
    expiryDate?: Date;
    societyId?: string;
    buildingId?: string;
    createdById: string;
  }) {
    return prisma.notice.create({
      data,
      include: {
        society: { select: { id: true, name: true } },
        building: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });
  },

  async listNoticesForUser(userId: string) {
    // A user sees:
    // 1. Global notices (societyId is null)
    // 2. Notices for their society
    // 3. Notices for their building (if they are in a specific building)

    // First find the user's current tenancy/society info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenanciesAsTenant: {
          where: { status: 'ACTIVE' },
          include: {
            property: {
              select: { societyId: true, buildingId: true }
            }
          }
        },
        properties: {
          select: { societyId: true, buildingId: true }
        }
      }
    });

    if (!user) throw new Error('User not found');

    const societyIds = new Set<string>();
    const buildingIds = new Set<string>();

    // From tenancies (as tenant)
    user.tenanciesAsTenant.forEach(t => {
      if (t.property.societyId) societyIds.add(t.property.societyId);
      if (t.property.buildingId) buildingIds.add(t.property.buildingId);
    });

    // From owned properties (as landlord)
    user.properties.forEach(p => {
      if (p.societyId) societyIds.add(p.societyId);
      if (p.buildingId) buildingIds.add(p.buildingId);
    });

    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { societyId: null }, // Global
          { societyId: { in: Array.from(societyIds) } },
          { buildingId: { in: Array.from(buildingIds) } }
        ],
        AND: [
          {
            OR: [
              { expiryDate: null },
              { expiryDate: { gt: new Date() } }
            ]
          }
        ]
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        society: { select: { id: true, name: true } },
        building: { select: { id: true, name: true } },
        readBy: {
          where: { userId }
        }
      }
    });

    return notices.map(notice => ({
      ...notice,
      isRead: notice.readBy.length > 0
    }));
  },

  async markAsRead(userId: string, noticeId: string) {
    return prisma.noticeRead.upsert({
      where: {
        userId_noticeId: { userId, noticeId }
      },
      create: { userId, noticeId },
      update: { readAt: new Date() }
    });
  },

  async getNoticeDetails(noticeId: string) {
    return prisma.notice.findUnique({
      where: { id: noticeId },
      include: {
        society: { select: { id: true, name: true } },
        building: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });
  }
};
