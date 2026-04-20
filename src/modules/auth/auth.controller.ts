import { Request, Response } from 'express';
import Joi from 'joi';
import { authService, RegisterData, LoginData } from './auth.service';
import { permissionService } from '../../core/permissions/permission.service';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().min(2).required(),
  role: Joi.string().valid('TENANT', 'LANDLORD','SERVICE_PROVIDER', 'SOCIETY_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * Helper to consolidate all data a frontend needs for the dashboard
 */
async function getDashboardPayload(userId: string) {
  const user = await authService.getUserById(userId);
  const capabilities = await permissionService.getUserCapabilities(userId);
  
  const navigation: any[] = [];
  if (user.role === 'TENANT') {
    navigation.push({ label: 'Dashboard', route: '/tenant/dashboard', icon: 'dashboard' });
    navigation.push({ label: 'My Rent', route: '/tenant/payments', icon: 'payment' });
    navigation.push({ label: 'Marketplace', route: '/tenant/experts', icon: 'build' });
    navigation.push({ label: 'Documents', route: '/tenant/documents', icon: 'folder' });
  } else if (user.role === 'PLATFORM_ADMIN') {
    navigation.push({ label: 'Admin Panel', route: '/admin/dashboard', icon: 'admin_panel_settings' });
    navigation.push({ label: 'Module Control', route: '/admin/modules', icon: 'settings' });
  }

  const token = authService.generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    user,
    token,
    capabilities,
    uiConfig: {
      navigation,
      activeModules: capabilities.modules,
    }
  };
}

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { user } = await authService.register(value as RegisterData);
      const payload = await getDashboardPayload(user.id);

      res.status(201).json({
        message: 'User registered & logged in successfully',
        ...payload
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const result = await authService.login(value as LoginData);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  },

  async verify2fa(req: Request, res: Response) {
    try {
      const { code } = req.body;
      // req.user comes from Pre-Auth Token middleware
      const user = await authService.verifyOtp(req.user!.id, code, 'LOGIN');
      const payload = await getDashboardPayload(user.id);

      res.json({
        message: '2FA verified successfully',
        ...payload
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateSettings(req: Request, res: Response) {
    try {
      const user = await authService.updateSettings(req.user!.id, req.body);
      res.json({ message: 'Settings updated', user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getProfile(req: Request, res: Response) {
    try {
      const payload = await getDashboardPayload(req.user!.id);
      res.json(payload);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },

  async getCapabilities(req: Request, res: Response) {
    try {
      const capabilities = await permissionService.getUserCapabilities(req.user!.id);
      res.json({ capabilities });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { email, code, newPassword } = req.body;
      await authService.resetPassword(email, code, newPassword);
      res.json({ message: 'Password reset successful' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};