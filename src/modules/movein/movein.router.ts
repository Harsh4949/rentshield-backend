import { Router } from 'express';
import { moveInController } from './movein.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';

export const moveInRouter = Router();

moveInRouter.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Move-In
 *   description: Schedule and manage the tenant move-in process including checklists and inspections
 */

/**
 * @swagger
 * /movein:
 *   post:
 *     summary: Schedule a move-in for a tenancy (Tenant only)
 *     tags: [Move-In]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenancyId, scheduledAt]
 *             properties:
 *               tenancyId:
 *                 type: string
 *                 format: uuid
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 description: ISO 8601 date-time for the scheduled move-in
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Move-in scheduled with default checklist items pre-populated
 *       400:
 *         description: Already scheduled or validation error
 */
moveInRouter.post('/', requireRole(['TENANT']), moveInController.scheduleMoveIn);

/**
 * @swagger
 * /movein/{tenancyId}:
 *   get:
 *     summary: Get move-in details for a tenancy (including checklist and inspection items)
 *     tags: [Move-In]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenancyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Move-in with checklist and inspection report
 *       404:
 *         description: Move-in not found
 */
moveInRouter.get('/:tenancyId', moveInController.getMoveIn);

/**
 * @swagger
 * /movein/{moveInId}/checklist/{itemId}:
 *   patch:
 *     summary: Update a checklist item status (Tenant/Landlord)
 *     tags: [Move-In]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moveInId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
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
 *                 enum: [PENDING, COMPLETED, FLAGGED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checklist item updated
 */
moveInRouter.patch('/:moveInId/checklist/:itemId', moveInController.updateChecklistItem);

/**
 * @swagger
 * /movein/{moveInId}/inspections:
 *   post:
 *     summary: Add an inspection item to the move-in report
 *     tags: [Move-In]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moveInId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [room, itemName, condition]
 *             properties:
 *               room:
 *                 type: string
 *                 example: Living Room
 *               itemName:
 *                 type: string
 *                 example: Ceiling Fan
 *               condition:
 *                 type: string
 *                 enum: [GOOD, FAIR, DAMAGED]
 *               notes:
 *                 type: string
 *               mockPhotos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Mock photo references (server generates signed URLs)
 *     responses:
 *       201:
 *         description: Inspection item added
 */
moveInRouter.post('/:moveInId/inspections', moveInController.addInspectionItem);

/**
 * @swagger
 * /movein/{moveInId}/status:
 *   patch:
 *     summary: Update the overall move-in status (Landlord/Admin)
 *     tags: [Move-In]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moveInId
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
 *                 enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Move-in status updated
 */
moveInRouter.patch('/:moveInId/status', requireRole(['LANDLORD', 'PLATFORM_ADMIN', 'SOCIETY_ADMIN']), moveInController.updateStatus);

/**
 * @swagger
 * /movein/{moveInId}/complete:
 *   post:
 *     summary: Complete and sign off the move-in (validates all checklist items done)
 *     tags: [Move-In]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moveInId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Move-in completed successfully
 *       400:
 *         description: Checklist items still pending
 */
moveInRouter.post('/:moveInId/complete', requireRole(['LANDLORD', 'PLATFORM_ADMIN']), moveInController.completeMoveIn);
