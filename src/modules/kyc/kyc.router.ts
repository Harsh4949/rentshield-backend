import { Router } from 'express';
import { kycController } from './kyc.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';
import { requireFeature } from '../../shared/middleware/feature';
import { FEATURES } from '../../core/permissions/permission.constants';

export const kycRouter = Router();

kycRouter.use(authenticateToken);

/**
 * @swagger
 * /kyc/status:
 *   get:
 *     summary: Get KYC status
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC status
 */
kycRouter.get('/status', kycController.getStatus);

/**
 * @swagger
 * /kyc/start:
 *   post:
 *     summary: Start KYC process
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC started
 */
kycRouter.post('/start', requireFeature(FEATURES.SUBMIT_KYC), kycController.start);

/**
 * @swagger
 * /kyc/upload:
 *   post:
 *     summary: Upload KYC documents
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Document uploaded
 */
kycRouter.post('/upload', requireFeature(FEATURES.SUBMIT_KYC), kycController.uploadDocument);

/**
 * @swagger
 * /kyc/submit:
 *   post:
 *     summary: Submit KYC for review
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC submitted
 */
kycRouter.post('/submit', requireFeature(FEATURES.SUBMIT_KYC), kycController.submit);

/**
 * @swagger
 * /kyc/admin/queue:
 *   get:
 *     summary: Get KYC review queue (Admin)
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC queue
 */
kycRouter.get('/admin/queue', requireRole(['PLATFORM_ADMIN', 'SUPPORT_AGENT']), kycController.getQueue);

/**
 * @swagger
 * /kyc/admin/{id}/review:
 *   post:
 *     summary: Review KYC application (Admin)
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - decision
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC reviewed
 */
kycRouter.post('/admin/:id/review', requireRole(['PLATFORM_ADMIN', 'SUPPORT_AGENT']), kycController.review);