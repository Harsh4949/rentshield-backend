import { propertyRepository, PropertySearchParams } from './property.repository';
import { Property, PropertyCategory, FurnishingStatus } from '@prisma/client';
import { redis } from '../../config/redis';
import { prisma } from '../../config/database';
import { AuthUser } from '../auth/auth.service';

const CACHE_TTL_SECONDS = 300; // Increased cache for search results

export const propertyService = {
  async createProperty(data: any, ownerId: string) {
    const created = await propertyRepository.create({
      ...data,
      owner: { connect: { id: ownerId } },
    });

    try {
      await redis.del('properties:list');
    } catch (e) {}

    return created;
  },

  async getProperty(id: string, userId?: string) {
    const property = await propertyRepository.findById(id);
    if (!property) return null;

    // Check if user has bookmarked this
    let isBookmarked = false;
    if (userId) {
      const b = await prisma.bookmark.findUnique({
        where: { userId_propertyId: { userId, propertyId: id } }
      });
      isBookmarked = !!b;
    }

    return { ...property, isBookmarked };
  },

  async listProperties(filters: PropertySearchParams, userId?: string) {
    // We don't cache filtered search results in Redis for now to ensure freshness,
    // only the global list usually.
    const records = await propertyRepository.list(filters);

    if (userId) {
      const bookmarks = await prisma.bookmark.findMany({
        where: { userId, propertyId: { in: records.map(r => r.id) } },
        select: { propertyId: true }
      });
      const bookmarkedIds = new Set(bookmarks.map(b => b.propertyId));
      return records.map(r => ({ ...r, isBookmarked: bookmarkedIds.has(r.id) }));
    }

    return records;
  },

  async updateProperty(id: string, data: Partial<Property>, user: AuthUser) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new Error('Property not found');
    if (property.ownerId !== user.id && user.role !== 'PLATFORM_ADMIN') {
      throw new Error('Unauthorized');
    }

    const updated = await propertyRepository.update(id, data);
    try {
      await redis.del(`property:${id}`);
      await redis.del('properties:list');
    } catch (e) {}

    return updated;
  },

  // ─── Interest & Bookmarks ──────────────────────────────────────

  async toggleBookmark(userId: string, propertyId: string) {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_propertyId: { userId, propertyId } }
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    } else {
      await prisma.bookmark.create({ data: { userId, propertyId } });
      return { bookmarked: true };
    }
  },

  async expressInterest(userId: string, propertyId: string, notes?: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    if (!property) throw new Error('Property not found');

    const interest = await prisma.propertyInterest.create({
      data: {
        tenantId: userId,
        propertyId,
        notes,
        status: 'PENDING'
      }
    });

    // Notify landlord
    await prisma.notification.create({
      data: {
        userId: property.ownerId,
        title: 'New Property Inquiry',
        message: `A tenant is interested in your property: ${property.title}`,
        type: 'IN_APP',
        link: `/landlord/properties/${propertyId}/interests`
      }
    });

    return interest;
  },

  async listInterests(userId: string, role: 'TENANT' | 'LANDLORD') {
    if (role === 'LANDLORD') {
      return prisma.propertyInterest.findMany({
        where: { property: { ownerId: userId } },
        include: {
          tenant: { select: { firstName: true, lastName: true, email: true } },
          property: { select: { title: true, address: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      return prisma.propertyInterest.findMany({
        where: { tenantId: userId },
        include: {
          property: { select: { title: true, address: true, city: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  async deleteProperty(id: string, user: AuthUser) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new Error('Property not found');
    if (property.ownerId !== user.id && user.role !== 'PLATFORM_ADMIN') {
      throw new Error('Unauthorized');
    }

    await propertyRepository.delete(id);
    try {
      await redis.del(`property:${id}`);
      await redis.del('properties:list');
    } catch (e) {}

    return { message: 'Property deleted successfully' };
  }
};
