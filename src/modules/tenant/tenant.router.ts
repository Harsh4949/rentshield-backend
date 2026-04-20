import { Router } from 'express';
import { tenantController } from './tenant.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';

export const tenantRouter = Router();

// All tenant routes require authentication and TENANT role
tenantRouter.use(authenticateToken);
tenantRouter.use(requireRole(['TENANT']));

/**
 * @swagger
 * /tenant/dashboard:
 *   get:
 *     summary: Get dashboard summary for the tenant
 *     tags: [Tenant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 */
tenantRouter.get('/dashboard', tenantController.getDashboard);

/**
 * @swagger
 * /tenant/tenancies:
 *   get:
 *     summary: List all tenancies (leases) for the tenant
 *     tags: [Tenant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tenancies
 */
tenantRouter.get('/tenancies', tenantController.listTenancies);

/**
 * @swagger
 * /tenant/tenancies/{id}:
 *   get:
 *     summary: Get specific tenancy details
 *     tags: [Tenant]
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
 *         description: Tenancy details
 *       404:
 *         description: Tenancy not found
 */
tenantRouter.get('/tenancies/:id', tenantController.getTenancyDetails);

