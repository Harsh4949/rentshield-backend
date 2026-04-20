import { prisma } from '../../config/database';
import { SupportTicketStatus } from '@prisma/client';

export const supportService = {
  // ─── Knowledge Base ───────────────────────────────────────────
  async searchKbArticles(query?: string, category?: string) {
    return prisma.kbArticle.findMany({
      where: {
        isPublished: true,
        ...(category ? { category } : {}),
        ...(query
          ? { OR: [{ title: { contains: query, mode: 'insensitive' } }, { content: { contains: query, mode: 'insensitive' } }] }
          : {}),
      },
      select: { id: true, title: true, slug: true, category: true, helpful: true, notHelpful: true, createdAt: true },
      orderBy: { helpful: 'desc' },
    });
  },

  async getKbArticleBySlug(slug: string) {
    const article = await prisma.kbArticle.findUnique({ where: { slug, isPublished: true } });
    if (!article) throw new Error('Article not found');
    return article;
  },

  async voteKbArticle(id: string, helpful: boolean) {
    return prisma.kbArticle.update({
      where: { id },
      data: helpful ? { helpful: { increment: 1 } } : { notHelpful: { increment: 1 } },
    });
  },

  // ─── Admin: KB CRUD ───────────────────────────────────────────
  async createKbArticle(data: { title: string; slug: string; category: string; content: string; isPublished?: boolean }) {
    return prisma.kbArticle.create({ data });
  },

  async updateKbArticle(id: string, data: Partial<{ title: string; content: string; category: string; isPublished: boolean }>) {
    return prisma.kbArticle.update({ where: { id }, data });
  },

  // ─── Tickets ─────────────────────────────────────────────────
  async createTicket(userId: string, data: { topic: string; description: string }) {
    return prisma.supportTicket.create({
      data: {
        userId,
        topic: data.topic,
        description: data.description,
      },
      include: { messages: true },
    });
  },

  async listUserTickets(userId: string) {
    return prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        csat: true,
      },
    });
  },

  async getTicketDetails(userId: string, ticketId: string, isAgent: boolean = false) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
        },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        csat: true,
      },
    });

    if (!ticket) throw new Error('Ticket not found');
    if (!isAgent && ticket.userId !== userId) throw new Error('Permission denied');

    return ticket;
  },

  async addMessage(userId: string, ticketId: string, content: string, isAgent: boolean = false) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Ticket not found');
    if (!isAgent && ticket.userId !== userId) throw new Error('Permission denied');
    if (ticket.status === 'CLOSED') throw new Error('Cannot reply to a closed ticket');

    // Advance status on agent reply
    if (isAgent && ticket.status === 'OPEN') {
      await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'IN_PROGRESS', updatedAt: new Date() } });
    } else if (!isAgent && ticket.status === 'WAITING_ON_CUSTOMER') {
      await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'IN_PROGRESS', updatedAt: new Date() } });
    } else {
      await prisma.supportTicket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } });
    }

    return prisma.supportTicketMessage.create({
      data: { ticketId, senderId: userId, content },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });
  },

  // ─── Agent: status / assignment ──────────────────────────────
  async updateTicketStatus(ticketId: string, status: SupportTicketStatus, agentId?: string) {
    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        ...(agentId ? { assigneeId: agentId } : {}),
        ...(status === 'CLOSED' ? { closedAt: new Date() } : {}),
      },
    });
  },

  // ─── CSAT ─────────────────────────────────────────────────────
  async submitCsat(userId: string, ticketId: string, rating: number, comment?: string) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.userId !== userId) throw new Error('Permission denied');
    if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) throw new Error('CSAT only available for resolved/closed tickets');

    return prisma.supportTicketCsat.upsert({
      where: { ticketId },
      create: { ticketId, rating, comment },
      update: { rating, comment },
    });
  },
};
