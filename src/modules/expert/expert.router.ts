import { Router } from 'express';
import { expertController } from './expert.controller';
import { authenticateToken } from '../../shared/middleware/auth';

export const expertRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Local Expert Marketplace
 *   description: Concierge service for discovering and booking verified professionals
 */

expertRouter.use(authenticateToken);

/**
 * @swagger
 * /experts:
 *   get:
 *     summary: Discover expert service providers
 *     tags: [Local Expert Marketplace]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: verified
 *         schema: { type: boolean }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses: { 200: { description: List of experts } }
 */
expertRouter.get('/', expertController.listExperts);

/**
 * @swagger
 * /experts/categories:
 *   get:
 *     summary: List all service categories
 *     tags: [Local Expert Marketplace]
 *     responses: { 200: { description: List of categories } }
 */
expertRouter.get('/categories', expertController.listCategories);

/**
 * @swagger
 * /experts/bookings:
 *   get:
 *     summary: View booking history
 *     tags: [Local Expert Marketplace]
 *     responses: { 200: { description: List of bookings } }
 */
expertRouter.get('/bookings', expertController.listBookings);

/**
 * @swagger
 * /experts/{id}:
 *   get:
 *     summary: View expert profile and reviews
 *     tags: [Local Expert Marketplace]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses: { 200: { description: Expert profile } }
 */
expertRouter.get('/:id', expertController.getExpert);

/**
 * @swagger
 * /experts/{id}/book:
 *   post:
 *     summary: Request a service booking (triggers automated chat)
 *     tags: [Local Expert Marketplace]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description, scheduledAt]
 *             properties:
 *               description: { type: string }
 *               scheduledAt: { type: string, format: date-time }
 *     responses: { 201: { description: Booking created } }
 */
expertRouter.post('/:id/book', expertController.createBooking);

/**
 * @swagger
 * /experts/bookings/{id}/status:
 *   post:
 *     summary: Confirm or update booking status (triggers payment generation on confirmation)
 *     tags: [Local Expert Marketplace]
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
 *               status: { type: string, enum: [CONFIRMED, COMPLETED, CANCELLED] }
 *               finalPrice: { type: number, description: "Required when status is CONFIRMED" }
 *     responses: { 200: { description: Booking updated } }
 */
expertRouter.post('/bookings/:id/status', expertController.updateBookingStatus);

/**
 * @swagger
 * /experts/{id}/reviews:
 *   post:
 *     summary: Submit a review for an expert (post-service)
 *     tags: [Local Expert Marketplace]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses: { 201: { description: Review added } }
 */
expertRouter.post('/:id/reviews', expertController.addReview);
