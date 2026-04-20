import { prisma } from '../../config/database';

export const societyService = {
  async listSocieties() {
    return prisma.society.findMany({
      include: {
        _count: {
          select: { properties: true, buildings: true }
        }
      }
    });
  },

  async createSociety(data: { name: string; address: string; city: string; state: string; postalCode: string }) {
    return prisma.society.create({
      data
    });
  },

  async getSocietyDetails(id: string) {
    return prisma.society.findUnique({
      where: { id },
      include: {
        buildings: {
          include: {
            emergencyContacts: true
          }
        },
        rules: {
          orderBy: { order: 'asc' }
        },
        emergencyContacts: true,
        _count: {
          select: { properties: true }
        }
      }
    });
  },

  async addBuilding(societyId: string, name: string) {
    return prisma.societyBuilding.create({
      data: {
        societyId,
        name
      }
    });
  },

  async setRules(societyId: string, rules: { category: string; title: string; content: string; order: number }[]) {
    // Delete existing rules and replace with new ones
    await prisma.societyRule.deleteMany({
      where: { societyId }
    });

    return prisma.societyRule.createMany({
      data: rules.map(r => ({ ...r, societyId }))
    });
  },

  async addEmergencyContact(data: { societyId?: string; buildingId?: string; name: string; phone: string; description?: string }) {
    return prisma.emergencyContact.create({
      data
    });
  },

  async listResidents(societyId: string) {
    // Residents are tenants or owners linked to properties in this society
    return prisma.user.findMany({
      where: {
        OR: [
          {
            tenanciesAsTenant: {
              some: {
                property: { societyId }
              }
            }
          },
          {
            properties: {
              some: { societyId }
            }
          }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
  },

  // ─── Social & Amenities ──────────────────────────────────────

  async listEvents(societyId: string) {
    return prisma.societyEvent.findMany({
      where: { societyId },
      orderBy: { scheduledAt: 'asc' }
    });
  },

  async createEvent(societyId: string, data: { title: string; description?: string; scheduledAt: Date; venue?: string; isPublic?: boolean }) {
    return prisma.societyEvent.create({
      data: { societyId, ...data }
    });
  },

  async listAmenities(societyId: string) {
    return prisma.societyAmenity.findMany({
      where: { societyId }
    });
  },

  async bookAmenity(userId: string, amenityId: string, startTime: Date, endTime: Date) {
    const amenity = await prisma.societyAmenity.findUnique({ where: { id: amenityId } });
    if (!amenity) throw new Error('Amenity not found');

    // Check duration limit
    if (amenity.maxDurationHours) {
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      if (durationHours > amenity.maxDurationHours) {
        throw new Error(`Booking exceeds maximum duration of ${amenity.maxDurationHours} hours`);
      }
    }

    // Check for overlaps (Simplified)
    const existing = await prisma.amenityBooking.findFirst({
      where: {
        amenityId,
        status: 'CONFIRMED',
        OR: [
          { startTime: { lt: endTime, gte: startTime } },
          { endTime: { gt: startTime, lte: endTime } }
        ]
      }
    });

    if (existing) throw new Error('Selected time slot is already booked');

    return prisma.amenityBooking.create({
      data: {
        amenityId,
        userId,
        startTime,
        endTime,
        status: 'CONFIRMED'
      }
    });
  }
};
