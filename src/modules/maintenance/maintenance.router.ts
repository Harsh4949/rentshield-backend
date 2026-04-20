import { Router } from 'express';
import { maintenanceController } from './maintenance.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';

export const maintenanceRouter = Router();

maintenanceRouter.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Maintenance
 *   description: Maintenance request management for tenants and landlords
 */

/**
 * @swagger
 * /maintenance:
 *   post:
 *     summary: Create a new maintenance request (Tenant only)
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenancyId, title, description]
 *             properties:
 *               tenancyId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *     responses:
 *       201:
 *         description: Maintenance request created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Only tenants can create requests
 */
maintenanceRouter.post(
  '/',
  requireRole(['TENANT']),
  maintenanceController.createRequest
);

/**
 * @swagger
 * /maintenance/tenant:
 *   get:
 *     summary: List maintenance requests for the current tenant
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenancyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by tenancy
 *     responses:
 *       200:
 *         description: List of maintenance requests
 */
maintenanceRouter.get(
  '/tenant',
  requireRole(['TENANT']),
  maintenanceController.listTenantRequests
);

/**
 * @swagger
 * /maintenance/landlord:
 *   get:
 *     summary: List all maintenance requests for the landlord's properties
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by property
 *     responses:
 *       200:
 *         description: List of maintenance requests with tenant info
 */
maintenanceRouter.get(
  '/landlord',
  requireRole(['LANDLORD', 'PROPERTY_MANAGER', 'SOCIETY_ADMIN']),
  maintenanceController.listLandlordRequests
);

/**
 * @swagger
 * /maintenance/{id}/status:
 *   patch:
 *     summary: Update status and/or priority of a maintenance request
 *     tags: [Maintenance]
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
 *                 enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *     responses:
 *       200:
 *         description: Updated maintenance request
 *       403:
 *         description: Permission denied
 */
maintenanceRouter.patch(
  '/:id/status',
  requireRole(['LANDLORD', 'PROPERTY_MANAGER', 'SOCIETY_ADMIN', 'SUPPORT_AGENT']),
  maintenanceController.updateStatus
);
