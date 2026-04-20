import { Request, Response } from 'express';
import Joi from 'joi';
import { tenantService } from './tenant.service';

export const tenantController = {
  async getDashboard(req: Request, res: Response) {
    try {
      const summary = await tenantService.getDashboardSummary(req.user!.id);
      res.json({ summary });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async listTenancies(req: Request, res: Response) {
    try {
      const tenancies = await tenantService.listTenancies(req.user!.id);
      res.json({ tenancies });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getTenancyDetails(req: Request, res: Response) {
    try {
      const tenancy = await tenantService.getTenancyDetails(req.user!.id, req.params.id);
      res.json({ tenancy });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },


};
