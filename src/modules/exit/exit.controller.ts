import { Request, Response } from 'express';
import Joi from 'joi';
import { exitService } from './exit.service';

const requestExitSchema = Joi.object({
  tenancyId: Joi.string().uuid().required(),
  desiredMoveOutDate: Joi.date().iso().required(),
  reason: Joi.string().required(),
  comments: Joi.string().optional(),
});

const reviewSchema = Joi.object({
  status: Joi.string().valid('APPROVED', 'REJECTED', 'DATE_PROPOSED').required(),
  landlordNotes: Joi.string().optional(),
  alternateDate: Joi.date().iso().optional(),
});

const inspectionSchema = Joi.object({
  room: Joi.string().required(),
  itemName: Joi.string().required(),
  moveInCondition: Joi.string().valid('GOOD', 'FAIR', 'DAMAGED').required(),
  moveOutCondition: Joi.string().valid('GOOD', 'FAIR', 'DAMAGED').required(),
  proposedCharge: Joi.number().min(0).optional(),
  notes: Joi.string().optional(),
  mockPhotos: Joi.array().items(Joi.string()).optional(),
});

export const exitController = {
  async requestExit(req: Request, res: Response) {
    try {
      const { error, value } = requestExitSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const exit = await exitService.requestExit(req.user!.id, { ...value, desiredMoveOutDate: new Date(value.desiredMoveOutDate) });
      res.status(201).json({ exitRequest: exit });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async getExitRequest(req: Request, res: Response) {
    try {
      const exit = await exitService.getExitRequest(req.params.tenancyId);
      res.json({ exitRequest: exit });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  async reviewExitRequest(req: Request, res: Response) {
    try {
      const { error, value } = reviewSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const exit = await exitService.reviewExitRequest(req.user!.id, req.params.id, {
        ...value,
        alternateDate: value.alternateDate ? new Date(value.alternateDate) : undefined,
      });
      res.json({ exitRequest: exit });
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  },

  async addInspectionItem(req: Request, res: Response) {
    try {
      const { error, value } = inspectionSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      if (value.mockPhotos) {
        value.photoUrls = (value.mockPhotos as string[]).map(
          (_, i) => `https://mock-storage.rentshield.local/exit/${req.params.id}_photo_${Date.now()}_${i}.jpg`
        );
        delete value.mockPhotos;
      }

      const item = await exitService.addInspectionItem(req.params.id, value);
      res.status(201).json({ item });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async generateSettlement(req: Request, res: Response) {
    try {
      const settlement = await exitService.generateSettlement(req.params.id);
      res.json({ settlement });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async acceptSettlement(req: Request, res: Response) {
    try {
      const role = req.user!.role === 'TENANT' ? 'tenant' : 'landlord';
      const settlement = await exitService.acceptSettlement(req.user!.id, req.params.id, role);
      res.json({ settlement, message: 'Settlement acceptance recorded' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
