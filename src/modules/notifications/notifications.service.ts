import { prisma } from '../../config/database';
import { NotificationType } from '@prisma/client';

export const notificationsService = {

  // ─── List notifications for user ────────────────────────────────────────
  async list(userId: string, options?: { unreadOnly?: boolean; limit?: number }) {
    const { unreadOnly = false, limit = 50 } = options ?? {};

    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        link: true,
        isRead: true,
        sentAt: true,
        createdAt: true,
      },
    });
  },

  // ─── Unread count ────────────────────────────────────────────────────────
  async unreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  },

  // ─── Mark a single notification as read ──────────────────────────────────
  async markRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      select: { id: true, isRead: true },
    });
  },

  // ─── Mark ALL as read ────────────────────────────────────────────────────
  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count, message: 'All notifications marked as read' };
  },

  // ─── Delete a notification ───────────────────────────────────────────────
  async delete(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    await prisma.notification.delete({ where: { id: notificationId } });
    return { message: 'Notification deleted' };
  },

  // ─── Create notification (internal / admin use) ──────────────────────────
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    return prisma.notification.create({
      data: { ...data, sentAt: new Date() },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        link: true,
        isRead: true,
        createdAt: true,
      },
    });
  },
};
