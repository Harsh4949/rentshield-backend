import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  async getTenantDashboard(req: Request, res: Response) {
    const userId = req.user!.id;
    const data = await dashboardService.getTenantDashboard(userId);
    res.json(data);
  },
};