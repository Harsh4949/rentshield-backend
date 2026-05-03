import { Request, Response } from 'express';
import Joi from 'joi';
import { adminService } from './admin.service';
import { UserRole, KycStatus } from '@prisma/client';

const toggleModuleSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

const createModuleSchema = Joi.object({
  name: Joi.string().required(),
  label: Joi.string().optional(),
});

const updateModuleSchema = Joi.object({
  name: Joi.string().optional(),
  label: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

const createFeatureSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  moduleId: Joi.string().uuid().required(),
});

const updateFeatureSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
});

const assignFeatureSchema = Joi.object({
  featureId: Joi.string().uuid().required(),
});

const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid(...Object.values(UserRole)).required(),
});

const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

const reviewKycSchema = Joi.object({
  status: Joi.string().valid(...Object.values(KycStatus)).required(),
  notes: Joi.string().optional().allow(''),
});

export const adminController = {
  async listModules(req: Request, res: Response) {
    try {
      const modules = await adminService.listModules();
      res.json({ modules });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async toggleModule(req: Request, res: Response) {
    try {
      const { error, value } = toggleModuleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const moduleId = req.params.id;
      const updated = await adminService.toggleModule(moduleId, value.isActive);
      res.json({ module: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async createModule(req: Request, res: Response) {
    try {
      const { error, value } = createModuleSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const module = await adminService.createModule(value);
      res.status(201).json({ module });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateModule(req: Request, res: Response) {
    try {
      const { error, value } = updateModuleSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const module = await adminService.updateModule(req.params.id, value);
      res.json({ module });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteModule(req: Request, res: Response) {
    try {
      const result = await adminService.deleteModule(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Feature Management
  async listFeatures(req: Request, res: Response) {
    try {
      const features = await adminService.listFeatures(req.query.moduleId as string);
      res.json({ features });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async createFeature(req: Request, res: Response) {
    try {
      const { error, value } = createFeatureSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const feature = await adminService.createFeature(value);
      res.status(201).json({ feature });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteFeature(req: Request, res: Response) {
    try {
      const result = await adminService.deleteFeature(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateFeature(req: Request, res: Response) {
    try {
      const { error, value } = updateFeatureSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const feature = await adminService.updateFeature(req.params.id, value);
      res.json({ feature });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Role Management
  async listRoleFeatures(req: Request, res: Response) {
    try {
      const roleFeatures = await adminService.listRoleFeatures(req.query.role as UserRole);
      res.json({ roleFeatures });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async assignFeatureToRole(req: Request, res: Response) {
    try {
      const { error, value } = assignFeatureSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const roleFeature = await adminService.assignFeatureToRole(req.params.role as UserRole, value.featureId);
      res.status(201).json({ roleFeature });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async revokeFeatureFromRole(req: Request, res: Response) {
    try {
      const result = await adminService.revokeFeatureFromRole(req.params.role as UserRole, req.params.featureId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // User Management
  async listUsers(req: Request, res: Response) {
    try {
      const { role, isActive } = req.query;
      const users = await adminService.listUsers({
        role: role as UserRole,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });
      res.json({ users });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateUserRole(req: Request, res: Response) {
    try {
      const { error, value } = updateUserRoleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      const updated = await adminService.updateUserRole(req.params.id, value.role);
      res.json({ user: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateUserStatus(req: Request, res: Response) {
    try {
      const { error, value } = updateUserStatusSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      const updated = await adminService.updateUserStatus(req.params.id, value.isActive);
      res.json({ user: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateUser(req: Request, res: Response) {
    try {
      const updated = await adminService.updateUser(req.params.id, req.body);
      res.json({ user: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteUser(req: Request, res: Response) {
    try {
      const result = await adminService.deleteUser(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // KYC Management
  async listKyc(req: Request, res: Response) {
    try {
      const submissions = await adminService.listKycSubmissions(req.query.status as KycStatus);
      res.json({ submissions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async reviewKyc(req: Request, res: Response) {
    try {
      const { error, value } = reviewKycSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      const updated = await adminService.reviewKyc(
        req.params.id,
        value.status,
        value.notes,
        (req as any).user?.id
      );
      res.json({ kyc: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Property Management
  async listProperties(req: Request, res: Response) {
    try {
      const properties = await adminService.listAllProperties();
      res.json({ properties });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async togglePropertyPublish(req: Request, res: Response) {
    try {
      const { isActive } = req.body;
      const updated = await adminService.togglePropertyPublish(req.params.id, !!isActive);
      res.json({ property: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateProperty(req: Request, res: Response) {
    try {
      const updated = await adminService.updateProperty(req.params.id, req.body);
      res.json({ property: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteProperty(req: Request, res: Response) {
    try {
      const result = await adminService.deleteProperty(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Stats
  async getStats(req: Request, res: Response) {
    try {
      const stats = await adminService.getSystemStats();
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Role Permissions Matrix
  async getRolePermissionsMatrix(req: Request, res: Response) {
    try {
      const data = await adminService.getRolePermissionsMatrix();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Seed default modules
  async seedDefaultModules(req: Request, res: Response) {
    try {
      const result = await adminService.seedDefaultModules();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};
