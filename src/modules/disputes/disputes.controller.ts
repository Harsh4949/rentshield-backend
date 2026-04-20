import { Request, Response } from 'express';
import Joi from 'joi';
import { disputesService } from './disputes.service';

const createDisputeSchema = Joi.object({
  tenancyId: Joi.string().uuid().required(),
  categoryId: Joi.string().valid('RENT_PAYMENT', 'MAINTENANCE', 'DEPOSIT', 'EXIT', 'OTHER').required(),
  description: Joi.string().required(),
  paymentId: Joi.string().uuid().optional(),
  maintenanceRequestId: Joi.string().uuid().optional(),
});

const addEventSchema = Joi.object({
  eventType: Joi.string().valid('MESSAGE', 'PROPOSAL', 'DECISION', 'CLOSED').required(),
  details: Joi.object().required(),
  evidenceFile: Joi.any().optional(), // In reality this would be handled by multer / multipart, we use mock storage.
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'UNDER_REVIEW', 'MEDIATION', 'RESOLVED', 'ESCALATED', 'CLOSED').required(),
});

export const disputesController = {
  async createDispute(req: Request, res: Response) {
    try {
      if (req.user!.role !== 'TENANT') {
        return res.status(403).json({ error: 'Only tenants can create disputes initially' });
      }

      const { error, value } = createDisputeSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      // Mock Evidence Upload: Map any provided evidenceUrls from a client to our structured array
      const evidenceUrls = req.body.evidenceFiles ? req.body.evidenceFiles.map((file: any) => `https://mock-storage.rentshield.local/${Date.now()}_evidence.png`) : [];

      const dispute = await disputesService.createDispute({
        tenantId: req.user!.id,
        tenancyId: value.tenancyId,
        categoryId: value.categoryId,
        description: value.description,
        paymentId: value.paymentId,
        maintenanceRequestId: value.maintenanceRequestId,
        evidenceUrls
      });

      res.status(201).json({ dispute });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async listDisputes(req: Request, res: Response) {
    try {
      const disputes = await disputesService.listUserDisputes(req.user!.id);
      res.json({ disputes });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getDisputeDetails(req: Request, res: Response) {
    try {
      const isSupportAgent = ['SUPPORT_AGENT', 'PLATFORM_ADMIN'].includes(req.user!.role);
      const dispute = await disputesService.getDisputeDetails(req.user!.id, req.params.id, isSupportAgent);
      res.json({ dispute });
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  },

  async addEvent(req: Request, res: Response) {
    try {
      const { error, value } = addEventSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const isSupportAgent = ['SUPPORT_AGENT', 'PLATFORM_ADMIN'].includes(req.user!.role);
      
      // Handle mock file upload
      if (value.evidenceFile) {
         value.details.mockFileUrl = `https://mock-storage.rentshield.local/${Date.now()}_added_evidence.png`;
      }

      const event = await disputesService.addEvent(
        req.user!.id,
        req.params.id,
        value.eventType,
        value.details,
        isSupportAgent
      );
      
      res.status(201).json({ event });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { error, value } = updateStatusSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const dispute = await disputesService.updateStatus(req.params.id, value.status);
      res.json({ dispute });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
};
