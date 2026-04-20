import { prisma } from '../../config/database';
import { BookingStatus, Prisma } from '@prisma/client';
import { chatService } from '../chat/chat.service';

export const expertService = {
  // ─── Expert Administration ────────────────────────────────────
  
  async createCategory(data: { name: string; slug: string; iconUrl?: string }) {
    return prisma.serviceCategory.create({ data });
  },

  async listCategories() {
    return prisma.serviceCategory.findMany({
      orderBy: { name: 'asc' }
    });
  },

  async registerExpert(userId: string, data: { categoryId: string; bio: string; experienceYears: number; hourlyRate?: number; societyId?: string }) {
    return prisma.serviceExpert.create({
      data: {
        userId,
        ...data
      }
    });
  },

  // ─── Marketplace Features ─────────────────────────────────────

  async listExperts(filters: { categoryId?: string; city?: string; isVerified?: boolean; q?: string }) {
    const where: Prisma.ServiceExpertWhereInput = {};

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;
    
    if (filters.city || filters.q) {
      where.user = {
        OR: [
          filters.city ? { kyc: { documents: { some: { type: 'ADDRESS', fileUrl: { contains: filters.city } } } } } : {}, // Simplified city check
          filters.q ? { firstName: { contains: filters.q, mode: 'insensitive' } } : {},
          filters.q ? { lastName: { contains: filters.q, mode: 'insensitive' } } : {}
        ]
      };
    }

    return prisma.serviceExpert.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        category: true
      },
      orderBy: { rating: 'desc' }
    });
  },

  async getExpertDetail(id: string) {
    return prisma.serviceExpert.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        category: true,
        reviews: {
          include: { tenant: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  },

  // ─── Booking Lifecycle ────────────────────────────────────────

  async createBooking(tenantId: string, expertId: string, data: { description: string; scheduledAt: Date }) {
    const booking = await prisma.serviceBooking.create({
      data: {
        tenantId,
        expertId,
        description: data.description,
        scheduledAt: data.scheduledAt,
        status: 'REQUESTED'
      }
    });

    // Auto-create Chat Session
    await chatService.createSession(tenantId, 'BOOKING', booking.id);

    return booking;
  },

  async updateBookingStatus(userId: string, bookingId: string, status: BookingStatus, finalPrice?: number) {
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: bookingId },
      include: { expert: true }
    });

    if (!booking) throw new Error('Booking not found');
    
    // Authorization check
    if (userId !== booking.tenantId && userId !== booking.expert.userId) {
      throw new Error('Unauthorized');
    }

    const updateData: Prisma.ServiceBookingUpdateInput = { status };
    
    if (status === 'CONFIRMED' && finalPrice) {
      updateData.finalPrice = finalPrice;
      
      // MOCK: Generate Payment record via the Payment Vault logic
      // In a real system, we'd have a separate ServiceFee model, but here we reuse Payment.
      
      const paymentPlan = await prisma.paymentPlan.findFirst({
         where: { tenancy: { tenantId: booking.tenantId } } // Just finding a plan to attach to for now as per schema requirements
      });

      if (paymentPlan) {
        const payment = await prisma.payment.create({
          data: {
            planId: paymentPlan.id,
            type: 'MAINTENANCE',
            amount: finalPrice,
            balanceDue: finalPrice,
            dueDate: new Date(),
            status: 'PENDING'
          }
        });
        updateData.payment = { connect: { id: payment.id } };
      }
    }

    return prisma.serviceBooking.update({
      where: { id: bookingId },
      data: updateData
    });
  },

  async getBookings(userId: string, role: string) {
    if (role === 'SERVICE_PROVIDER' || role === 'PLATFORM_ADMIN') {
       // As expert
       return prisma.serviceBooking.findMany({
         where: { expert: { userId } },
         include: {
           tenant: { select: { firstName: true, lastName: true } },
           chatSession: true
         },
         orderBy: { scheduledAt: 'asc' }
       });
    } else {
       // As tenant
       return prisma.serviceBooking.findMany({
         where: { tenantId: userId },
         include: {
           expert: { include: { user: { select: { firstName: true, lastName: true } }, category: true } },
           chatSession: true
         },
         orderBy: { scheduledAt: 'asc' }
       });
    }
  },

  // ─── Reviews ──────────────────────────────────────────────────

  async addReview(tenantId: string, expertId: string, rating: number, comment?: string) {
    const review = await prisma.serviceReview.create({
      data: { tenantId, expertId, rating, comment }
    });

    // Update Expert aggregate rating
    const expert = await prisma.serviceExpert.findUnique({ where: { id: expertId }, include: { reviews: true } });
    if (expert) {
      const avgRating = expert.reviews.reduce((acc, r) => acc + r.rating, 0) / expert.reviews.length;
      await prisma.serviceExpert.update({
        where: { id: expertId },
        data: {
          rating: avgRating,
          totalReviews: expert.reviews.length
        }
      });
    }

    return review;
  }
};
