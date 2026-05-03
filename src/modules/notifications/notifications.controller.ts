import { Request, Response } from 'express';
import Joi from 'joi';
import { notificationsService } from './notifications.service';
import { NotificationType } from '@prisma/client';

const createSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  type: Joi.string().valid(...Object.values(NotificationType)).required(),
  title: Joi.string().min(2).max(200).required(),
  message: Joi.string().min(2).max(1000).required(),
  link: Joi.string().uri().optional(),
});

export const notificationsController = {
  async list(req: Request, res: Response) {
    try {
      const unreadOnly = req.query['unreadOnly'] === 'true';
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 50;

      const notifications = await notificationsService.list(req.user!.id, { unreadOnly, limit });
      res.json({ notifications });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async unreadCount(req: Request, res: Response) {
    try {
      const result = await notificationsService.unreadCount(req.user!.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async markRead(req: Request, res: Response) {
    try {
      const result = await notificationsService.markRead(req.user!.id, req.params['id']);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  async markAllRead(req: Request, res: Response) {
    try {
      const result = await notificationsService.markAllRead(req.user!.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const result = await notificationsService.delete(req.user!.id, req.params['id']);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  // Admin endpoint to push a notification to any user
  async create(req: Request, res: Response) {
    try {
      const { error, value } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const notification = await notificationsService.create(value);
      res.status(201).json({ notification });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
