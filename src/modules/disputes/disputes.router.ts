import { Router } from 'express';
import { disputesController } from './disputes.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';

export const disputesRouter = Router();

disputesRouter.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Disputes
 *   description: Raise and track disputes between tenants and landlords
 */

/**
 * @swagger
 * /disputes:
 *   post:
 *     summary: Create a new dispute (Tenant only)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenancyId, categoryId, description]
 *             properties:
 *               tenancyId:
 *                 type: string
 *                 format: uuid
 *               categoryId:
 *                 type: string
 *                 enum: [RENT_PAYMENT, MAINTENANCE, DEPOSIT, EXIT, OTHER]
 *               description:
 *                 type: string
 *               paymentId:
 *                 type: string
 *                 format: uuid
 *               maintenanceRequestId:
 *                 type: string
 *                 format: uuid
 *               evidenceFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of mock file references (URLs injected server-side)
 *     responses:
 *       201:
 *         description: Dispute created with initial CREATED timeline event
 *       400:
 *         description: Validation error
 *   get:
 *     summary: List disputes for the current user (tenant or landlord)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of disputes with tenant, landlord, and property details
 */
disputesRouter.post('/', requireRole(['TENANT']), disputesController.createDispute);
disputesRouter.get('/', requireRole(['TENANT', 'LANDLORD']), disputesController.listDisputes);

/**
 * @swagger
 * /disputes/{id}:
 *   get:
 *     summary: Get dispute detail including full timeline events
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full dispute object with events
 *       403:
 *         description: Not authorized
 */
disputesRouter.get('/:id', disputesController.getDisputeDetails);

/**
 * @swagger
 * /disputes/{id}/events:
 *   post:
 *     summary: Add a timeline event to a dispute (message, proposal, decision, etc.)
 *     tags: [Disputes]
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
 *             required: [eventType, details]
 *             properties:
 *               eventType:
 *                 type: string
 *                 enum: [MESSAGE, PROPOSAL, DECISION, CLOSED]
 *               details:
 *                 type: object
 *               evidenceFile:
 *                 type: string
 *                 description: Mock file reference (URL injected server-side)
 *     responses:
 *       201:
 *         description: Event added to dispute timeline
 */
disputesRouter.post('/:id/events', disputesController.addEvent);

/**
 * @swagger
 * /disputes/{id}/status:
 *   patch:
 *     summary: Update dispute status (Support Agent / Platform Admin only)
 *     tags: [Disputes]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, UNDER_REVIEW, MEDIATION, RESOLVED, ESCALATED, CLOSED]
 *     responses:
 *       200:
 *         description: Dispute status updated
 */
disputesRouter.patch('/:id/status', requireRole(['SUPPORT_AGENT', 'PLATFORM_ADMIN']), disputesController.updateStatus);
