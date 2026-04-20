import { Router } from 'express';
import { propertyController } from './property.controller';
import { authenticateToken } from '../../shared/middleware/auth';
import { requireFeature } from '../../shared/middleware/feature';
import { FEATURES } from '../../core/permissions/permission.constants';

export const propertyRouter = Router();

// All property routes require authentication
propertyRouter.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Property Discovery
 *   description: Listing, Searching, and express interest in rental properties
 */

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: List and search properties with advanced filters
 *     tags: [Property Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Keyword search in title/desc
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: integer }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: integer }
 *       - in: query
 *         name: bedrooms
 *         schema: { type: integer }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [APARTMENT, VILLA, INDEPENDENT_HOUSE, PG, OFFICE, SHOP] }
 *       - in: query
 *         name: furnishing
 *         schema: { type: string, enum: [UNFURNISHED, SEMI_FURNISHED, FURNISHED] }
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *       - in: query
 *         name: radiusKm
 *         schema: { type: number, default: 10 }
 *       - in: query
 *         name: my
 *         schema: { type: boolean }
 *         description: Set to true to see only your own properties
 *     responses:
 *       200:
 *         description: List of properties matching filters
 */
propertyRouter.get('/', requireFeature(FEATURES.VIEW_PROPERTY), propertyController.list);

/**
 * @swagger
 * /properties/interests:
 *   get:
 *     summary: List all property inquiries (leads for landlords, interests for tenants)
 *     tags: [Property Discovery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of interests
 */
propertyRouter.get('/interests', propertyController.listInterests);

/**
 * @swagger
 * /properties/{id}:
 *   get:
 *     summary: Get property details
 *     tags: [Property Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Property object with bookmark status
 */
propertyRouter.get('/:id', requireFeature(FEATURES.VIEW_PROPERTY), propertyController.get);

/**
 * @swagger
 * /properties:
 *   post:
 *     summary: Create a new property listing
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, address, city, state, postalCode, price]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               postalCode: { type: string }
 *               price: { type: integer }
 *               bedrooms: { type: integer }
 *               bathrooms: { type: number }
 *               category: { type: string, enum: [APARTMENT, VILLA, INDEPENDENT_HOUSE, PG, OFFICE, SHOP] }
 *               furnishing: { type: string, enum: [UNFURNISHED, SEMI_FURNISHED, FURNISHED] }
 *               photoUrls: { type: array, items: { type: string } }
 *               amenities: { type: array, items: { type: string } }
 *               lat: { type: number }
 *               lng: { type: number }
 *               availableFrom: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Property created successfully
 */
propertyRouter.post('/', requireFeature(FEATURES.CREATE_PROPERTY), propertyController.create);

/**
 * @swagger
 * /properties/{id}:
 *   put:
 *     summary: Update property listing
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Property updated
 */
propertyRouter.put('/:id', requireFeature(FEATURES.UPDATE_PROPERTY), propertyController.update);

/**
 * @swagger
 * /properties/{id}/bookmark:
 *   post:
 *     summary: Toggle bookmark for a property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Bookmark state toggled
 */
propertyRouter.post('/:id/bookmark', propertyController.toggleBookmark);

/**
 * @swagger
 * /properties/{id}/interest:
 *   post:
 *     summary: Express interest in a property (Lead Generation)
 *     tags: [Properties]
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
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Interest recorded and landlord notified
 */
propertyRouter.post('/:id/interest', propertyController.expressInterest);

/**
 * @swagger
 * /properties/{id}:
 *   delete:
 *     tags: [Property Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Property deleted
 */
propertyRouter.delete('/:id', requireFeature(FEATURES.DELETE_PROPERTY), propertyController.delete);
