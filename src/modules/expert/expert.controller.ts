import { Request, Response } from 'express';
import Joi from 'joi';
import { expertService } from './expert.service';

const bookingSchema = Joi.object({
  description: Joi.string().min(10).required(),
  scheduledAt: Joi.date().iso().required()
});

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().optional()
});

export const expertController = {
  async listExperts(req: Request, res: Response) {
    try {
      const filters = {
        categoryId: req.query.category as string,
        city: req.query.city as string,
        isVerified: req.query.verified === 'true' ? true : undefined,
        q: req.query.q as string
      };
      const experts = await expertService.listExperts(filters);
      res.json(experts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getExpert(req: Request, res: Response) {
    try {
      const expert = await expertService.getExpertDetail(req.params.id);
      if (!expert) return res.status(404).json({ error: 'Expert not found' });
      res.json(expert);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async createBooking(req: Request, res: Response) {
    try {
      const { error, value } = bookingSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const booking = await expertService.createBooking(req.user!.id, req.params.id, value);
      res.status(201).json(booking);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async listBookings(req: Request, res: Response) {
    try {
      const bookings = await expertService.getBookings(req.user!.id, req.user!.role);
      res.json(bookings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateBookingStatus(req: Request, res: Response) {
    try {
      const { status, finalPrice } = req.body;
      const booking = await expertService.updateBookingStatus(req.user!.id, req.params.id, status, finalPrice);
      res.json(booking);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async addReview(req: Request, res: Response) {
    try {
      const { error, value } = reviewSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const review = await expertService.addReview(req.user!.id, req.params.id, value.rating, value.comment);
      res.status(201).json(review);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async listCategories(req: Request, res: Response) {
    try {
      const categories = await expertService.listCategories();
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};
