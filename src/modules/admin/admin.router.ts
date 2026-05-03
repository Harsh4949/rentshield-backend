import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';

export const adminRouter = Router();

adminRouter.use(authenticateToken);
adminRouter.use(requireRole(['PLATFORM_ADMIN']));

/**
 * @swagger
 * /admin/modules:
 *   get:
 *     summary: List all modules
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of modules with features
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 modules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Module'
 */
adminRouter.get('/modules', adminController.listModules);

/**
 * @swagger
 * /admin/modules/{id}/toggle:
 *   patch:
 *     summary: Toggle module enabled status
 *     tags: [Admin]
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
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Module status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 module:
 *                   $ref: '#/components/schemas/Module'
 */
adminRouter.patch('/modules/:id/toggle', adminController.toggleModule);

/**
 * @swagger
 * /admin/modules:
 *   post:
 *     summary: Create a new system module
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               label:
 *                 type: string
 *     responses:
 *       201:
 *         description: Module created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 module:
 *                   $ref: '#/components/schemas/Module'
 */
adminRouter.post('/modules', adminController.createModule);

/**
 * @swagger
 * /admin/modules/{id}:
 *   patch:
 *     summary: Update module details
 *     tags: [Admin]
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
 *             properties:
 *               name:
 *                 type: string
 *               label:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Module updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 module:
 *                   $ref: '#/components/schemas/Module'
 */
adminRouter.patch('/modules/:id', adminController.updateModule);

/**
 * @swagger
 * /admin/modules/{id}:
 *   delete:
 *     summary: Delete a module and its features
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
adminRouter.delete('/modules/:id', adminController.deleteModule);

/**
 * @swagger
 * /admin/features:
 *   get:
 *     summary: List all features
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: moduleId
 *         schema:
 *           type: string
 *         description: Filter by module ID
 *     responses:
 *       200:
 *         description: List of features
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 features:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feature'
 */
adminRouter.get('/features', adminController.listFeatures);

/**
 * @swagger
 * /admin/features:
 *   post:
 *     summary: Create a new feature in a module
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, moduleId]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               moduleId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feature created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feature:
 *                   $ref: '#/components/schemas/Feature'
 */
adminRouter.post('/features', adminController.createFeature);

/**
 * @swagger
 * /admin/features/{id}:
 *   patch:
 *     summary: Update feature details
 *     tags: [Admin]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feature updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feature:
 *                   $ref: '#/components/schemas/Feature'
 */
adminRouter.patch('/features/:id', adminController.updateFeature);

/**
 * @swagger
 * /admin/features/{id}:
 *   delete:
 *     summary: Delete a feature
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feature deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
adminRouter.delete('/features/:id', adminController.deleteFeature);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users (filtered)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by UserRole
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
adminRouter.get('/users', adminController.listUsers);

/**
 * @swagger
 * /admin/roles/{role}/features:
 *   get:
 *     summary: List features assigned to a role
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of assigned features
 *   post:
 *     summary: Assign a feature to a role
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [featureId]
 *             properties:
 *               featureId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feature assigned
 */
adminRouter.get('/roles/:role/features', adminController.listRoleFeatures);
adminRouter.post('/roles/:role/features', adminController.assignFeatureToRole);

/**
 * @swagger
 * /admin/roles/{role}/features/{featureId}:
 *   delete:
 *     summary: Revoke a feature from a role
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: featureId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feature revoked
 */
adminRouter.delete('/roles/:role/features/:featureId', adminController.revokeFeatureFromRole);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Admin]
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User role updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
adminRouter.patch('/users/:id/role', adminController.updateUserRole);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Update user active status
 *     tags: [Admin]
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
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
adminRouter.patch('/users/:id/status', adminController.updateUserStatus);
adminRouter.patch('/users/:id', adminController.updateUser);
adminRouter.delete('/users/:id', adminController.deleteUser);

/**
 * @swagger
 * /admin/kyc:
 *   get:
 *     summary: List KYC submissions
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by KycStatus
 *     responses:
 *       200:
 *         description: List of KYC submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       status: { type: string }
 *                       user: { type: object }
 */
adminRouter.get('/kyc', adminController.listKyc);

/**
 * @swagger
 * /admin/kyc/{id}/review:
 *   patch:
 *     summary: Review KYC submission
 *     tags: [Admin]
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
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC submission reviewed
 */
adminRouter.patch('/kyc/:id/review', adminController.reviewKyc);

/**
 * @swagger
 * /admin/properties:
 *   get:
 *     summary: List all properties (global)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: All properties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 properties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Property'
 */
adminRouter.get('/properties', adminController.listProperties);

/**
 * @swagger
 * /admin/properties/{id}/toggle-publish:
 *   patch:
 *     summary: Force toggle property publish status
 *     tags: [Admin]
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
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Property publish status updated
 */
adminRouter.patch('/properties/:id/toggle-publish', adminController.togglePropertyPublish);
adminRouter.patch('/properties/:id', adminController.updateProperty);
adminRouter.delete('/properties/:id', adminController.deleteProperty);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get system statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: System statistics report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     users: { type: integer }
 *                     properties: { type: integer }
 *                     pendingKyc: { type: integer }
 *                     revenue: { type: number }
 */
adminRouter.get('/stats', adminController.getStats);

/**
 * @swagger
 * /admin/roles/matrix:
 *   get:
 *     summary: Get full role-permissions matrix (all roles × all features)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Role permissions matrix
 */
adminRouter.get('/roles/matrix', adminController.getRolePermissionsMatrix);

/**
 * @swagger
 * /admin/modules/seed:
 *   post:
 *     summary: Seed default platform modules into the database if none exist
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Seed result
 */
adminRouter.post('/modules/seed', adminController.seedDefaultModules);
