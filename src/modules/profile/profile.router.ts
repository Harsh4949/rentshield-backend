import { Router } from 'express';
import { profileController } from './profile.controller';
import { authenticateToken } from '../../shared/middleware/auth';

export const profileRouter = Router();

// All profile routes require authentication
profileRouter.use(authenticateToken);

/**
 * GET /api/profile
 * Returns the authenticated user's full profile
 */
profileRouter.get('/', profileController.getProfile);

/**
 * PATCH /api/profile
 * Update name fields
 */
profileRouter.patch('/', profileController.updateProfile);

/**
 * POST /api/profile/change-password
 * Change the user's password (requires currentPassword)
 */
profileRouter.post('/change-password', profileController.changePassword);

/**
 * PATCH /api/profile/2fa
 * Enable or disable 2FA
 */
profileRouter.patch('/2fa', profileController.toggle2fa);
