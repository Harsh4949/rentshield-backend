import { Request, Response, NextFunction } from 'express';
import { permissionService } from '../../core/permissions/permission.service';

export const requireFeature = (featureName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const allowed = await permissionService.canUserAccess(req.user.id, featureName);
      if (!allowed) {
        return res.status(403).json({ error: 'Feature disabled or access denied' });
      }
      return next();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };
};
