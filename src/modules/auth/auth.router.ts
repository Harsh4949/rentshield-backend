import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticateToken } from '../../shared/middleware/auth';

export const authRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Identity & KYC
 *   description: User registration, 2FA security, and profile management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new account and log in immediately
 *     tags: [Identity & KYC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               role: { type: string, enum: [TENANT, LANDLORD, SERVICE_PROVIDER], default: TENANT }
 *     responses:
 *       201:
 *         description: Onboarding complete. Returns full token and dashboard state.
 */
authRouter.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Initiate login (Stage 1)
 *     tags: [Identity & KYC]
 *     description: Validates password and triggers OTP send. Returns a temporary Pre-Auth token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Credentials valid. Proceed to 2FA verification.
 */
authRouter.post('/login', authController.login);

/**
 * @swagger
 * /auth/verify-2fa:
 *   post:
 *     summary: Verify OTP (Stage 2)
 *     tags: [Identity & KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Verified. Returns final Access Token and dashboard data.
 */
authRouter.post('/verify-2fa', authenticateToken, authController.verify2fa);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile and dashboard stats
 *     tags: [Identity & KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full identity payload
 */
authRouter.get('/profile', authenticateToken, authController.getProfile);

/**
 * @swagger
 * /auth/settings:
 *   patch:
 *     summary: Update user settings (Name, Password, etc.)
 *     tags: [Identity & KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Settings updated }
 */
authRouter.patch('/settings', authenticateToken, authController.updateSettings);

/**
 * @swagger
 * /auth/capabilities:
 *   get:
 *     summary: Get user capabilities
 *     tags: [Identity & KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permission map
 */
authRouter.get('/capabilities', authenticateToken, authController.getCapabilities);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset code
 *     tags: [Identity & KYC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses: { 200: { description: Reset code sent } }
 */
authRouter.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Identity & KYC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses: { 200: { description: Password reset successful } }
 */
authRouter.post('/reset-password', authController.resetPassword);