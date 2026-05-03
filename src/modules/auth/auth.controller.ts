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

// ─── Map module slugs to navigation items ──────────────────────────────────────
const ALL_NAV_ITEMS: Record<string, { label: string, route: string, icon: string }> = {
  'property': { label: 'Properties', route: 'property', icon: 'search' },
  'tenancies': { label: 'Tenancies', route: 'tenancies', icon: 'shield' },
  'agreements': { label: 'Agreements', route: 'agreements', icon: 'file-text' },
  'experts': { label: 'Experts', route: 'experts', icon: 'user' },
  'maintenance': { label: 'Maintenance', route: 'maintenance', icon: 'hammer' },
  'finance': { label: 'Payments', route: 'finance', icon: 'wallet' },
  'chat': { label: 'Chat', route: 'chat', icon: 'message-square' },
  'dispute': { label: 'Disputes', route: 'dispute', icon: 'alert-triangle' },
  'support': { label: 'Support', route: 'support', icon: 'help-circle' },
  'notices': { label: 'Notices', route: 'notices', icon: 'layout-grid' },
  'notifications': { label: 'Notifications', route: 'notifications', icon: 'bell' },
  'kyc': { label: 'KYC', route: 'kyc', icon: 'shield' },
  'exit': { label: 'Exit', route: 'exit', icon: 'file-text' },
  'society': { label: 'Society', route: 'society', icon: 'users' },
  'admin': { label: 'Admin Panel', route: 'admin', icon: 'layout-grid' },
  'profile': { label: 'Profile', route: 'profile', icon: 'settings' },
  'documents': { label: 'Documents', route: 'documents', icon: 'file-text' }
};

/**
 * Helper to consolidate all data a frontend needs for the dashboard
 */
async function getDashboardPayload(userId: string) {
  const user = await authService.getUserById(userId);
  const capabilities = await permissionService.getUserCapabilities(userId);
  
  const navigation: any[] = [];
  
  // Build navigation dynamically from capabilities
  for (const moduleSlug of capabilities.modules) {
    const slug = moduleSlug.toLowerCase();
    if (ALL_NAV_ITEMS[slug]) {
      navigation.push(ALL_NAV_ITEMS[slug]);
    }
  }

  // Always include profile if they are logged in, even if not explicitly in module list
  if (!navigation.find(n => n.route === 'profile')) {
    navigation.push(ALL_NAV_ITEMS['profile']);
  }

  // Always include Home/Dashboard at the very top for all roles
  if (!navigation.find(n => n.route === '')) {
    navigation.unshift({ label: 'Dashboard', route: '', icon: 'layout-dashboard' });
  }

  const token = authService.generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    user,
    token,
    uiConfig: {
      navigation,
      activeModules: capabilities.modules.map(id => ({ id, name: id })),
    },
    capabilities
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
