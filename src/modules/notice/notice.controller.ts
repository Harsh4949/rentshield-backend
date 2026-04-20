import { Request, Response } from 'express';
import Joi from 'joi';
import { noticeService } from './notice.service';

const createNoticeSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  type: Joi.string().valid('INFO', 'WARNING', 'URGENT').default('INFO'),
  category: Joi.string().optional(),
  isPinned: Joi.boolean().default(false),
  expiryDate: Joi.date().iso().optional(),
  societyId: Joi.string().uuid().optional(),
  buildingId: Joi.string().uuid().optional(),
});

export const noticeController = {
  async createNotice(req: Request, res: Response) {
    try {
      const { error, value } = createNoticeSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const notice = await noticeService.createNotice({
        ...value,
        createdById: req.user!.id
      });

      res.status(201).json({ notice });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async listNotices(req: Request, res: Response) {
    try {
      const notices = await noticeService.listNoticesForUser(req.user!.id);
      res.json({ notices });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getNotice(req: Request, res: Response) {
    try {
      const notice = await noticeService.getNoticeDetails(req.params.id);
      if (!notice) return res.status(404).json({ error: 'Notice not found' });
      res.json({ notice });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async markAsRead(req: Request, res: Response) {
    try {
      await noticeService.markAsRead(req.user!.id, req.params.id);
      res.json({ success: true, message: 'Notice marked as read' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
};
