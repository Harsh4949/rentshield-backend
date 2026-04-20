import { Request, Response } from 'express';
import Joi from 'joi';
import { supportService } from './support.service';

const createTicketSchema = Joi.object({
  topic: Joi.string().required(),
  description: Joi.string().required(),
});

const addMessageSchema = Joi.object({
  content: Joi.string().required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED').required(),
  assigneeId: Joi.string().uuid().optional(),
});

const csatSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().optional(),
});

const createKbSchema = Joi.object({
  title: Joi.string().required(),
  slug: Joi.string().required(),
  category: Joi.string().required(),
  content: Joi.string().required(),
  isPublished: Joi.boolean().optional(),
});

const isAgent = (req: Request) => ['SUPPORT_AGENT', 'PLATFORM_ADMIN'].includes(req.user!.role);

export const supportController = {
  // ─── KB ────────────────────────────────────────────────────────
  async searchKb(req: Request, res: Response) {
    try {
      const articles = await supportService.searchKbArticles(
        req.query.q as string,
        req.query.category as string,
      );
      res.json({ articles });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getKbArticle(req: Request, res: Response) {
    try {
      const article = await supportService.getKbArticleBySlug(req.params.slug);
      res.json({ article });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  async voteKbArticle(req: Request, res: Response) {
    try {
      const helpful = req.body.helpful === true || req.body.helpful === 'true';
      await supportService.voteKbArticle(req.params.id, helpful);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async createKbArticle(req: Request, res: Response) {
    try {
      const { error, value } = createKbSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const article = await supportService.createKbArticle(value);
      res.status(201).json({ article });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async updateKbArticle(req: Request, res: Response) {
    try {
      const article = await supportService.updateKbArticle(req.params.id, req.body);
      res.json({ article });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  // ─── Tickets ───────────────────────────────────────────────────
  async createTicket(req: Request, res: Response) {
    try {
      const { error, value } = createTicketSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const ticket = await supportService.createTicket(req.user!.id, value);
      res.status(201).json({ ticket });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async listTickets(req: Request, res: Response) {
    try {
      const tickets = await supportService.listUserTickets(req.user!.id);
      res.json({ tickets });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTicketDetails(req: Request, res: Response) {
    try {
      const ticket = await supportService.getTicketDetails(req.user!.id, req.params.id, isAgent(req));
      res.json({ ticket });
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  },

  async addMessage(req: Request, res: Response) {
    try {
      const { error, value } = addMessageSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const message = await supportService.addMessage(req.user!.id, req.params.id, value.content, isAgent(req));
      res.status(201).json({ message });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { error, value } = updateStatusSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const ticket = await supportService.updateTicketStatus(req.params.id, value.status, value.assigneeId);
      res.json({ ticket });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async submitCsat(req: Request, res: Response) {
    try {
      const { error, value } = csatSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const csat = await supportService.submitCsat(req.user!.id, req.params.id, value.rating, value.comment);
      res.status(201).json({ csat });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
