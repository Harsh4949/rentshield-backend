import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import { json, urlencoded } from 'express';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import { propertyRouter } from './modules/property/property.router';
import { searchRouter } from './modules/search/search.router';
import { authRouter } from './modules/auth/auth.router';
import { adminRouter } from './modules/admin/admin.router';
import { dashboardRouter } from './modules/dashboard/dashboard.router';
import { kycRouter } from './modules/kyc/kyc.router';
import { documentsRouter } from './modules/documents/documents.router';
import { paymentsRouter } from './modules/payments/payments.router';
import { tenantRouter } from './modules/tenant/tenant.router';
import { maintenanceRouter } from './modules/maintenance/maintenance.router';
import { chatRouter } from './modules/chat/chat.router';
import { disputesRouter } from './modules/disputes/disputes.router';
import { supportRouter } from './modules/support/support.router';
import { moveInRouter } from './modules/movein/movein.router';
import { exitRouter } from './modules/exit/exit.router';
import { societyRouter } from './modules/society/society.router';
import { noticeRouter } from './modules/notice/notice.router';
import { expertRouter } from './modules/expert/expert.router';
import { agreementRouter } from './modules/agreement/agreement.router';
import { errorHandler } from './shared/middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/properties', propertyRouter);
app.use('/api/search', searchRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/tenant', tenantRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/chat', chatRouter);
app.use('/api/disputes', disputesRouter);
app.use('/api/support', supportRouter);
app.use('/api/movein', moveInRouter);
app.use('/api/exit', exitRouter);
app.use('/api/societies', societyRouter);
app.use('/api/notices', noticeRouter);
app.use('/api/experts', expertRouter);
app.use('/api/agreements', agreementRouter);

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'rentshield-backend' });
});

// Error handling
app.use(errorHandler);

export default app;
