import { Router } from 'express';
import { societyController } from './society.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';

export const societyRouter = Router();

societyRouter.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Society Management
 *   description: Society-level configurations, rules, and resident directories
 */

/**
 * @swagger
 * /societies:
 *   get:
 *     summary: List all societies
 *     tags: [Society Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of societies
 *   post:
 *     summary: Create a new society (Platform Admin only)
 *     tags: [Society Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, city, state, postalCode]
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               postalCode: { type: string }
 *     responses:
 *       201:
 *         description: Society created
 *       403:
 *         description: Permission denied
 */
societyRouter.get('/', societyController.listSocieties);
societyRouter.post('/', requireRole(['PLATFORM_ADMIN']), societyController.createSociety);

/**
 * @swagger
 * /societies/{id}:
 *   get:
 *     summary: Get society details (rules, contacts, buildings)
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
 *         description: Full society object
 *       404:
 *         description: Society not found
 */
societyRouter.get('/:id', societyController.getSocietyDetails);

/**
 * @swagger
 * /societies/{id}/buildings:
 *   post:
 *     summary: Add a building to a society
 *     tags: [Society Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Building added
 */
societyRouter.post('/:id/buildings', requireRole(['PLATFORM_ADMIN', 'SOCIETY_ADMIN']), societyController.addBuilding);

/**
 * @swagger
 * /societies/{id}/rules:
 *   post:
 *     summary: Set society rules (replaces existing rules)
 *     tags: [Society Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required: [category, title, content]
 *               properties:
 *                 category: { type: string }
 *                 title: { type: string }
 *                 content: { type: string }
 *                 order: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Rules updated
 */
societyRouter.post('/:id/rules', requireRole(['PLATFORM_ADMIN', 'SOCIETY_ADMIN']), societyController.setRules);

/**
 * @swagger
 * /societies/{id}/contacts:
 *   post:
 *     summary: Add an emergency contact (can be building-specific)
 *     tags: [Society Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               description: { type: string }
 *               buildingId: { type: string, format: uuid, description: "Optional building ID" }
 *     responses:
 *       201:
 *         description: Contact added
 */
societyRouter.post('/:id/contacts', requireRole(['PLATFORM_ADMIN', 'SOCIETY_ADMIN']), societyController.addEmergencyContact);

/**
 * @swagger
 * /societies/{id}/residents:
 *   get:
 *     summary: List all residents of a society
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
 *         description: List of residents
 */
societyRouter.get('/:id/residents', requireRole(['PLATFORM_ADMIN', 'SOCIETY_ADMIN']), societyController.listResidents);

/**
 * @swagger
 * /societies/{id}/events:
 *   get:
 *     summary: List all upcoming society events
 *     tags: [Society Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses: { 200: { description: List of events } }
 *   post:
 *     summary: Create a new society event
 *     tags: [Society Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses: { 201: { description: Event created } }
 */
societyRouter.get('/:id/events', societyController.listEvents);
societyRouter.post('/:id/events', requireRole(['SOCIETY_ADMIN', 'PLATFORM_ADMIN']), societyController.createEvent);

/**
 * @swagger
 * /societies/{id}/amenities:
 *   get:
 *     summary: List all society amenities
 *     tags: [Society Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses: { 200: { description: List of amenities } }
 */
societyRouter.get('/:id/amenities', societyController.listAmenities);

/**
 * @swagger
 * /societies/{id}/amenities/book:
 *   post:
 *     summary: Book an amenity slot
 *     tags: [Society Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amenityId, startTime, endTime]
 *             properties:
 *               amenityId: { type: string, format: uuid }
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *     responses: { 201: { description: Slot booked } }
 */
societyRouter.post('/:id/amenities/book', societyController.bookAmenity);
