import { Request, Response } from 'express';
import Joi from 'joi';
import { propertyService } from './property.service';

const createPropertySchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  address: Joi.string().min(5).required(),
  city: Joi.string().min(2).required(),
  state: Joi.string().min(2).required(),
  postalCode: Joi.string().min(3).required(),
  price: Joi.number().integer().min(0).required(),
  bedrooms: Joi.number().integer().min(0).required(),
  bathrooms: Joi.number().min(0).required(),
  isPublished: Joi.boolean().optional(),
  category: Joi.string().valid('APARTMENT', 'VILLA', 'INDEPENDENT_HOUSE', 'PG', 'OFFICE', 'SHOP').optional(),
  furnishing: Joi.string().valid('UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED').optional(),
  photoUrls: Joi.array().items(Joi.string().uri()).optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  availableFrom: Joi.date().iso().optional(),
});

const updatePropertySchema = createPropertySchema.fork(
  Object.keys(createPropertySchema.describe().keys),
  (schema) => schema.optional()
);

export const propertyController = {
  async create(req: Request, res: Response) {
    try {
      const { error, value } = createPropertySchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const created = await propertyService.createProperty(value, req.user!.id);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const property = await propertyService.getProperty(req.params.id, req.user?.id);
      if (!property) return res.status(404).json({ error: 'Property not found' });
      res.json(property);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const filters: any = {
        q: req.query.q as string,
        city: req.query.city as string,
        minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
        bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms as string) : undefined,
        bathrooms: req.query.bathrooms ? parseFloat(req.query.bathrooms as string) : undefined,
        category: req.query.category as any,
        furnishing: req.query.furnishing as any,
        lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
        lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
        radiusKm: req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined,
      };

      if (req.query.my === 'true' && req.user) {
        filters.ownerId = req.user.id;
      } else {
        filters.isPublished = true;
      }

      const properties = await propertyService.listProperties(filters, req.user?.id);
      res.json(properties);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { error, value } = updatePropertySchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const updated = await propertyService.updateProperty(req.params.id, value, req.user!);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async toggleBookmark(req: Request, res: Response) {
    try {
      const result = await propertyService.toggleBookmark(req.user!.id, req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async expressInterest(req: Request, res: Response) {
    try {
      const interest = await propertyService.expressInterest(req.user!.id, req.params.id, req.body.notes);
      res.status(201).json(interest);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async listInterests(req: Request, res: Response) {
    try {
      const role = req.user!.role === 'TENANT' ? 'TENANT' : 'LANDLORD';
      const interests = await propertyService.listInterests(req.user!.id, role);
      res.json(interests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const result = await propertyService.deleteProperty(req.params.id, req.user!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
