import { Request, Response } from 'express';
import { paymentsService } from './payments.service';
import Joi from 'joi';

const initiatePaymentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional()
});

export const paymentsController = {
  async triggerMonthlyBilling(req: Request, res: Response) {
    try {
      const result = await paymentsService.triggerMonthlyBilling();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async createPlan(req: Request, res: Response) {
    try {
      const plan = await paymentsService.createPlan(req.body);
      res.status(201).json(plan);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async getDue(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const dues = await paymentsService.getDue(userId);
      res.json(dues);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async initiatePayment(req: Request, res: Response) {
    try {
      const { error, value } = initiatePaymentSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { id } = req.params;
      const userId = req.user!.id;
      
      const result = await paymentsService.initiatePayment(id, userId, value.amount);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async getLedger(req: Request, res: Response) {
    try {
      const { tenancyId } = req.params;
      const ledger = await paymentsService.getLedger(tenancyId);
      res.json(ledger);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async downloadReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const filePath = await paymentsService.generateReceiptPdf(id);
      
      res.download(filePath, (err) => {
        if (err) {
          console.error('Download error:', err);
          if (!res.headersSent) res.status(500).json({ error: 'Failed to download receipt' });
        }
      });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }
};