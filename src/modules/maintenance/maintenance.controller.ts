import { Request, Response } from 'express';
import Joi from 'joi';
import { maintenanceService } from './maintenance.service';
import { MaintenanceStatus } from '@prisma/client';

const createSchema = Joi.object({
  tenancyId: Joi.string().uuid().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED').required(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').optional(),
});

export const maintenanceController = {
  // Tenant endpoints
  async createRequest(req: Request, res: Response) {
    try {
      if (req.user!.role !== 'TENANT') {
         return res.status(403).json({ error: 'Only tenants can create maintenance requests' });
      }

      const { error, value } = createSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const request = await maintenanceService.createMaintenanceRequest(req.user!.id, value);
      res.status(201).json({ maintenanceRequest: request });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async listTenantRequests(req: Request, res: Response) {
    try {
      const requests = await maintenanceService.listMaintenanceRequestsForTenant(
        req.user!.id, 
        req.query.tenancyId as string
      );
      res.json({ maintenanceRequests: requests });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Landlord endpoints
  async listLandlordRequests(req: Request, res: Response) {
    try {
      const requests = await maintenanceService.listMaintenanceRequestsForLandlord(
        req.user!.id,
        req.query.propertyId as string
      );
      res.json({ maintenanceRequests: requests });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { error, value } = updateStatusSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const isSupportAgent = req.user!.role === 'SUPPORT_AGENT';
      const request = await maintenanceService.updateMaintenanceStatus(
        req.user!.id,
        req.params.id,
        value as { status: MaintenanceStatus; priority?: string },
        isSupportAgent
      );
      
      res.json({ maintenanceRequest: request });
    } catch (error: any) {
      res.status(403).json({ error: error.message });
    }
  }
};
