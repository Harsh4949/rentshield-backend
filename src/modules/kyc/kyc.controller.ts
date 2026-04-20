import { Request, Response } from 'express';
import { kycService } from './kyc.service';

export const kycController = {
  async getStatus(req: Request, res: Response) {
    const userId = req.user!.id;
    const status = await kycService.getStatus(userId);
    res.json({ status });
  },

  async start(req: Request, res: Response) {
    const userId = req.user!.id;
    await kycService.start(userId);
    res.json({ message: 'KYC process started' });
  },

  async uploadDocument(req: Request, res: Response) {
    const userId = req.user!.id;
    const { type, fileUrl } = req.body; // For now, assume fileUrl is provided
    await kycService.uploadDocument(userId, type, fileUrl);
    res.json({ message: 'Document uploaded' });
  },

  async submit(req: Request, res: Response) {
    const userId = req.user!.id;
    await kycService.submit(userId);
    res.json({ message: 'KYC submitted for review' });
  },

  async getQueue(req: Request, res: Response) {
    const queue = await kycService.getQueue();
    res.json(queue);
  },

  async review(req: Request, res: Response) {
    const { id } = req.params;
    const { decision, notes } = req.body;
    const reviewerId = req.user!.id;
    await kycService.review(id, decision, notes, reviewerId);
    res.json({ message: 'KYC reviewed' });
  },
};