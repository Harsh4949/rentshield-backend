import { Request, Response } from 'express';
import Joi from 'joi';
import { chatService } from './chat.service';

const createSessionSchema = Joi.object({
  targetType: Joi.string().valid('TENANCY', 'MAINTENANCE').required(),
  targetId: Joi.string().uuid().required()
});

export const chatController = {
  async createSession(req: Request, res: Response) {
    try {
      const { error, value } = createSessionSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const session = await chatService.createSession(req.user!.id, value.targetType, value.targetId);
      res.status(201).json({ session });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async listSessions(req: Request, res: Response) {
    try {
      const sessions = await chatService.listSessions(req.user!.id);
      res.json({ sessions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getMessages(req: Request, res: Response) {
    try {
      const messages = await chatService.getMessages(req.user!.id, req.params.sessionId);
      res.json({ messages });
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  }
};
