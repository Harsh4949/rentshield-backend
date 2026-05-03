import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticateToken } from '../../shared/middleware/auth';

export const notificationsRouter = Router();

notificationsRouter.use(authenticateToken);

/**
 * GET /api/notifications
 * List all notifications for the current user.
 * Query params: ?unreadOnly=true&limit=50
 */
notificationsRouter.get('/', notificationsController.list);

/**
 * GET /api/notifications/unread-count
 * Returns { unreadCount: number }
 */
notificationsRouter.get('/unread-count', notificationsController.unreadCount);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
notificationsRouter.patch('/read-all', notificationsController.markAllRead);

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
notificationsRouter.patch('/:id/read', notificationsController.markRead);

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
notificationsRouter.delete('/:id', notificationsController.delete);

/**
 * POST /api/notifications  (admin/system use)
 * Create a new notification for a user
 */
notificationsRouter.post('/', notificationsController.create);
