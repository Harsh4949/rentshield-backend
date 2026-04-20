import { prisma } from '../../config/database';

export const chatService = {
  async createSession(userId: string, targetType: 'TENANCY' | 'MAINTENANCE' | 'BOOKING', targetId: string) {
    let tenantId: string, otherId: string;
    
    if (targetType === 'TENANCY') {
      const t = await prisma.tenancy.findUnique({ where: { id: targetId }, include: { property: true } });
      if (!t) throw new Error('Tenancy not found');
      tenantId = t.tenantId; otherId = t.property.ownerId;
    } else if (targetType === 'MAINTENANCE') {
      const m = await prisma.maintenanceRequest.findUnique({ where: { id: targetId }, include: { tenancy: { include: { property: true } } } });
      if (!m) throw new Error('Request not found');
      tenantId = m.tenantId; otherId = m.tenancy.property.ownerId;
    } else {
      const b = await prisma.serviceBooking.findUnique({ where: { id: targetId }, include: { expert: true } });
      if (!b) throw new Error('Booking not found');
      tenantId = b.tenantId; otherId = b.expert.userId;
    }

    if (userId !== tenantId && userId !== otherId) {
      throw new Error('Not permitted to create session for this resource');
    }

    // Check for existing session for this booking to avoid duplicates
    if (targetType === 'BOOKING') {
      const existing = await prisma.chatSession.findUnique({ where: { bookingId: targetId } });
      if (existing) return existing;
    }

    const newSession = await prisma.chatSession.create({
      data: {
        ...(targetType === 'TENANCY' ? { tenancyId: targetId } : 
           targetType === 'MAINTENANCE' ? { maintenanceRequestId: targetId } : 
           { bookingId: targetId }),
        participants: {
          create: [
            { userId: tenantId },
            { userId: otherId }
          ]
        }
      },
      include: {
        participants: true
      }
    });

    // Link chat session back to booking if applicable
    if (targetType === 'BOOKING') {
      await prisma.serviceBooking.update({
        where: { id: targetId },
        data: { chatSessionId: newSession.id }
      });
    }
    
    return newSession;
  },

  async listSessions(userId: string) {
    return prisma.chatSession.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, role: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  },

  async getMessages(userId: string, chatSessionId: string) {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: chatSessionId,
        participants: { some: { userId } }
      }
    });

    if (!session) throw new Error('Session not found or forbidden');

    return prisma.message.findMany({
      where: { chatSessionId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } }
    });
  },

  async saveMessage(chatSessionId: string, senderId: string, content: string) {
    const session = await prisma.chatSession.findUnique({
      where: { id: chatSessionId },
      include: { participants: true }
    });

    if (!session || !session.participants.find(p => p.userId === senderId)) {
       throw new Error('Invalid session or user not in session');
    }

    await prisma.chatSession.update({
      where: { id: chatSessionId },
      data: { updatedAt: new Date() }
    });

    return prisma.message.create({
      data: {
        chatSessionId,
        senderId,
        content
      },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } }
    });
  }
};
