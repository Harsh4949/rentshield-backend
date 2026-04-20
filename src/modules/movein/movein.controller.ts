import { Request, Response } from 'express';
import Joi from 'joi';
import { moveInService } from './movein.service';

const scheduleSchema = Joi.object({
  tenancyId: Joi.string().uuid().required(),
  scheduledAt: Joi.date().iso().required(),
  notes: Joi.string().optional(),
});

const checklistUpdateSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'COMPLETED', 'FLAGGED').required(),
  notes: Joi.string().optional(),
});

const inspectionItemSchema = Joi.object({
  room: Joi.string().required(),
  itemName: Joi.string().required(),
  condition: Joi.string().valid('GOOD', 'FAIR', 'DAMAGED').required(),
  notes: Joi.string().optional(),
  photoUrls: Joi.array().items(Joi.string()).optional(),
});

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').required(),
});

export const moveInController = {
  async scheduleMoveIn(req: Request, res: Response) {
    try {
      const { error, value } = scheduleSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const moveIn = await moveInService.scheduleMoveIn(req.user!.id, value.tenancyId, new Date(value.scheduledAt), value.notes);
      res.status(201).json({ moveIn });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async getMoveIn(req: Request, res: Response) {
    try {
      const moveIn = await moveInService.getMoveIn(req.params.tenancyId);
      res.json({ moveIn });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  async updateChecklistItem(req: Request, res: Response) {
    try {
      const { error, value } = checklistUpdateSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const item = await moveInService.updateChecklistItem(req.params.moveInId, req.params.itemId, value);
      res.json({ item });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async addInspectionItem(req: Request, res: Response) {
    try {
      const { error, value } = inspectionItemSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      // Mock photo storage
      if (req.body.mockPhotos) {
        value.photoUrls = (req.body.mockPhotos as string[]).map(
          (_, i) => `https://mock-storage.rentshield.local/movein/${req.params.moveInId}_photo_${Date.now()}_${i}.jpg`
        );
      }

      const item = await moveInService.addInspectionItem(req.params.moveInId, value);
      res.status(201).json({ item });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { error, value } = statusUpdateSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const moveIn = await moveInService.updateMoveInStatus(req.params.moveInId, value.status);
      res.json({ moveIn });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async completeMoveIn(req: Request, res: Response) {
    try {
      const moveIn = await moveInService.completeMoveIn(req.params.moveInId);
      res.json({ moveIn, message: 'Move-in completed and signed off successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
