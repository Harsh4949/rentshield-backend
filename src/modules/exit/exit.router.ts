import { Router } from 'express';
import { exitController } from './exit.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';

export const exitRouter = Router();

exitRouter.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Exit
 *   description: Tenant exit and move-out request, inspection, and settlement lifecycle
 */

/**
 * @swagger
 * /exit:
 *   post:
 *     summary: Submit an exit request for a tenancy (Tenant only)
 *     tags: [Exit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenancyId, desiredMoveOutDate, reason]
 *             properties:
 *               tenancyId:
 *                 type: string
 *                 format: uuid
 *               desiredMoveOutDate:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *               comments:
 *                 type: string
 *     responses:
 *       201:
 *         description: Exit request created
 *       400:
 *         description: Already exists or validation error
 */
exitRouter.post('/', requireRole(['TENANT']), exitController.requestExit);

/**
 * @swagger
 * /exit/{tenancyId}:
 *   get:
 *     summary: Get exit request details for a tenancy (with inspection and settlement)
 *     tags: [Exit]
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
 *         description: Exit request with inspection items and settlement
 *       404:
 *         description: Exit request not found
 */
exitRouter.get('/:tenancyId', exitController.getExitRequest);

/**
 * @swagger
 * /exit/{id}/review:
 *   patch:
 *     summary: Landlord reviews the exit request (approve, reject, or propose alternate date)
 *     tags: [Exit]
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
 *                 enum: [APPROVED, REJECTED, DATE_PROPOSED]
 *               landlordNotes:
 *                 type: string
 *               alternateDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Exit request reviewed
 *       403:
 *         description: Permission denied (must be property owner)
 */
exitRouter.patch('/:id/review', requireRole(['LANDLORD', 'PLATFORM_ADMIN']), exitController.reviewExitRequest);

/**
 * @swagger
 * /exit/{id}/inspections:
 *   post:
 *     summary: Add a move-out inspection item comparing move-in vs move-out condition
 *     tags: [Exit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exit request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [room, itemName, moveInCondition, moveOutCondition]
 *             properties:
 *               room:
 *                 type: string
 *               itemName:
 *                 type: string
 *               moveInCondition:
 *                 type: string
 *                 enum: [GOOD, FAIR, DAMAGED]
 *               moveOutCondition:
 *                 type: string
 *                 enum: [GOOD, FAIR, DAMAGED]
 *               proposedCharge:
 *                 type: number
 *               notes:
 *                 type: string
 *               mockPhotos:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Inspection item added to exit report
 */
exitRouter.post('/:id/inspections', requireRole(['LANDLORD', 'PLATFORM_ADMIN']), exitController.addInspectionItem);

/**
 * @swagger
 * /exit/{id}/settlement:
 *   post:
 *     summary: Generate final settlement statement from inspection charges and deposit
 *     tags: [Exit]
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
 *         description: Settlement with deposit, charges, and calculated refund amount
 */
exitRouter.post('/:id/settlement', requireRole(['LANDLORD', 'PLATFORM_ADMIN']), exitController.generateSettlement);

/**
 * @swagger
 * /exit/{id}/settlement/accept:
 *   post:
 *     summary: Tenant or Landlord accepts the settlement statement
 *     tags: [Exit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exit request ID
 *     responses:
 *       200:
 *         description: Acceptance recorded. If both parties accept, tenancy is closed automatically.
 */
exitRouter.post('/:id/settlement/accept', requireRole(['TENANT', 'LANDLORD']), exitController.acceptSettlement);
