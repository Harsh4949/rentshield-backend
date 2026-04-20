import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticateToken } from '../../shared/middleware/auth';

export const dashboardRouter = Router();

dashboardRouter.use(authenticateToken);

/**
 * @swagger
 * /dashboard/tenant:
 *   get:
 *     summary: Get tenant dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenant dashboard summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 kycStatus:
 *                   type: string
 *                   enum: [NOT_STARTED, IN_PROGRESS, SUBMITTED, PENDING_REVIEW, APPROVED, REJECTED]
 *                 currentTenancy:
 *                   type: object
 *                   nullable: true
 *                 nextRentDue:
 *                   type: object
 *                   nullable: true
 *                 moveInWidget:
 *                   type: object
 *                   nullable: true
 *                 exitWidget:
 *                   type: object
 *                   nullable: true
 *                 openMaintenanceCount:
 *                   type: integer
 *                 openDisputesCount:
 *                   type: integer
 *                 quickActions:
 *                   type: array
 *                   items:
 *                     type: object
 */
dashboardRouter.get('/tenant', dashboardController.getTenantDashboard);