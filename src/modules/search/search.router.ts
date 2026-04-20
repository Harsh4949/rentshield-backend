import { Router } from 'express';
import { searchController } from './search.controller';

export const searchRouter = Router();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search properties
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
searchRouter.get('/', searchController.query);
