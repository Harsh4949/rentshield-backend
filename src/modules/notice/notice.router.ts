import { Router } from 'express';
import { noticeController } from './notice.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';

export const noticeRouter = Router();

noticeRouter.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Society Management
 *   description: Digital Gate (DG) NoticeBoard and society settings
 */

/**
 * @swagger
 * /notices:
 *   get:
 *     summary: List notices relevant to the current user (pinned first)
 *     tags: [Society Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notices with read status
 *   post:
 *     summary: Create a new notice (Admin only)
 *     tags: [Society Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               type: { type: string, enum: [INFO, WARNING, URGENT], default: INFO }
 *               category: { type: string }
 *               isPinned: { type: boolean, default: false }
 *               expiryDate: { type: string, format: date-time }
 *               societyId: { type: string, format: uuid }
 *               buildingId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Notice created
 *       403:
 *         description: Permission denied
 */
noticeRouter.get('/', noticeController.listNotices);
noticeRouter.post('/', requireRole(['PLATFORM_ADMIN', 'SOCIETY_ADMIN']), noticeController.createNotice);

/**
 * @swagger
 * /notices/{id}:
 *   get:
 *     summary: Get full notice details
 *     tags: [Society Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notice object
 *       404:
 *         description: Notice not found
 */
noticeRouter.get('/:id', noticeController.getNotice);

/**
 * @swagger
 * /notices/{id}/read:
 *   post:
 *     summary: Mark a notice as read
 *     tags: [Society Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Successfully marked as read
 */
noticeRouter.post('/:id/read', noticeController.markAsRead);
