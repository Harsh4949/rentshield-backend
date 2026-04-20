import { Router } from 'express';
import { chatController } from './chat.controller';
import { authenticateToken } from '../../shared/middleware/auth';

export const chatRouter = Router();

chatRouter.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Real-time messaging between tenants and landlords
 */

/**
 * @swagger
 * /chat/sessions:
 *   post:
 *     summary: Create a new chat session linked to a tenancy or maintenance request
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetType, targetId]
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum: [TENANCY, MAINTENANCE]
 *               targetId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Chat session created
 *       400:
 *         description: Validation error or permission denied
 *   get:
 *     summary: List all chat sessions the current user participates in
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat sessions with last message preview
 */
chatRouter.post('/sessions', chatController.createSession);
chatRouter.get('/sessions', chatController.listSessions);

/**
 * @swagger
 * /chat/sessions/{sessionId}/messages:
 *   get:
 *     summary: Get all messages for a chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages in chronological order
 *       403:
 *         description: Not a participant or session not found
 */
chatRouter.get('/sessions/:sessionId/messages', chatController.getMessages);
