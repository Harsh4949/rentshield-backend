import { Router } from 'express';
import { agreementController } from './agreement.controller';
import { authenticateToken } from '../../shared/middleware/auth';

export const agreementRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Smart Agreements
 *   description: Digital legal agreements with state-specific templates, e-signatures, and e-stamping
 */

agreementRouter.use(authenticateToken);

/**
 * @swagger
 * /agreements/templates:
 *   get:
 *     summary: List available agreement templates
 *     tags: [Smart Agreements]
 *     parameters:
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *     responses: { 200: { description: List of templates } }
 */
agreementRouter.get('/templates', agreementController.listTemplates);

/**
 * @swagger
 * /agreements/generate:
 *   post:
 *     summary: Generate a draft agreement from a template (Dynamic Merge)
 *     tags: [Smart Agreements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenancyId, templateId]
 *             properties:
 *               tenancyId: { type: string, format: uuid }
 *               templateId: { type: string, format: uuid }
 *     responses: { 201: { description: Agreement generated } }
 */
agreementRouter.post('/generate', agreementController.generate);

/**
 * @swagger
 * /agreements/sign:
 *   post:
 *     summary: Submit a digital signature (supports Type or Draw modes)
 *     tags: [Smart Agreements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [agreementId, type, signatureData]
 *             properties:
 *               agreementId: { type: string, format: uuid }
 *               type: { type: string, enum: [TYPE, DRAW] }
 *               signatureData: { type: string, description: "Typed name or base64 drawn image" }
 *     responses: { 201: { description: Signature recorded } }
 */
agreementRouter.post('/sign', agreementController.sign);

/**
 * @swagger
 * /agreements/{id}/stamp:
 *   post:
 *     summary: Apply digital stamping and registration (Admin/Finalize)
 *     tags: [Smart Agreements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses: { 200: { description: Agreement stamped and registered } }
 */
agreementRouter.post('/:id/stamp', agreementController.stamp);
