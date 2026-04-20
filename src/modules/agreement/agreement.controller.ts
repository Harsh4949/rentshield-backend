import { Request, Response } from 'express';
import { agreementService } from './agreement.service';

export const agreementController = {
  async listTemplates(req: Request, res: Response) {
    try {
      const { state } = req.query;
      const templates = await agreementService.listTemplates(state as string);
      res.json(templates);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async generate(req: Request, res: Response) {
    try {
      const { tenancyId, templateId } = req.body;
      const agreement = await agreementService.generateAgreement(tenancyId, templateId);
      res.status(201).json(agreement);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async sign(req: Request, res: Response) {
    try {
      const { agreementId, type, signatureData } = req.body;
      const signature = await agreementService.signAgreement(req.user!.id, agreementId, type, signatureData);
      res.status(201).json(signature);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async stamp(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const agreement = await agreementService.applyStamping(id);
      res.json(agreement);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
};
