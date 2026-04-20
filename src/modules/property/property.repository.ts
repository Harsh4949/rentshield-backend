import { prisma } from '../../config/database';
import { Property, Prisma, PropertyCategory, FurnishingStatus } from '@prisma/client';

export interface PropertySearchParams {
  q?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  category?: PropertyCategory;
  furnishing?: FurnishingStatus;
  ownerId?: string;
  isPublished?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export const propertyRepository = {
  async create(data: Prisma.PropertyCreateInput): Promise<Property> {
    return prisma.property.create({ data });
  },

  async findById(id: string): Promise<Property | null> {
    return prisma.property.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        society: true,
        building: true
      }
    });
  },

  async list(filters?: PropertySearchParams): Promise<Property[]> {
    const where: Prisma.PropertyWhereInput = {};

    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters?.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    if (filters?.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.furnishing) {
      where.furnishing = filters.furnishing;
    }

    if (filters?.bedrooms) {
      where.bedrooms = { gte: filters.bedrooms };
    }

    if (filters?.bathrooms) {
      where.bathrooms = { gte: filters.bathrooms };
    }

    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {
        gte: filters.minPrice,
        lte: filters.maxPrice
      };
    }

    if (filters?.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { address: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    // Geo Bounding Box (Rough approximation for radius)
    if (filters?.lat && filters?.lng && filters?.radiusKm) {
      const latDelta = filters.radiusKm / 111.32; // 1 degree lat is ~111.32km
      const lngDelta = filters.radiusKm / (111.32 * Math.cos(filters.lat * (Math.PI / 180)));

      where.lat = {
        gte: filters.lat - latDelta,
        lte: filters.lat + latDelta
      };
      where.lng = {
        gte: filters.lng - lngDelta,
        lte: filters.lng + lngDelta
      };
    }

    return prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        society: { select: { id: true, name: true } },
        building: { select: { id: true, name: true } }
      }
    });
  },

  async update(id: string, data: Prisma.PropertyUpdateInput): Promise<Property> {
    return prisma.property.update({
      where: { id },
      data,
      include: { owner: { select: { id: true, firstName: true, lastName: true, email: true } } }
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.property.delete({ where: { id } });
  },
};
