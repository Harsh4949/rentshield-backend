import { Router } from 'express';
import { supportController } from './support.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';

export const supportRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Support
 *   description: Support Hub — Knowledge Base articles and ticketing system
 */

// ─── Public: Knowledge Base ──────────────────────────────────────
/**
 * @swagger
 * /support/kb:
 *   get:
 *     summary: Search knowledge base articles
 *     tags: [Support]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (searches title and content)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of matching published articles
 */
supportRouter.get('/kb', supportController.searchKb);

/**
 * @swagger
 * /support/kb/{slug}:
 *   get:
 *     summary: Get a knowledge base article by slug
 *     tags: [Support]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full article content
 *       404:
 *         description: Article not found
 */
supportRouter.get('/kb/:slug', supportController.getKbArticle);

/**
 * @swagger
 * /support/kb/{id}/vote:
 *   post:
 *     summary: Vote helpful or not helpful on a KB article
 *     tags: [Support]
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
 *             required: [helpful]
 *             properties:
 *               helpful:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Vote recorded
 */
supportRouter.post('/kb/:id/vote', authenticateToken, supportController.voteKbArticle);

// ─── Agent/Admin: KB management ──────────────────────────────────
/**
 * @swagger
 * /support/kb:
 *   post:
 *     summary: Create a KB article (Agent/Admin)
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slug, category, content]
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               category:
 *                 type: string
 *               content:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Article created
 */
supportRouter.post('/kb', authenticateToken, requireRole(['SUPPORT_AGENT', 'PLATFORM_ADMIN']), supportController.createKbArticle);

/**
 * @swagger
 * /support/kb/{id}:
 *   patch:
 *     summary: Update a KB article (Agent/Admin)
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Article updated
 */
supportRouter.patch('/kb/:id', authenticateToken, requireRole(['SUPPORT_AGENT', 'PLATFORM_ADMIN']), supportController.updateKbArticle);

// ─── Authenticated: Tickets ──────────────────────────────────────
/**
 * @swagger
 * /support/tickets:
 *   post:
 *     summary: Create a support ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic, description]
 *             properties:
 *               topic:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket created
 *   get:
 *     summary: List current user's support tickets
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tickets with last message and CSAT
 */
supportRouter.post('/tickets', authenticateToken, supportController.createTicket);
supportRouter.get('/tickets', authenticateToken, supportController.listTickets);

/**
 * @swagger
 * /support/tickets/{id}:
 *   get:
 *     summary: Get ticket details with full message thread
 *     tags: [Support]
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
 *         description: Ticket with all messages
 *       403:
 *         description: Permission denied
 */
supportRouter.get('/tickets/:id', authenticateToken, supportController.getTicketDetails);

/**
 * @swagger
 * /support/tickets/{id}/messages:
 *   post:
 *     summary: Reply to a support ticket thread
 *     tags: [Support]
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
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message added to ticket thread
 */
supportRouter.post('/tickets/:id/messages', authenticateToken, supportController.addMessage);

/**
 * @swagger
 * /support/tickets/{id}/csat:
 *   post:
 *     summary: Submit CSAT feedback after ticket resolution
 *     tags: [Support]
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
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: CSAT feedback submitted
 *       400:
 *         description: Ticket not yet resolved
 */
supportRouter.post('/tickets/:id/csat', authenticateToken, supportController.submitCsat);

// ─── Agent/Admin: Ticket management ─────────────────────────────
/**
 * @swagger
 * /support/tickets/{id}/status:
 *   patch:
 *     summary: Update ticket status and optionally assign to agent (Agent/Admin only)
 *     tags: [Support]
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
 *                 enum: [OPEN, IN_PROGRESS, WAITING_ON_CUSTOMER, RESOLVED, CLOSED]
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Ticket updated
 */
supportRouter.patch(
  '/tickets/:id/status',
  authenticateToken,
  requireRole(['SUPPORT_AGENT', 'PLATFORM_ADMIN']),
  supportController.updateStatus,
);
