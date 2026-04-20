import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';

export const paymentsRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Payment Vault
 *   description: Financial records, partial payments, and dynamic receipts
 */

// All routes require authentication
paymentsRouter.use(authenticateToken);

/**
 * @swagger
 * /payments/trigger-billing:
 *   post:
 *     summary: Trigger monthly rent generation for all active tenancies (Admin only)
 *     tags: [Payment Vault]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success message with count of generated records
 */
paymentsRouter.post('/trigger-billing', requireRole(['PLATFORM_ADMIN']), paymentsController.triggerMonthlyBilling);

/**
 * @swagger
 * /payments/due:
 *   get:
 *     summary: List all pending and partially paid payments for the current user
 *     tags: [Payment Vault]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 */
paymentsRouter.get('/due', paymentsController.getDue);

/**
 * @swagger
 * /payments/ledger/{tenancyId}:
 *   get:
 *     summary: Get financial history (ledger) for a specific tenancy
 *     tags: [Payment Vault]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenancyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Ledger entries
 */
paymentsRouter.get('/ledger/:tenancyId', paymentsController.getLedger);

/**
 * @swagger
 * /payments/{id}/pay:
 *   post:
 *     summary: Initiate or make a partial payment towards a record
 *     tags: [Payment Vault]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number, description: "Optional amount for partial payment. Defaults to full balance." }
 *     responses:
 *       200:
 *         description: Result of payment processing
 */
paymentsRouter.post('/:id/pay', paymentsController.initiatePayment);

/**
 * @swagger
 * /payments/{id}/receipt:
 *   get:
 *     summary: Download a dynamic PDF receipt for a payment record
 *     tags: [Payment Vault]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: PDF file stream
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 */
paymentsRouter.get('/:id/receipt', paymentsController.downloadReceipt);

/**
 * @swagger
 * /payments/plan:
 *   post:
 *     summary: Create a Payment Plan (Rent setup) for a tenancy
 *     tags: [Payment Vault]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenancyId, rentAmount, dueDay, depositAmount]
 *             properties:
 *               tenancyId: { type: string }
 *               rentAmount: { type: number }
 *               dueDay: { type: integer, minimum: 1, maximum: 31 }
 *               depositAmount: { type: number }
 *     responses:
 *       201:
 *         description: Plan created
 */
paymentsRouter.post('/plan', requireRole(['LANDLORD', 'PLATFORM_ADMIN']), paymentsController.createPlan);