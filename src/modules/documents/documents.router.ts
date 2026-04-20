import { Router } from 'express';
import { documentsController } from './documents.controller';
import { authenticateToken } from '../../shared/middleware/auth';
import { requireFeature } from '../../shared/middleware/feature';
import { FEATURES } from '../../core/permissions/permission.constants';

export const documentsRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Document Vault
 *   description: Centralized storage with permissions and OCR metadata
 */

documentsRouter.use(authenticateToken);

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: List and search documents based on permissions
 *     tags: [Document Vault]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [AGREEMENTS, KYC, PAYMENTS, MOVE_IN, EXIT, SOCIETY, OTHER] }
 *       - in: query
 *         name: tenancyId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: q
 *         schema: { type: string, description: "Search by document name" }
 *     responses:
 *       200:
 *         description: List of accessible documents
 */
documentsRouter.get('/', requireFeature(FEATURES.VIEW_DOCUMENTS), documentsController.list);

/**
 * @swagger
 * /documents/alerts/expiry:
 *   get:
 *     summary: Get alerts for documents expiring in the next 30 days
 *     tags: [Document Vault]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of expiring documents
 */
documentsRouter.get('/alerts/expiry', requireFeature(FEATURES.VIEW_DOCUMENTS), documentsController.getExpiryAlerts);

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Register a new document (triggers mock OCR for KYC/Agreements)
 *     tags: [Document Vault]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, name, fileUrl, fileType, fileSize]
 *             properties:
 *               category: { type: string, enum: [AGREEMENTS, KYC, PAYMENTS, MOVE_IN, EXIT, SOCIETY, OTHER] }
 *               name: { type: string }
 *               fileUrl: { type: string }
 *               fileType: { type: string }
 *               fileSize: { type: integer }
 *               permission: { type: string, enum: [OWNER_ONLY, TENANT_LANDLORD, ALL_PARTIES, PUBLIC] }
 *               tenancyId: { type: string }
 *               expiryDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Document registered successfully
 */
documentsRouter.post('/', requireFeature(FEATURES.UPLOAD_DOCUMENT), documentsController.upload);

/**
 * @swagger
 * /documents/{id}/download:
 *   get:
 *     summary: Download document (Mocked redirect)
 *     tags: [Document Vault]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       302:
 *         description: Redirect to file storage URL
 *       404:
 *         description: Document not found or Access Denied
 */
documentsRouter.get('/:id/download', requireFeature(FEATURES.VIEW_DOCUMENTS), documentsController.download);

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Document Vault]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Document deleted
 */
documentsRouter.delete('/:id', requireFeature(FEATURES.UPLOAD_DOCUMENT), documentsController.delete);